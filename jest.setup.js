import '@testing-library/jest-dom';

// Mock Next.js environment
global.Request = global.Request || class Request {};
global.Response = global.Response || class Response {};
global.Headers = global.Headers || class Headers {};

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  useParams() {
    return {};
  },
}));

// Mock window.location safely for jsdom
const mockLocation = {
  href: 'https://localhost:3000',
  origin: 'https://localhost:3000', 
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn(),
};

// Use a safer approach to mock location that doesn't conflict with jsdom
if (typeof window !== 'undefined') {
  // Only override if we can configure the property
  const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
  
  if (!locationDescriptor || locationDescriptor.configurable) {
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });
  } else {
    // If location exists but isn't configurable, just ensure reload is available
    if (window.location && !window.location.reload) {
      try {
        Object.defineProperty(window.location, 'reload', {
          value: jest.fn(),
          writable: true,
          configurable: true,
        });
      } catch (e) {
        // If we can't define reload, just add it directly
        window.location.reload = jest.fn();
      }
    }
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale() {
    return 'en';
  },
  useTranslations(namespace) {
    return (key) => `${namespace ? namespace + '.' : ''}${key}`;
  },
  useFormatter() {
    return {
      dateTime: jest.fn((date, options) => date.toISOString()),
      number: jest.fn((num, options) => num.toString()),
      relativeTime: jest.fn((date) => '2 hours ago'),
    };
  },
  NextIntlClientProvider: ({ children }) => children,
}));

// Mock use-intl (used by next-intl)
jest.mock('use-intl', () => ({
  useLocale() {
    return 'en';
  },
  useTranslations(namespace) {
    return (key) => `${namespace ? namespace + '.' : ''}${key}`;
  },
  useFormatter() {
    return {
      dateTime: jest.fn((date, options) => date.toISOString()),
      number: jest.fn((num, options) => num.toString()),
      relativeTime: jest.fn((date) => '2 hours ago'),
    };
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              name: 'Test Restaurant',
              cuisine_type: 'Italian',
              city: 'New York',
              state: 'NY',
              average_rating: 8.5,
              review_count: 42,
              image_url: 'https://example.com/restaurant.jpg',
              description: 'A great Italian restaurant',
              address: '123 Main St',
              phone: '555-1234',
              website: 'https://testrestaurant.com',
            },
            error: null,
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => ({
                data: [
                  {
                    id: '1',
                    name: 'Test Restaurant',
                    cuisine_type: 'Italian',
                    city: 'New York',
                    state: 'NY',
                    average_rating: 8.5,
                    review_count: 42,
                    image_url: 'https://example.com/restaurant.jpg',
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
        textSearch: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => ({
                data: [
                  {
                    id: '1',
                    name: 'Test Restaurant',
                    cuisine_type: 'Italian',
                    city: 'New York',
                    state: 'NY',
                    average_rating: 8.5,
                    review_count: 42,
                    image_url: 'https://example.com/restaurant.jpg',
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'review-123', rating: 9, comment: 'Great food!' },
              error: null,
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 'user-123', email: 'test@example.com' },
                error: null,
              })),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      auth: {
        signInWithPassword: jest.fn(() => ({
          data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'mock-token' },
          },
          error: null,
        })),
        signUp: jest.fn(() => ({
          data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'mock-token' },
          },
          error: null,
        })),
        signOut: jest.fn(() => ({
          error: null,
        })),
        getUser: jest.fn(() => ({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    })),
  },
}));

// Suppress console errors during tests except for important ones
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Error: Not implemented: navigation')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
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
  console.error = originalError;
  console.warn = originalWarn;
});
