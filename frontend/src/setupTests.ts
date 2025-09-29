import "@testing-library/jest-dom";
// vitest globals are available through the config

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => "test-uuid-123",
  },
});

// Mock IntersectionObserver
(globalThis as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};
