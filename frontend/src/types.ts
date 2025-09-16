export interface CloudEvent {
  specversion: string;
  id: string;
  source: string;
  subject?: string;
  type: string;
  time?: string;
  datacontenttype?: string;
  data?: any;
}

export interface Issue extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "closed";
  priority?: "low" | "medium" | "high";
  assignee?: string;
  created_at?: string;
  resolution?: string;
}

export interface IssueFormData {
  title: string;
  description: string;
  priority: string;
  assignee: string;
}

export interface PatchFormData {
  issueId: string;
  title: string;
  status: string;
  assignee: string;
  description: string;
}

export interface IssueCreateData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  created_at: string;
}

export interface IssuePatchData {
  [key: string]: any;
}

export interface IssueDeleteData {
  id: string;
  reason: string;
}

export type EventType =
  | "com.example.issue.create"
  | "com.example.issue.patch"
  | "com.example.issue.delete"
  | "com.example.message.create"
  | "com.example.message.patch"
  | "com.example.message.delete"
  | "com.example.document.create"
  | "com.example.document.patch"
  | "com.example.document.delete";

// Generic entity interface that all entities should extend
export interface BaseEntity extends Record<string, unknown> {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// Example: Message entity
export interface Message extends BaseEntity {
  content: string;
  author?: string;
  channel?: string;
  thread_id?: string;
  reactions?: Record<string, number>;
}

// Example: Document entity
export interface Document extends BaseEntity {
  title: string;
  content: string;
  author?: string;
  tags?: string[];
  version?: number;
  status?: "draft" | "published" | "archived";
}

// Generic CloudEvent data types
export type CreateCloudEventData<T extends BaseEntity> = T;

export type PatchCloudEventData = Record<string, any>;

export interface DeleteCloudEventData {
  id: string;
  reason: string;
}

// Entity type mapping for type safety
export type EntityTypeMap = {
  issue: Issue;
  message: Message;
  document: Document;
};

export type EntityType = keyof EntityTypeMap;
