import React from "react";
import type { TimelineEvent, TimelineItemData } from "../../types";

export interface TimeInfo {
  date: string;
  time: string;
  relative: string;
}

export interface EventPluginProps {
  event: TimelineEvent;
  data: TimelineItemData;
  timeInfo: TimeInfo;
}

export type EventPluginComponent = React.FC<EventPluginProps>;

export interface EventPluginConfig {
  icon: string;
  title?: string;
  renderAs: "card" | "line"; // This determines the rendering mode
}
