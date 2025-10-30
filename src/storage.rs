//! Storage module for persisting events and resources using redb K/V store
//! and providing search capabilities via Tantivy.
//!
//! Dead helpers and per-document commits were removed in favor of background indexing
//! with periodic commits to improve throughput and startup performance.

use redb::{Database, ReadableTable, TableDefinition};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::path::Path;
use std::sync::Arc;
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
// Import Tantivy's `Value` trait under an alias so it does not conflict with serde_json::Value.
// The alias brings the trait into scope for `as_str()` calls on Tantivy document values.
use tantivy::schema::Value;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexWriter, ReloadPolicy};
use tokio::sync::RwLock;

use crate::schemas::CloudEvent;

// Define redb tables
// EVENTS_BY_SEQ maps zero-padded sequence keys to serialized event records so iteration is lexicographic by sequence
const EVENTS_BY_SEQ_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("events_by_seq");
const RESOURCES_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("resources");
/// Meta table for storing counters and small metadata (e.g. last assigned sequence)
const META_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("meta");

/// Record for storing events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventRecord {
    pub id: String,
    pub event_type: String,
    pub source: String,
    pub subject: Option<String>,
    pub time: Option<String>,
    pub sequence: Option<String>,
    pub data: String, // JSON serialized
}

/// Record for storing resources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRecord {
    pub id: String,
    pub resource_type: String, // issue, comment, task, planning, document
    pub data: String,          // JSON serialized
    pub updated_at: String,
}

/// Storage layer combining redb K/V store and Tantivy search
pub struct Storage {
    db: Arc<Database>,
    search_index: Arc<Index>,
    search_writer: Arc<RwLock<IndexWriter>>,
    id_field: Field,
    type_field: Field,
    content_field: Field,
    timestamp_field: Field,
}

impl Storage {
    /// Create a new storage instance
    pub async fn new(data_dir: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        // Create directories
        let db_path = data_dir.join("data.redb");
        let index_path = data_dir.join("search_index");

        tokio::fs::create_dir_all(data_dir).await?;
        tokio::fs::create_dir_all(&index_path).await?;

        // Initialize redb database
        let db = Database::create(&db_path)?;

        // Initialize tables (include meta & sequence tables)
        let write_txn = db.begin_write()?;
        {
            let _ = write_txn.open_table(EVENTS_BY_SEQ_TABLE)?;
            let _ = write_txn.open_table(RESOURCES_TABLE)?;
            let _ = write_txn.open_table(META_TABLE)?;
        }
        write_txn.commit()?;

        // Initialize Tantivy search index
        let mut schema_builder = Schema::builder();
        let id_field = schema_builder.add_text_field("id", STRING | STORED);
        let type_field = schema_builder.add_text_field("type", STRING | STORED);
        let content_field = schema_builder.add_text_field("content", TEXT | STORED);
        let timestamp_field = schema_builder.add_date_field("timestamp", INDEXED | STORED);
        let schema = schema_builder.build();

        let index = if index_path.exists() && std::fs::read_dir(&index_path)?.next().is_some() {
            Index::open_in_dir(&index_path)?
        } else {
            Index::create_in_dir(&index_path, schema.clone())?
        };

        let search_writer_inner = index.writer(50_000_000)?; // 50MB heap
                                                             // Wrap the writer in an Arc<RwLock<_>> so we can share it with background commit task.
        let search_writer = Arc::new(RwLock::new(search_writer_inner));

        // Spawn a background periodic committer that flushes the writer every 10 seconds.
        // This allows many add_document calls to be batched into fewer commits,
        // reducing indexing latency during high-throughput operations (like startup seeding).
        {
            let writer_for_committer = search_writer.clone();
            tokio::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                    // Acquire write lock and commit; log errors but keep looping.
                    let mut w = writer_for_committer.write().await;
                    if let Err(err) = w.commit() {
                        eprintln!("[storage][bg] periodic commit failed: {}", err);
                    } else {
                        println!("[storage][bg] periodic commit completed");
                    }
                }
            });
        }

        Ok(Self {
            db: Arc::new(db),
            search_index: Arc::new(index),
            search_writer,
            id_field,
            type_field,
            content_field,
            timestamp_field,
        })
    }

    /// Store an event in the K/V store (with diagnostic logging) and assign a monotonically increasing sequence.
    /// Returns the assigned sequence string (zero-padded) on success.
    pub async fn store_event(
        &self,
        event: &CloudEvent,
    ) -> Result<String, Box<dyn std::error::Error>> {
        // Diagnostic: log attempt to store event
        println!(
            "[storage] attempt store_event: id={} type={} source={}",
            event.id, event.event_type, event.source
        );

        // Atomically get the next sequence number using the META_TABLE.
        // We perform this with a small write transaction that reads the last_seq value,
        // increments it, writes it back and commits. The new sequence is then returned.
        let seq = {
            // start a write txn to update the counter atomically
            let mut wtx = self.db.begin_write()?;
            // Read, compute and write within an inner scope so the table guard is dropped
            // before committing the transaction (avoids borrow conflicts).
            let next = {
                let mut meta = wtx.open_table(META_TABLE)?;

                // Try to read the last sequence value and convert to owned bytes immediately.
                let last_seq_bytes = match meta.get("last_seq")? {
                    Some(g) => Some(g.value().to_vec()),
                    None => None,
                };

                // Compute next sequence (u128) robustly
                let next_seq: u128 = if let Some(bytes) = last_seq_bytes {
                    match std::str::from_utf8(&bytes)
                        .ok()
                        .and_then(|s| s.parse::<u128>().ok())
                    {
                        Some(val) => val + 1,
                        None => 1u128,
                    }
                } else {
                    1u128
                };

                // store back the new last_seq as bytes
                meta.insert("last_seq", next_seq.to_string().as_bytes())?;

                // drop meta (end of inner scope) so we can commit safely
                next_seq
            };

            // commit the write transaction after the table guard has been dropped
            wtx.commit()?;

            next
        };

        // Create record and include sequence as string
        let record = EventRecord {
            id: event.id.clone(),
            event_type: event.event_type.clone(),
            source: event.source.clone(),
            subject: event.subject.clone(),
            time: event.time.clone(),
            sequence: Some(seq.to_string()),
            data: serde_json::to_string(&event.data)?,
        };

        let serialized = bincode::serialize(&record)?;

        // Write seq->record mapping (we store only sequence keyed records for ordered iteration)
        let write_txn = self.db.begin_write()?;
        {
            let mut seq_table = write_txn.open_table(EVENTS_BY_SEQ_TABLE)?;
            // create sequence key with fixed width (e.g. 020 digits) to ensure lexicographic ordering
            let seq_key = format!("{:020}", seq);
            seq_table.insert(seq_key.as_str(), serialized.as_slice())?;
        }
        write_txn.commit()?;

        // Diagnostic: confirm persisted to DB
        let seq_key = format!("{:020}", seq);
        println!(
            "[storage] persisted event to DB: id={} seq={}",
            event.id, seq_key
        );

        // Schedule background indexing for the event (do not block the store operation)
        println!(
            "[storage] scheduling background index for event: id={}",
            event.id
        );

        // Clone the pieces we need to move into the background task
        let event_for_index = event.clone();
        let search_writer = self.search_writer.clone();
        let id_field = self.id_field;
        let type_field = self.type_field;
        let content_field = self.content_field;
        let timestamp_field = self.timestamp_field;
        let seq_for_log = seq_key.clone();

        // Spawn a background task to perform indexing asynchronously.
        tokio::spawn(async move {
            println!(
                "[storage][bg] start indexing event: id={} seq={}",
                event_for_index.id, seq_for_log
            );

            // Build timestamp
            let timestamp = if let Some(time_str) = &event_for_index.time {
                chrono::DateTime::parse_from_rfc3339(time_str)
                    .ok()
                    .map(|dt| dt.with_timezone(&chrono::Utc))
            } else {
                Some(chrono::Utc::now())
            };

            // Create searchable content from event data (same logic as index_event)
            let content = format!(
                "{} {} {} {}",
                event_for_index.event_type,
                event_for_index.source,
                event_for_index.subject.as_deref().unwrap_or(""),
                event_for_index
                    .data
                    .as_ref()
                    .map(|v| v.to_string())
                    .unwrap_or_default()
            );

            // Acquire writer and add document
            let writer = search_writer.write().await;
            let mut doc = doc!(
                id_field => event_for_index.id.as_str(),
                type_field => event_for_index.event_type.as_str(),
                content_field => content.as_str(),
            );

            if let Some(ts) = timestamp {
                doc.add_date(
                    timestamp_field,
                    tantivy::DateTime::from_timestamp_secs(ts.timestamp()),
                );
            }

            // Perform the add_document (commit deferred to periodic committer)
            if let Err(e) = (|| -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
                writer.add_document(doc)?;
                // Commit deferred to periodic committer to reduce per-document latency
                Ok(())
            })() {
                eprintln!(
                    "[storage][bg] failed adding document for event id={} seq={} error={}",
                    event_for_index.id, seq_for_log, e
                );
            } else {
                println!(
                    "[storage][bg] added doc for event id={} seq={} (commit deferred)",
                    event_for_index.id, seq_for_log
                );
            }
        });

        // Return the assigned sequence key to the caller
        Ok(seq_key)
    }

    /// Get an event by ID (scan events_by_seq and return the matching event)
    #[allow(dead_code)]
    pub async fn get_event(
        &self,
        id: &str,
    ) -> Result<Option<CloudEvent>, Box<dyn std::error::Error>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EVENTS_BY_SEQ_TABLE)?;

        let iter = table.iter()?;
        for item in iter {
            let (_key, value) = item?;
            let rec: EventRecord = bincode::deserialize(value.value())?;
            if rec.id == id {
                let data: Option<JsonValue> = serde_json::from_str(&rec.data)?;
                return Ok(Some(CloudEvent {
                    specversion: "1.0".to_string(),
                    id: rec.id,
                    source: rec.source,
                    subject: rec.subject,
                    event_type: rec.event_type,
                    time: rec.time,
                    datacontenttype: Some("application/json".to_string()),
                    dataschema: None,
                    dataref: None,
                    sequence: rec.sequence,
                    sequencetype: None,
                    data,
                }));
            }
        }

        Ok(None)
    }

    /// Store a resource in the K/V store (with diagnostic logging)
    pub async fn store_resource(
        &self,
        id: &str,
        resource_type: &str,
        data: &JsonValue,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Diagnostic: log attempt to store resource
        println!(
            "[storage] attempt store_resource: id={} type={}",
            id, resource_type
        );

        let timestamp = chrono::Utc::now().to_rfc3339();

        let record = ResourceRecord {
            id: id.to_string(),
            resource_type: resource_type.to_string(),
            data: serde_json::to_string(data)?,
            updated_at: timestamp.clone(),
        };

        let serialized = bincode::serialize(&record)?;

        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(RESOURCES_TABLE)?;
            table.insert(id, serialized.as_slice())?;
        }
        write_txn.commit()?;

        // Diagnostic: confirm persisted to DB
        println!("[storage] persisted resource to DB: id={}", id);

        // Schedule background indexing for the resource (do not block the store operation)
        println!(
            "[storage] scheduling background index for resource: id={} type={}",
            id, resource_type
        );

        // Clone the pieces we need to move into the background task
        let resource_id = id.to_string();
        let resource_type_cloned = resource_type.to_string();
        let data_for_index = data.clone();
        let timestamp_for_index = timestamp.clone();
        let search_writer = self.search_writer.clone();
        let id_field = self.id_field;
        let type_field = self.type_field;
        let content_field = self.content_field;
        let timestamp_field = self.timestamp_field;

        tokio::spawn(async move {
            println!(
                "[storage][bg] start indexing resource: id={} type={}",
                resource_id, resource_type_cloned
            );

            // parse timestamp, fallback to now
            let ts = chrono::DateTime::parse_from_rfc3339(&timestamp_for_index)
                .ok()
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(chrono::Utc::now);

            // Create searchable content from resource data
            let content = data_for_index.to_string();

            // Acquire the writer and index document
            let writer = search_writer.write().await;
            let doc = doc!(
                id_field => resource_id.as_str(),
                type_field => resource_type_cloned.as_str(),
                content_field => content.as_str(),
                timestamp_field => tantivy::DateTime::from_timestamp_secs(ts.timestamp()),
            );

            if let Err(e) = (|| -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
                writer.add_document(doc)?;
                // Commit deferred to periodic committer to reduce per-document latency
                Ok(())
            })() {
                eprintln!(
                    "[storage][bg] failed adding document for resource id={} error={}",
                    resource_id, e
                );
            } else {
                println!(
                    "[storage][bg] added doc for resource id={} (commit deferred)",
                    resource_id
                );
            }
        });

        Ok(())
    }

    /// Get a resource by ID
    pub async fn get_resource(
        &self,
        id: &str,
    ) -> Result<Option<JsonValue>, Box<dyn std::error::Error>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(RESOURCES_TABLE)?;

        let result = table.get(id)?;

        match result {
            Some(bytes) => {
                let rec: ResourceRecord = bincode::deserialize(bytes.value())?;
                let data: JsonValue = serde_json::from_str(&rec.data)?;
                Ok(Some(data))
            }
            None => Ok(None),
        }
    }

    /// Delete a resource
    pub async fn delete_resource(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(RESOURCES_TABLE)?;
            table.remove(id)?;
        }
        write_txn.commit()?;

        // Remove from search index
        let mut writer = self.search_writer.write().await;
        writer.delete_term(Term::from_field_text(self.id_field, id));
        writer.commit()?;

        Ok(())
    }

    // Note: indexing is performed asynchronously by background tasks and commits are batched periodically.

    /// Search using Tantivy
    pub async fn search(
        &self,
        query_str: &str,
        limit: usize,
    ) -> Result<Vec<SearchResult>, Box<dyn std::error::Error>> {
        let reader = self
            .search_index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()?;

        let searcher = reader.searcher();

        let query_parser = QueryParser::for_index(&self.search_index, vec![self.content_field]);
        let query = query_parser.parse_query(query_str)?;

        let top_docs = searcher.search(&query, &TopDocs::with_limit(limit))?;

        let mut results = Vec::new();
        for (_score, doc_address) in top_docs {
            let retrieved_doc: tantivy::TantivyDocument = searcher.doc(doc_address)?;

            let id = retrieved_doc
                .get_first(self.id_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let doc_type = retrieved_doc
                .get_first(self.type_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let content = retrieved_doc
                .get_first(self.content_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            results.push(SearchResult {
                id,
                doc_type,
                content,
            });
        }

        Ok(results)
    }

    /// Get all resources (paginated)
    pub async fn list_resources(
        &self,
        offset: usize,
        limit: usize,
    ) -> Result<Vec<(String, JsonValue)>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();

        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(RESOURCES_TABLE)?;

        let mut count = 0;
        let iter = table.iter()?;

        for item in iter {
            let (key, value) = item?;

            if count >= offset {
                let rec: ResourceRecord = bincode::deserialize(value.value())?;
                let data: JsonValue = serde_json::from_str(&rec.data)?;
                results.push((key.value().to_string(), data));

                if results.len() >= limit {
                    break;
                }
            }
            count += 1;
        }

        Ok(results)
    }

    /// List events by sequence with pagination after a given sequence key.
    ///
    /// This function returns events in backend processing order (ascending by sequence).
    /// Use `after_seq` to fetch events after a particular zero-padded sequence key
    /// (e.g. "00000000000000000042"). If `after_seq` is `None`, iteration starts at the beginning.
    pub async fn list_events_after(
        &self,
        after_seq: Option<String>,
        limit: usize,
    ) -> Result<Vec<CloudEvent>, Box<dyn std::error::Error>> {
        // Read events by sequence lexicographic order from EVENTS_BY_SEQ_TABLE (ensures server processing order).
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EVENTS_BY_SEQ_TABLE)?;

        let mut results: Vec<CloudEvent> = Vec::new();

        let mut iter = table.iter()?;

        for item in iter {
            let (key, value) = item?;
            // If after_seq is provided, skip until key > after_seq
            if let Some(ref after) = after_seq {
                // key.value() returns &str; compare lexicographically
                if key.value() <= after.as_str() {
                    continue;
                }
            }

            let rec: EventRecord = bincode::deserialize(value.value())?;
            let data: Option<JsonValue> = serde_json::from_str(&rec.data)?;

            let event = CloudEvent {
                specversion: "1.0".to_string(),
                id: rec.id,
                source: rec.source,
                subject: rec.subject,
                event_type: rec.event_type,
                time: rec.time,
                datacontenttype: Some("application/json".to_string()),
                dataschema: None,
                dataref: None,
                sequence: rec.sequence,
                sequencetype: None,
                data,
            };

            results.push(event);
            if results.len() >= limit {
                break;
            }
        }

        Ok(results)
    }

    /// Backwards-compatible wrapper: list events by offset (legacy).
    /// This calls `list_events_after` by computing `after_seq` from offset = number to skip.
    /// Note: this wrapper is less efficient for large offsets and is provided for compatibility.
    pub async fn list_events(
        &self,
        offset: usize,
        limit: usize,
    ) -> Result<Vec<CloudEvent>, Box<dyn std::error::Error>> {
        // If offset is zero, simply return first `limit` events
        if offset == 0 {
            return self.list_events_after(None, limit).await;
        }

        // Otherwise, we need to skip `offset` keys - iterate and find the key at position `offset - 1`
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EVENTS_BY_SEQ_TABLE)?;
        let mut iter = table.iter()?;

        let mut seq_to_start: Option<String> = None;
        for (i, item) in iter.enumerate() {
            let (key, _value) = item?;
            if i + 1 == offset {
                seq_to_start = Some(key.value().to_string());
                break;
            }
        }

        // If we found the sequence key at offset-1, start after it; otherwise start from beginning
        let after_seq = seq_to_start.map(|s| s);
        self.list_events_after(after_seq, limit).await
    }
}

/// Search result structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub doc_type: String,
    pub content: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_storage_event_round_trip() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).await.unwrap();

        let event = CloudEvent {
            specversion: "1.0".to_string(),
            id: "test-event-1".to_string(),
            source: "test".to_string(),
            subject: Some("test-subject".to_string()),
            event_type: "test.event".to_string(),
            time: Some(chrono::Utc::now().to_rfc3339()),
            datacontenttype: Some("application/json".to_string()),
            dataschema: None,
            dataref: None,
            sequence: Some("1".to_string()),
            sequencetype: None,
            data: Some(serde_json::json!({"key": "value"})),
        };

        let _seq = storage.store_event(&event).await.unwrap();

        let retrieved = storage.get_event("test-event-1").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "test-event-1");
    }

    #[tokio::test]
    async fn test_storage_resource_round_trip() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).await.unwrap();

        let resource_data = serde_json::json!({
            "title": "Test Issue",
            "status": "open"
        });

        storage
            .store_resource("issue-1", "issue", &resource_data)
            .await
            .unwrap();

        let retrieved = storage.get_resource("issue-1").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap()["title"], "Test Issue");
    }

    #[tokio::test]
    async fn test_search() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).await.unwrap();

        let resource_data = serde_json::json!({
            "title": "Important Issue",
            "description": "This is a critical bug"
        });

        storage
            .store_resource("issue-1", "issue", &resource_data)
            .await
            .unwrap();

        // Give the index a moment to commit
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let results = storage.search("critical", 10).await.unwrap();
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_list_resources() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).await.unwrap();

        // Add multiple resources
        for i in 1..=5 {
            let resource_data = serde_json::json!({
                "title": format!("Issue {}", i),
                "status": "open"
            });
            storage
                .store_resource(&format!("issue-{}", i), "issue", &resource_data)
                .await
                .unwrap();
        }

        // List all
        let all_resources = storage.list_resources(0, 10).await.unwrap();
        assert_eq!(all_resources.len(), 5);

        // List with pagination
        let page1 = storage.list_resources(0, 2).await.unwrap();
        assert_eq!(page1.len(), 2);

        let page2 = storage.list_resources(2, 2).await.unwrap();
        assert_eq!(page2.len(), 2);
    }

    #[tokio::test]
    async fn test_delete_resource() {
        let temp_dir = TempDir::new().unwrap();
        let storage = Storage::new(temp_dir.path()).await.unwrap();

        let resource_data = serde_json::json!({
            "title": "Test Issue",
            "status": "open"
        });

        storage
            .store_resource("issue-1", "issue", &resource_data)
            .await
            .unwrap();

        // Verify it exists
        let retrieved = storage.get_resource("issue-1").await.unwrap();
        assert!(retrieved.is_some());

        // Delete it
        storage.delete_resource("issue-1").await.unwrap();

        // Verify it's gone
        let retrieved = storage.get_resource("issue-1").await.unwrap();
        assert!(retrieved.is_none());
    }
}
