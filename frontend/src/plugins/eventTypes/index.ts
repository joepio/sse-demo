import type { TimelineItemType } from "../../types";
import type { EventPluginComponent } from "./types";

// Import all plugins
import CommentPlugin from "./CommentPlugin";
import StatusChangePlugin from "./StatusChangePlugin";

import IssueUpdatedPlugin from "./IssueUpdatedPlugin";
import IssueCreatedPlugin from "./IssueCreatedPlugin";
import IssueDeletedPlugin from "./IssueDeletedPlugin";
import DeploymentPlugin from "./DeploymentPlugin";
import SystemEventPlugin from "./SystemEventPlugin";
import TaskPlugin from "./TaskPlugin";
import PlanningPlugin from "./PlanningPlugin";

// Plugin registry - map event types to components
export const eventPlugins: Record<TimelineItemType, EventPluginComponent> = {
  comment: CommentPlugin,
  status_change: StatusChangePlugin,

  deployment: DeploymentPlugin,
  system_event: SystemEventPlugin,
  issue_created: IssueCreatedPlugin,
  issue_updated: IssueUpdatedPlugin,
  issue_deleted: IssueDeletedPlugin,
  task: TaskPlugin,
  planning: PlanningPlugin,
};

// Utility function to get plugin for event type
export const getEventPlugin = (
  eventType: TimelineItemType,
): EventPluginComponent => {
  return eventPlugins[eventType] || eventPlugins.system_event;
};

// Export individual plugins for direct use if needed
export {
  CommentPlugin,
  StatusChangePlugin,
  IssueUpdatedPlugin,
  IssueCreatedPlugin,
  IssueDeletedPlugin,
  DeploymentPlugin,
  SystemEventPlugin,
  TaskPlugin,
  PlanningPlugin,
};
