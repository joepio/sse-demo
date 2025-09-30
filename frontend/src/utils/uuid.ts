/**
 * Generate a UUID v4
 * Falls back to a simple implementation when crypto.randomUUID is not available (HTTP contexts)
 */
export function generateUUID(): string {
  // Try to use the native crypto.randomUUID if available (HTTPS)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback implementation for HTTP contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
