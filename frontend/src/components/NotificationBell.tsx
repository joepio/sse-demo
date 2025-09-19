import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSSE } from "../contexts/SSEContext";

import "./NotificationBell.css";

interface NotificationBellProps {
  currentZaakId?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  currentZaakId,
}) => {
  const { events, issues } = useSSE();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get recent issues (excluding current one) sorted by lastActivity
  const recentIssues = useMemo(() => {
    return Object.entries(issues)
      .filter(([id]) => id !== currentZaakId)
      .sort((a, b) => {
        const timeA = a[1].lastActivity || a[1].created_at || "1970-01-01";
        const timeB = b[1].lastActivity || b[1].created_at || "1970-01-01";
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
      .slice(0, 5); // Show only top 5 recent issues
  }, [issues, currentZaakId]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Track new events and update notification counter
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[events.length - 1];

    // Skip if this is the first load (no previous lastEventId)
    if (lastEventId === null) {
      setLastEventId(latestEvent.id);
      return;
    }

    // Skip if this event is the same as the last one we tracked
    if (latestEvent.id === lastEventId) {
      return;
    }

    // Only count events that are NOT for the current zaak (since we're viewing it)
    if (latestEvent.subject !== currentZaakId) {
      setNewEventsCount((prev) => prev + 1);
    }

    setLastEventId(latestEvent.id);
  }, [events, lastEventId, currentZaakId]);

  // Reset notification counter when changing zaak
  useEffect(() => {
    setNewEventsCount(0);
    setLastEventId(null);
  }, [currentZaakId]);

  const handleBellClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    // Reset counter when opening notifications
    if (!isNotificationOpen) {
      setNewEventsCount(0);
    }
  };

  return (
    <div className="notification-container" ref={notificationRef}>
      <button
        className="notification-bell"
        onClick={handleBellClick}
        type="button"
      >
        🔔
        {newEventsCount > 0 && (
          <span className="notification-badge">{newEventsCount}</span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Recente Zaken</h3>
          </div>
          <div className="notification-list">
            {recentIssues.length === 0 ? (
              <div className="notification-item empty">Geen andere zaken</div>
            ) : (
              recentIssues.map(([id, issue]) => (
                <Link
                  key={id}
                  to={`/zaak/${id}`}
                  className="notification-item"
                  onClick={() => setIsNotificationOpen(false)}
                >
                  <div className="notification-title">
                    {issue.title || "Zaak zonder titel"}
                  </div>
                  <div className="notification-status">
                    {issue.status === "in_progress"
                      ? "In Behandeling"
                      : issue.status === "open"
                        ? "Open"
                        : issue.status === "closed"
                          ? "Gesloten"
                          : issue.status}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
