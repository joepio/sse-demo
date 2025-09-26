use schemars::{schema_for, JsonSchema};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

/// CloudEvents specification struct
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CloudEvent {
    /// The version of the CloudEvents specification
    pub specversion: String,
    /// Identifies the event
    pub id: String,
    /// Identifies the context in which an event happened
    pub source: String,
    /// Identifies the subject of the event in the context of the event producer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject: Option<String>,
    /// The type of event related to the originating occurrence
    #[serde(rename = "type")]
    pub event_type: String,
    /// Timestamp of when the occurrence happened
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time: Option<String>,
    /// Content type of the data value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub datacontenttype: Option<String>,
    /// Schema that the data adheres to
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dataschema: Option<String>,
    /// Reference to external data location
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dataref: Option<String>,
    /// Sequence number for event ordering
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sequence: Option<String>,
    /// Type of sequence numbering used
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sequencetype: Option<String>,
    /// The event payload
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// Event data structure for item-based events
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ItemEventData {
    /// Type item (issue, task, comment, planning)
    pub item_type: ItemType,
    /// Unieke identifier van het item
    pub item_id: String,
    /// Volledige item data (voor create/update events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub item_data: Option<Value>,
    /// Patch data voor updates (alleen gewijzigde velden)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub patch: Option<Value>,
    /// Schema URL voor de item_data inhoud
    #[serde(skip_serializing_if = "Option::is_none")]
    pub itemschema: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ItemType {
    Issue,
    Comment,
    Task,
    Planning,
}

/// Document
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Document {
    /// Unieke document identifier
    pub id: String,
    /// Naam van het document
    pub title: String,
    /// URL naar het document. Moet downloaddbaar zijn
    pub url: String,
    /// Grootte in bytes
    pub size: u64,
}

/// Issue/Zaak structure
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Issue {
    /// Unieke zaak identifier
    pub id: String,
    /// Titel van de zaak - korte, duidelijke omschrijving
    pub title: String,
    /// Uitgebreide beschrijving van de zaak - wat is er aan de hand, welke stappen zijn ondernomen
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Huidige status van de zaak
    pub status: IssueStatus,
    /// Email adres van de toegewezen persoon (bijv. alice@gemeente.nl)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    /// Aanmaak tijdstip in ISO 8601 formaat
    pub created_at: String,
    /// Reden voor sluiting (alleen bij gesloten zaken)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
}

/// Task/Taak structure
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Task {
    /// Unieke taak identifier
    pub id: String,
    /// Actie tekst - korte beschrijving van wat er gedaan moet worden
    pub cta: String,
    /// Uitgebreide beschrijving van de taak - context, voorwaarden, instructies
    pub description: String,
    /// URL waar de taak uitgevoerd kan worden of meer informatie te vinden is
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// Of de taak voltooid is (true) of nog open staat (false)
    pub completed: bool,
    /// Deadline voor deze taak in YYYY-MM-DD formaat
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deadline: Option<String>,
    /// Email van degene die de taak heeft aangemaakt of toegewezen
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum IssueStatus {
    Open,
    #[serde(rename = "in_progress")]
    InProgress,
    Closed,
}

/// Comment/Reactie structure
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Comment {
    /// Unieke reactie identifier
    pub id: String,
    /// Inhoud van de reactie of opmerking
    pub content: String,
    /// Email van de auteur van de reactie
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    /// ID van de reactie waar dit een antwoord op is (voor threading)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    /// Email adressen van vermelde personen (bijv. ["alice@gemeente.nl", "bob@gemeente.nl"])
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mentions: Option<Vec<String>>,
}

/// Planning structure
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Planning {
    /// Unieke planning identifier
    pub id: String,
    /// Titel van de planning
    pub title: String,
    /// Beschrijving van de planning
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Planning momenten - verschillende fasen of mijlpalen
    pub moments: Vec<PlanningMoment>,
}

/// PlanningMoment structure
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct PlanningMoment {
    /// Unieke moment identifier
    pub id: String,
    /// Geplande datum in YYYY-MM-DD formaat
    pub date: String,
    /// Titel van dit planning moment (bijv. "Intake gesprek", "Documentcheck")
    pub title: String,
    /// Huidige status van dit moment
    pub status: PlanningStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlanningStatus {
    Completed,
    Current,
    Planned,
}

/// Resolve schema references recursively
fn resolve_schema_refs(mut schema: Value, all_schemas: &HashMap<String, Value>) -> Value {
    fn resolve_refs_recursive(value: &mut Value, schemas: &HashMap<String, Value>) {
        match value {
            Value::Object(map) => {
                // Handle direct $ref
                if let Some(ref_value) = map.get("$ref") {
                    if let Some(ref_str) = ref_value.as_str() {
                        if let Some(definition_name) = ref_str.strip_prefix("#/definitions/") {
                            if let Some(definition) = schemas.get(definition_name) {
                                *value = definition.clone();
                                resolve_refs_recursive(value, schemas);
                                return;
                            }
                        }
                    }
                }

                // Handle allOf with $ref patterns
                if let Some(Value::Array(all_of_array)) = map.get_mut("allOf") {
                    if all_of_array.len() == 1 {
                        if let Some(Value::Object(ref_obj)) = all_of_array.get(0) {
                            if let Some(ref_value) = ref_obj.get("$ref") {
                                if let Some(ref_str) = ref_value.as_str() {
                                    if let Some(definition_name) =
                                        ref_str.strip_prefix("#/definitions/")
                                    {
                                        if let Some(definition) = schemas.get(definition_name) {
                                            // Replace the allOf with the resolved definition
                                            map.remove("allOf");
                                            if let Value::Object(def_map) = definition {
                                                for (key, val) in def_map.iter() {
                                                    if !map.contains_key(key) {
                                                        map.insert(key.clone(), val.clone());
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                for (_, v) in map.iter_mut() {
                    resolve_refs_recursive(v, schemas);
                }
            }
            Value::Array(arr) => {
                for item in arr.iter_mut() {
                    resolve_refs_recursive(item, schemas);
                }
            }
            _ => {}
        }
    }
    resolve_refs_recursive(&mut schema, all_schemas);
    schema
}

/// Extract definitions from schema
fn extract_definitions(
    schema: &schemars::schema::RootSchema,
    schemas: &mut HashMap<String, Value>,
) {
    for (name, definition) in &schema.definitions {
        schemas.insert(name.clone(), serde_json::to_value(definition).unwrap());
    }
}

/// Macro to generate schemas for multiple types
macro_rules! generate_schemas {
    ($($type_name:ident),+ $(,)?) => {
        {
            // Generate all schemas
            $(
                let _schema = schema_for!($type_name);
            )+

            // Collect all definitions
            let mut all_definitions = HashMap::new();
            $(
                let schema = schema_for!($type_name);
                extract_definitions(&schema, &mut all_definitions);
            )+

            // Generate resolved schemas
            let mut schemas = HashMap::new();
            $(
                let schema = schema_for!($type_name);
                let mut schema_json = serde_json::to_value(&schema).unwrap();
                schema_json = resolve_schema_refs(schema_json, &all_definitions);
                schemas.insert(stringify!($type_name).to_string(), schema_json);
            )+

            // Add resolved definitions
            for (name, definition) in all_definitions {
                let resolved = resolve_schema_refs(definition, &HashMap::new());
                schemas.insert(name, resolved);
            }

            schemas
        }
    };
}

/// Get all JSON schemas as a HashMap
pub fn get_all_schemas() -> HashMap<String, Value> {
    generate_schemas![
        CloudEvent,
        ItemEventData,
        ItemType,
        Document,
        Issue,
        IssueStatus,
        Task,
        Comment,
        Planning,
        PlanningMoment,
        PlanningStatus
    ]
}

/// Get a specific schema by name
pub fn get_schema(name: &str) -> Option<Value> {
    let schemas = get_all_schemas();
    schemas.get(name).cloned()
}

/// Get schema index (list of all available schemas)
pub fn get_schema_index() -> Value {
    let schemas = get_all_schemas();
    let schema_names: Vec<String> = schemas.keys().cloned().collect();

    json!({
        "schemas": schema_names,
        "base_url": "/schemas",
        "description": "Available JSON schemas for CloudEvents and data types"
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_schema_index() {
        let index = get_schema_index();

        assert!(index.is_object());
        assert!(index.get("schemas").is_some());
        assert!(index.get("base_url").is_some());
        assert!(index.get("description").is_some());

        let schemas = index.get("schemas").unwrap().as_array().unwrap();
        assert!(schemas.len() > 0);

        // Check that key schemas are present
        let schema_names: Vec<String> = schemas
            .iter()
            .map(|v| v.as_str().unwrap().to_string())
            .collect();

        assert!(schema_names.contains(&"CloudEvent".to_string()));
        assert!(schema_names.contains(&"Issue".to_string()));
        assert!(schema_names.contains(&"Task".to_string()));
        assert!(schema_names.contains(&"Planning".to_string()));
        // Test that previously missing schemas are now included
        assert!(schema_names.contains(&"Document".to_string()));
        assert!(schema_names.contains(&"ItemType".to_string()));
        assert!(schema_names.contains(&"IssueStatus".to_string()));
        assert!(schema_names.contains(&"PlanningStatus".to_string()));
    }

    #[test]
    fn test_get_specific_schema() {
        // Test CloudEvent schema
        let cloud_event_schema = get_schema("CloudEvent");
        assert!(cloud_event_schema.is_some());

        let schema = cloud_event_schema.unwrap();
        assert!(schema.get("properties").is_some());

        let properties = schema.get("properties").unwrap().as_object().unwrap();
        assert!(properties.contains_key("specversion"));
        assert!(properties.contains_key("id"));
        assert!(properties.contains_key("source"));
        assert!(properties.contains_key("type"));
        assert!(properties.contains_key("dataschema"));
        assert!(properties.contains_key("dataref"));
        assert!(properties.contains_key("sequence"));
        assert!(properties.contains_key("sequencetype"));
    }

    #[test]
    fn test_get_nonexistent_schema() {
        let result = get_schema("NonExistentSchema");
        assert!(result.is_none());
    }

    #[test]
    fn test_cloud_event_has_nl_gov_fields() {
        let schema = get_schema("CloudEvent").unwrap();
        let properties = schema.get("properties").unwrap().as_object().unwrap();

        // Verify NL-GOV CloudEvents compliance fields are present
        assert!(
            properties.contains_key("dataschema"),
            "Missing dataschema field for NL-GOV compliance"
        );
        assert!(
            properties.contains_key("dataref"),
            "Missing dataref field for NL-GOV compliance"
        );
        assert!(
            properties.contains_key("sequence"),
            "Missing sequence field for NL-GOV compliance"
        );
        assert!(
            properties.contains_key("sequencetype"),
            "Missing sequencetype field for NL-GOV compliance"
        );
    }

    #[test]
    fn test_issue_schema_structure() {
        let schema = get_schema("Issue").unwrap();
        let properties = schema.get("properties").unwrap().as_object().unwrap();

        // Verify key Issue fields
        assert!(properties.contains_key("id"));
        assert!(properties.contains_key("title"));
        assert!(properties.contains_key("status"));
        assert!(properties.contains_key("created_at"));
    }

    #[test]
    fn test_all_schemas_are_valid_json() {
        let all_schemas = get_all_schemas();

        for (name, schema) in all_schemas {
            // Verify each schema is valid JSON and has expected structure
            assert!(
                schema.is_object(),
                "Schema {} is not a valid JSON object",
                name
            );

            // Most schemas should have properties (except enums)
            if !name.ends_with("Status") && !name.ends_with("Type") {
                assert!(
                    schema.get("properties").is_some(),
                    "Schema {} missing properties field",
                    name
                );
            }
        }
    }

    #[test]
    fn test_missing_schemas_now_included() {
        let all_schemas = get_all_schemas();

        // Verify that previously missing schemas are now included
        assert!(
            all_schemas.contains_key("Document"),
            "Document schema missing"
        );
        assert!(
            all_schemas.contains_key("ItemType"),
            "ItemType schema missing"
        );
        assert!(
            all_schemas.contains_key("IssueStatus"),
            "IssueStatus schema missing"
        );
        assert!(
            all_schemas.contains_key("PlanningStatus"),
            "PlanningStatus schema missing"
        );

        // Verify all main types are present
        let expected_schemas = vec![
            "CloudEvent",
            "ItemEventData",
            "ItemType",
            "Document",
            "Issue",
            "IssueStatus",
            "Task",
            "Comment",
            "Planning",
            "PlanningMoment",
            "PlanningStatus",
        ];

        for schema_name in expected_schemas {
            assert!(
                all_schemas.contains_key(schema_name),
                "Missing schema: {}",
                schema_name
            );
        }
    }

    #[test]
    fn test_schema_generation_completeness() {
        let schemas = get_all_schemas();

        // Print schema count for debugging
        println!("Total schemas generated: {}", schemas.len());

        // Verify we have at least the expected number of main schemas
        assert!(
            schemas.len() >= 11,
            "Expected at least 11 schemas, got {}",
            schemas.len()
        );

        // Test that we can get a specific schema
        let cloud_event = get_schema("CloudEvent");
        assert!(
            cloud_event.is_some(),
            "CloudEvent schema should be available"
        );

        let document = get_schema("Document");
        assert!(document.is_some(), "Document schema should be available");

        let item_type = get_schema("ItemType");
        assert!(
            item_type.is_some(),
            "ItemType enum schema should be available"
        );
    }
}
