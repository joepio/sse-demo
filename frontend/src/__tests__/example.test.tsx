import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple test component
const HelloWorld: React.FC<{ name?: string }> = ({ name = 'World' }) => {
  return <h1>Hello {name}!</h1>;
};

describe('Example Test', () => {
  it('should render hello world', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello World!')).toBeInTheDocument();
  });

  it('should render with custom name', () => {
    render(<HelloWorld name="Testing" />);
    expect(screen.getByText('Hello Testing!')).toBeInTheDocument();
  });
});
