import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSSE } from "../contexts/SSEContext";

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
    <div className="relative ml-auto" ref={notificationRef}>
      <button
        className="relative bg-transparent border border-border-primary rounded-md p-2 md:p-1.5 text-xl md:text-base cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-bg-secondary hover:border-border-secondary"
        onClick={handleBellClick}
        type="button"
      >
        🔔
        {newEventsCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[16px] text-center text-white"
            style={{ backgroundColor: "var(--text-error)" }}
          >
            {newEventsCount}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="absolute top-full mt-1 right-0 bg-bg-primary border border-border-primary rounded-lg shadow-theme-lg z-50 min-w-[300px] max-w-[400px] md:fixed md:top-12 md:left-2 md:right-2 md:min-w-0 md:max-w-none sm:top-10 sm:left-2 sm:right-2">
          <div className="p-4 border-b border-border-primary bg-bg-tertiary rounded-t-lg">
            <h3 className="m-0 text-sm md:text-xs font-semibold text-text-primary">
              Recente Zaken
            </h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {recentIssues.length === 0 ? (
              <div className="block px-4 py-3 text-text-tertiary italic text-center cursor-default">
                Geen andere zaken
              </div>
            ) : (
              recentIssues.map(([id, issue]) => (
                <Link
                  key={id}
                  to={`/zaak/${id}`}
                  className="block px-4 py-3 border-b border-border-primary last:border-b-0 text-inherit no-underline transition-colors duration-200 hover:bg-bg-secondary"
                  onClick={() => setIsNotificationOpen(false)}
                >
                  <div className="font-medium text-text-primary mb-1 overflow-hidden text-ellipsis whitespace-nowrap md:text-sm">
                    {issue.title || "Zaak zonder titel"}
                  </div>
                  <div className="text-xs md:text-xs text-text-secondary capitalize">
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
