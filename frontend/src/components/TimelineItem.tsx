import React from "react";
import type {
  TimelineEvent,
  TimelineItemType,
  TimelineItemData,
} from "../types";
import { getEventPlugin } from "../plugins/eventTypes";

interface TimelineItemProps {
  event: TimelineEvent;
  itemType: TimelineItemType;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ event, itemType }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let relative: string;
    if (minutes < 1) relative = "zojuist";
    else if (minutes < 60) relative = `${minutes}m geleden`;
    else if (hours < 24) relative = `${hours}u geleden`;
    else if (days < 7) relative = `${days}d geleden`;
    else relative = date.toLocaleDateString("nl-NL");

    return {
      date: date.toLocaleDateString("nl-NL"),
      time: date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      relative,
    };
  };

  const data = (event.data || {}) as TimelineItemData;
  const timeInfo = formatTimestamp(event.timestamp);

  // Delegate everything to the plugin system
  const PluginComponent = getEventPlugin(itemType);
  return <PluginComponent event={event} data={data} timeInfo={timeInfo} />;
};

export default TimelineItem;
