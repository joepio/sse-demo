/**
 * Utility functions for time formatting and manipulation
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;

  // Handle invalid dates
  if (Number.isNaN(targetDate.getTime())) {
    return "unknown";
  }

  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000,
  );

  // Handle future dates
  if (diffInSeconds < 0) {
    return "just now";
  }

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/**
 * Format a date as a localized string
 */
export function formatDate(
  date: string | Date,
  locale: string = "nl-NL",
): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  return targetDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a date as a localized string with time
 */
export function formatDateTime(
  date: string | Date,
  locale: string = "nl-NL",
): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  return targetDate.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get the most recent timestamp from an array of timestamps
 */
export function getMostRecentTimestamp(
  timestamps: (string | Date)[],
): Date | null {
  if (timestamps.length === 0) {
    return null;
  }

  const validDates = timestamps
    .map((ts) => (typeof ts === "string" ? new Date(ts) : ts))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (validDates.length === 0) {
    return null;
  }

  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}
