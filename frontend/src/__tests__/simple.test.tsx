import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Simple test component
const SimpleComponent: React.FC<{ message?: string }> = ({ message = "Hello" }) => {
  return <div data-testid="message">{message}</div>;
};

describe("Simple Test", () => {
  it("should render a component", () => {
    render(<SimpleComponent />);
    expect(screen.getByTestId("message")).toHaveTextContent("Hello");
  });

  it("should render with custom message", () => {
    render(<SimpleComponent message="Testing" />);
    expect(screen.getByTestId("message")).toHaveTextContent("Testing");
  });

  it("should pass basic math test", () => {
    expect(2 + 2).toBe(4);
  });
});
