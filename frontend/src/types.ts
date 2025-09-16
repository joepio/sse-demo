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

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
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

export interface CreateCloudEventData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  created_at: string;
}

export interface PatchCloudEventData {
  [key: string]: any;
}

export interface DeleteCloudEventData {
  id: string;
  reason: string;
}

export type EventType =
  | 'com.example.issue.create'
  | 'com.example.issue.patch'
  | 'com.example.issue.delete';
