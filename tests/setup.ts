// Set up test environment before any imports
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret';

// Import jest-dom matchers
import '@testing-library/jest-dom';
