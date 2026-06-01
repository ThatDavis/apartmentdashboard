import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/client/App.js';

describe('App', () => {
  it('renders login form when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Apartment Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
});
