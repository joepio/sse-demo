import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-123",
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};
