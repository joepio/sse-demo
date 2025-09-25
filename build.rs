use std::fs;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/schemas.rs");
    println!("cargo:rerun-if-changed=src/main.rs");
    println!("cargo:rerun-if-changed=src/issues.rs");

    // Only generate TypeScript interfaces from the schemas that will be available at runtime
    // The actual JSON schemas are now served by the /schemas endpoints

    let typescript_content = r#"// Auto-generated TypeScript interfaces
// These are generated from the runtime schemas served at /schemas

export interface CloudEvent {
  specversion: string;
  id: string;
  source: string;
  subject?: string;
  type: string;
  time?: string;
  datacontenttype?: string;
  dataschema?: string;
  dataref?: string;
  sequence?: string;
  sequencetype?: string;
  data?: any;
}

export interface ItemEventData {
  item_type: ItemType;
  item_id: string;
  item_data?: any;
  patch?: any;
}

export type ItemType = "issue" | "comment" | "task" | "planning";

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  assignee?: string;
  created_at: string;
  resolution?: string;
}

export interface Task {
  id: string;
  cta: string;
  description: string;
  url?: string;
  completed: boolean;
  deadline?: string;
  actor?: string;
}

export type IssueStatus = "open" | "in_progress" | "closed";

export interface Comment {
  id: string;
  content: string;
  author?: string;
  parent_id?: string;
  mentions?: string[];
}

export interface Planning {
  id: string;
  title: string;
  description?: string;
  moments: PlanningMoment[];
}

export interface PlanningMoment {
  id: string;
  date: string;
  title: string;
  status: PlanningStatus;
}

export type PlanningStatus = "completed" | "current" | "planned";

// Schema metadata interface for runtime schema fetching
export interface SchemaMetadata {
  schemas: string[];
  base_url: string;
  description: string;
}

// Helper function to fetch schemas from the server
export async function fetchSchema(schemaName: string): Promise<any> {
  const response = await fetch(`/schemas/${schemaName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema ${schemaName}: ${response.statusText}`);
  }
  return response.json();
}

// Helper function to get all available schemas
export async function fetchSchemaIndex(): Promise<SchemaMetadata> {
  const response = await fetch('/schemas');
  if (!response.ok) {
    throw new Error(`Failed to fetch schema index: ${response.statusText}`);
  }
  return response.json();
}
"#;

    // Ensure frontend/src/types directory exists
    let types_dir = Path::new("frontend/src/types");
    if !types_dir.exists() {
        fs::create_dir_all(types_dir).expect("Failed to create types directory");
    }

    // Write the TypeScript interfaces
    fs::write(types_dir.join("interfaces.ts"), typescript_content)
        .expect("Failed to write TypeScript interfaces");

    println!("Generated TypeScript interfaces at frontend/src/types/interfaces.ts");
    println!("JSON schemas are now served at runtime via /schemas endpoints");
}
