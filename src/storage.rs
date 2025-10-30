//! Storage module for persisting events and resources using redb K/V store
//! and providing search capabilities via Tantivy.

use redb::{Database, ReadableTable, TableDefinition};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::path::Path;
use std::sync::Arc;
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
// Import Tantivy's `Value` trait under an alias so it does not conflict with serde_json::Value.
// The alias brings the trait into scope for `as_str()` calls on Tantivy document values.
use tantivy::schema::Value as TantivyValue;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexWriter, ReloadPolicy};
use tokio::sync::RwLock;

use crate::schemas::CloudEvent;

// Define redb tables
const EVENTS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("events");
const RESOURCES_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("resources");

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

        // Initialize tables
        let write_txn = db.begin_write()?;
        {
            let _ = write_txn.open_table(EVENTS_TABLE)?;
            let _ = write_txn.open_table(RESOURCES_TABLE)?;
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

    /// Store an event in the K/V store (with diagnostic logging)
    pub async fn store_event(&self, event: &CloudEvent) -> Result<(), Box<dyn std::error::Error>> {
        // Diagnostic: log attempt to store event
        println!(
            "[storage] attempt store_event: id={} type={} source={}",
            event.id, event.event_type, event.source
        );

        let record = EventRecord {
            id: event.id.clone(),
            event_type: event.event_type.clone(),
            source: event.source.clone(),
            subject: event.subject.clone(),
            time: event.time.clone(),
            sequence: event.sequence.clone(),
            data: serde_json::to_string(&event.data)?,
        };

        let serialized = bincode::serialize(&record)?;

        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(EVENTS_TABLE)?;
            table.insert(event.id.as_str(), serialized.as_slice())?;
        }
        write_txn.commit()?;

        // Diagnostic: confirm persisted to DB
        println!("[storage] persisted event to DB: id={}", event.id);

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

        // Spawn a background task to perform indexing asynchronously.
        tokio::spawn(async move {
            println!(
                "[storage][bg] start indexing event: id={}",
                event_for_index.id
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

            // Perform the add_document + commit, logging any error
            if let Err(e) = (|| -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
                writer.add_document(doc)?;
                // Commit deferred to periodic committer to reduce per-document latency
                Ok(())
            })() {
                eprintln!(
                    "[storage][bg] failed adding document for event id={} error={}",
                    event_for_index.id, e
                );
            } else {
                println!(
                    "[storage][bg] added doc for event id={} (commit deferred)",
                    event_for_index.id
                );
            }
        });

        Ok(())
    }

    /// Get an event by ID
    #[allow(dead_code)]
    pub async fn get_event(
        &self,
        id: &str,
    ) -> Result<Option<CloudEvent>, Box<dyn std::error::Error>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EVENTS_TABLE)?;

        let result = table.get(id)?;

        match result {
            Some(bytes) => {
                let rec: EventRecord = bincode::deserialize(bytes.value())?;
                let data: Option<JsonValue> = serde_json::from_str(&rec.data)?;
                Ok(Some(CloudEvent {
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
                }))
            }
            None => Ok(None),
        }
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

    // index_event removed: indexing is now performed asynchronously by background tasks.
    // This helper was kept during development but is no longer used.

    // index_resource removed: resource indexing is performed asynchronously by background tasks.
    // The per-document commit pattern was replaced by batched periodic commits to improve throughput.

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

    /// Get all events (paginated). Returns newest-first order by parsing CloudEvent.time.
    /// We load events from the DB, sort them by timestamp (descending), then apply
    /// offset and limit for pagination.
    pub async fn list_events(
        &self,
        offset: usize,
        limit: usize,
    ) -> Result<Vec<CloudEvent>, Box<dyn std::error::Error>> {
        use chrono::offset::Utc;
        use chrono::DateTime;

        // Collect all events first
        let mut all_events: Vec<CloudEvent> = Vec::new();

        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EVENTS_TABLE)?;

        let iter = table.iter()?;

        for item in iter {
            let (_, value) = item?;
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

            all_events.push(event);
        }

        // Sort by timestamp descending (newest first). If parsing fails or time missing,
        // treat as epoch 0 so they appear last.
        all_events.sort_by(|a, b| {
            let a_ts = a
                .time
                .as_deref()
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&Utc).timestamp())
                .unwrap_or(0);
            let b_ts = b
                .time
                .as_deref()
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&Utc).timestamp())
                .unwrap_or(0);
            b_ts.cmp(&a_ts)
        });

        // Apply pagination (offset, limit)
        let results: Vec<CloudEvent> = all_events.into_iter().skip(offset).take(limit).collect();

        Ok(results)
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

        storage.store_event(&event).await.unwrap();

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
