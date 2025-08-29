// Setup for Node.js environment tests (API tests)

// Mock Next.js environment for Node.js tests
global.Request = global.Request || class Request {};
global.Response = global.Response || class Response {};
global.Headers = global.Headers || class Headers {};

// Mock fetch globally
global.fetch = jest.fn();

// Suppress console warnings during tests
const originalWarn = console.warn;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Multiple GoTrueClient instances detected')
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
