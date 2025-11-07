/**
 * Centralized date and time formatting utilities.
 * All components should use these utilities for consistent date/time display.
 */

/**
 * Formats a date string or Date object to a time string (e.g., "5:32 PM")
 */
export function formatTime(timeString: string | Date): string {
  const date =
    typeof timeString === 'string' ? new Date(timeString) : timeString;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date string or Date object to a time string with seconds (e.g., "5:32:15 PM")
 */
export function formatTimeWithSeconds(timeString: string | Date): string {
  const date =
    typeof timeString === 'string' ? new Date(timeString) : timeString;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date string or Date object to a date string (e.g., "Jan 15, 2025")
 */
export function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date string or Date object to a full date and time string (e.g., "Jan 15, 2025 5:32 PM")
 */
export function formatDateTime(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date to a relative time string (e.g., "in 5 minutes", "2 hours ago")
 * Falls back to absolute time if more than 24 hours away.
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  // If more than 24 hours away, use absolute time
  if (Math.abs(diffMinutes) > 1440) {
    return formatDateTime(date);
  }

  // Past
  if (diffMinutes < 0) {
    const absDiff = Math.abs(diffMinutes);
    if (absDiff < 1) return 'just now';
    if (absDiff < 60)
      return `${absDiff} ${absDiff === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.floor(absDiff / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Future
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60)
    return `in ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.floor(diffMinutes / 60);
  return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
