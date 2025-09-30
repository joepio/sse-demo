import type {
  CloudEvent,
  ItemType,
  Comment,
  Issue,
  Task,
  Planning,
  Document,
} from "../types";
import { generateUUID } from "./uuid";

interface CloudEventOptions {
  source?: string;
  subject?: string;
  actor?: string;
}

/**
 * Generic function to create a CloudEvent for item creation
 * Takes the actual schema type as a parameter to ensure type safety
 */
export function createItemCreatedEvent<T extends { id: string }>(
  itemType: ItemType,
  itemData: T,
  options?: CloudEventOptions
): CloudEvent {
  const itemId = itemData.id;

  return {
    specversion: "1.0",
    id: generateUUID(),
    source: options?.source || "frontend-create",
    subject: options?.subject || itemId,
    type: "item.created",
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: {
      schema: `http://localhost:8000/schemas/${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      item_id: itemId,
      actor: options?.actor || "frontend-user",
      item_data: itemData,
      item_type: itemType, // Keep for backwards compatibility
    },
  };
}

/**
 * Generic function to create a CloudEvent for item updates
 */
export function createItemUpdatedEvent<T = Record<string, unknown>>(
  itemType: ItemType,
  itemId: string,
  patch: Partial<T>,
  options?: CloudEventOptions
): CloudEvent {
  return {
    specversion: "1.0",
    id: generateUUID(),
    source: options?.source || "frontend-edit",
    subject: options?.subject || itemId,
    type: "item.updated",
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: {
      schema: `http://localhost:8000/schemas/${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      item_id: itemId,
      actor: options?.actor || "frontend-user",
      patch,
      item_type: itemType, // Keep for backwards compatibility
    },
  };
}

/**
 * Generic function to create a CloudEvent for item deletion
 */
export function createItemDeletedEvent(
  itemType: ItemType,
  itemId: string,
  options?: CloudEventOptions
): CloudEvent {
  return {
    specversion: "1.0",
    id: generateUUID(),
    source: options?.source || "frontend-delete",
    subject: options?.subject || itemId,
    type: "item.deleted",
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: {
      schema: `http://localhost:8000/schemas/${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      item_id: itemId,
      actor: options?.actor || "frontend-user",
      item_data: {
        id: itemId,
      },
      item_type: itemType, // Keep for backwards compatibility,
    },
  };
}

// Convenience functions for specific item types

/**
 * Create a CloudEvent for creating an Issue (uses Issue schema)
 */
export function createIssueCreatedEvent(
  issue: Issue,
  options?: CloudEventOptions
): CloudEvent {
  return createItemCreatedEvent("issue", issue, {
    subject: issue.id,
    ...options,
  });
}

/**
 * Create a CloudEvent for creating a Comment (uses Comment schema)
 */
export function createCommentCreatedEvent(
  comment: Comment,
  zaakId: string,
  options?: CloudEventOptions
): CloudEvent {
  return createItemCreatedEvent("comment", comment, {
    source: "frontend-demo-event",
    subject: zaakId,
    ...options,
  });
}

/**
 * Create a CloudEvent for creating a Task (uses Task schema)
 */
export function createTaskCreatedEvent(
  task: Task,
  zaakId: string,
  options?: CloudEventOptions
): CloudEvent {
  return createItemCreatedEvent("task", task, {
    subject: zaakId,
    ...options,
  });
}

/**
 * Create a CloudEvent for creating a Planning (uses Planning schema)
 */
export function createPlanningCreatedEvent(
  planning: Planning,
  zaakId: string,
  options?: CloudEventOptions
): CloudEvent {
  return createItemCreatedEvent("planning", planning, {
    subject: zaakId,
    ...options,
  });
}

/**
 * Create a CloudEvent for creating a Document (uses Document schema)
 */
export function createDocumentCreatedEvent(
  document: Document,
  zaakId: string,
  options?: CloudEventOptions
): CloudEvent {
  return createItemCreatedEvent("document", document, {
    subject: zaakId,
    ...options,
  });
}
