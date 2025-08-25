# YumZoom Testing Documentation
## Comprehensive Testing Strategy & Implementation

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [API Testing](#api-testing)
6. [Performance Testing](#performance-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Testing Infrastructure](#testing-infrastructure)

---

## Testing Overview

### Testing Strategy

```
YumZoom Testing Pyramid:
├── 🧪 Unit Tests (70%)
│   ├── Component tests
│   ├── Hook tests
│   ├── Utility function tests
│   └── Service layer tests
├── 🔗 Integration Tests (20%)
│   ├── API integration
│   ├── Database operations
│   ├── External service integration
│   └── Component integration
├── 🎭 E2E Tests (10%)
│   ├── Critical user flows
│   ├── Cross-browser testing
│   ├── Mobile responsiveness
│   └── PWA functionality
└── 🚀 Performance Tests
    ├── Load testing
    ├── Stress testing
    ├── Bundle analysis
    └── Lighthouse scores
```

### Testing Technologies

```json
// package.json testing dependencies
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.5.1",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^2.0.8",
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.1.1",
    "supertest": "^6.3.3",
    "lighthouse": "^11.3.0"
  }
}
```

---

## Unit Testing

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams()
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn()
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));
```

### Component Testing Examples

```typescript
// __tests__/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="outline">Outline Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-input');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(
      <Button loading loadingText="Saving...">
        Save
      </Button>
    );
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

```typescript
// __tests__/components/restaurant/RestaurantCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';

const mockRestaurant = {
  id: '1',
  name: 'Test Restaurant',
  cuisine_type: 'Italian',
  address: '123 Test St',
  average_rating: 8.5,
  total_ratings: 42,
  image_url: 'https://example.com/image.jpg',
  is_family_friendly: true
};

describe('RestaurantCard', () => {
  it('displays restaurant information correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
    expect(screen.getByText('42 family ratings')).toBeInTheDocument();
  });

  it('shows family-friendly badge when applicable', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    expect(screen.getByText('Family Friendly')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<RestaurantCard restaurant={mockRestaurant} onClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('restaurant-card'));
    expect(handleClick).toHaveBeenCalledWith(mockRestaurant.id);
  });

  it('renders without image when image_url is null', () => {
    const restaurantWithoutImage = { ...mockRestaurant, image_url: null };
    render(<RestaurantCard restaurant={restaurantWithoutImage} />);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// __tests__/hooks/useAuth.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/auth/AuthProvider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  it('provides initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('handles sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signOut();
    
    expect(result.current.user).toBeNull();
  });
});
```

### Utility Function Testing

```typescript
// __tests__/lib/utils.test.ts
import { cn, formatRating, validateEmail } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('base', 'additional')).toBe('base additional');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });
  });

  describe('formatRating', () => {
    it('formats rating with one decimal place', () => {
      expect(formatRating(8.5)).toBe('8.5');
      expect(formatRating(8)).toBe('8.0');
    });

    it('handles invalid ratings', () => {
      expect(formatRating(null)).toBe('N/A');
      expect(formatRating(undefined)).toBe('N/A');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });
});
```

---

## Integration Testing

### API Route Testing

```typescript
// __tests__/api/restaurants.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/restaurants/route';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: jest.fn()
}));

describe('/api/restaurants', () => {
  beforeEach(() => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Test Restaurant',
              cuisine_type: 'Italian',
              average_rating: 8.5
            }
          ],
          error: null
        })
      }))
    };
    
    (createServerComponentClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('GET /api/restaurants returns restaurants list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe('Test Restaurant');
  });

  it('handles database errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }))
    };
    
    (createServerComponentClient as jest.Mock).mockReturnValue(mockSupabase);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
```

### Database Integration Testing

```typescript
// __tests__/integration/database.test.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

describe('Database Integration', () => {
  let testUserId: string;
  let testRestaurantId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });
    
    testUserId = userData.user!.id;

    // Create test restaurant
    const { data: restaurantData } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: 'Test Restaurant',
        cuisine_type: 'Italian',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.0060
      })
      .select()
      .single();
    
    testRestaurantId = restaurantData!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(testUserId);
    await supabaseAdmin
      .from('restaurants')
      .delete()
      .eq('id', testRestaurantId);
  });

  it('creates and retrieves user profile', async () => {
    // Create profile
    const { error: createError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });

    expect(createError).toBeNull();

    // Retrieve profile
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.first_name).toBe('Test');
    expect(data!.last_name).toBe('User');
  });

  it('creates rating with proper relationships', async () => {
    // Create menu item first
    const { data: menuItem } = await supabaseAdmin
      .from('menu_items')
      .insert({
        restaurant_id: testRestaurantId,
        name: 'Test Dish',
        category: 'Main Course',
        price: 15.99
      })
      .select()
      .single();

    // Create rating
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        user_id: testUserId,
        restaurant_id: testRestaurantId,
        menu_item_id: menuItem!.id,
        rating: 8,
        review_text: 'Great dish!'
      })
      .select(`
        *,
        restaurant:restaurants(name),
        menu_item:menu_items(name)
      `)
      .single();

    expect(error).toBeNull();
    expect(rating).toBeDefined();
    expect(rating!.rating).toBe(8);
    expect(rating!.restaurant.name).toBe('Test Restaurant');
    expect(rating!.menu_item.name).toBe('Test Dish');
  });
});
```

---

## End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up and sign in', async ({ page }) => {
    // Go to sign up page
    await page.goto('/auth/signup');
    
    // Fill out sign up form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'User');
    
    // Submit form
    await page.click('[data-testid="signup-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should see welcome message
    await expect(page.locator('text=Welcome, Test!')).toBeVisible();
  });

  test('user can sign out', async ({ page }) => {
    // Assume user is already signed in
    await page.goto('/dashboard');
    
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click sign out
    await page.click('[data-testid="signout-button"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should see sign in button
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });
});
```

```typescript
// e2e/restaurant-rating.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Restaurant Rating Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');
  });

  test('user can search and rate a restaurant', async ({ page }) => {
    // Go to search page
    await page.goto('/search');
    
    // Search for restaurants
    await page.fill('[data-testid="search-input"]', 'Pizza');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for results
    await page.waitForSelector('[data-testid="restaurant-card"]');
    
    // Click on first restaurant
    await page.click('[data-testid="restaurant-card"]');
    
    // Should be on restaurant page
    await expect(page.locator('h1')).toContainText('Pizza');
    
    // Open rating form
    await page.click('[data-testid="rate-restaurant-button"]');
    
    // Fill out rating form
    await page.selectOption('[data-testid="menu-item-select"]', { index: 1 });
    await page.click('[data-testid="star-8"]'); // 8/10 rating
    await page.fill('[data-testid="review-textarea"]', 'Great pizza!');
    
    // Submit rating
    await page.click('[data-testid="submit-rating-button"]');
    
    // Should see success message
    await expect(page.locator('text=Rating submitted successfully')).toBeVisible();
    
    // Should see the new rating in the list
    await expect(page.locator('text=Great pizza!')).toBeVisible();
  });

  test('user can rate for family member', async ({ page }) => {
    // First add a family member
    await page.goto('/family');
    await page.click('[data-testid="add-family-member-button"]');
    
    await page.fill('[data-testid="member-name-input"]', 'Little Johnny');
    await page.selectOption('[data-testid="relationship-select"]', 'Child');
    await page.selectOption('[data-testid="age-range-select"]', '5-12');
    await page.click('[data-testid="save-member-button"]');
    
    // Go rate for family member
    await page.goto('/search');
    await page.fill('[data-testid="search-input"]', 'Pizza');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await page.click('[data-testid="restaurant-card"]');
    await page.click('[data-testid="rate-restaurant-button"]');
    
    // Select family member
    await page.selectOption('[data-testid="family-member-select"]', 'Little Johnny');
    await page.selectOption('[data-testid="menu-item-select"]', { index: 1 });
    await page.click('[data-testid="star-9"]');
    await page.fill('[data-testid="review-textarea"]', 'Johnny loved it!');
    
    await page.click('[data-testid="submit-rating-button"]');
    
    // Should see rating attributed to family member
    await expect(page.locator('text=Little Johnny')).toBeVisible();
    await expect(page.locator('text=Johnny loved it!')).toBeVisible();
  });
});
```

### Mobile E2E Testing

```typescript
// e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Experience', () => {
  test('mobile navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Check menu items are visible
    await expect(page.locator('[data-testid="mobile-nav-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-family"]')).toBeVisible();
    
    // Navigate to search
    await page.click('[data-testid="mobile-nav-search"]');
    await expect(page).toHaveURL('/search');
  });

  test('PWA install prompt appears on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Should see install prompt (simulated)
    await expect(page.locator('[data-testid="install-prompt"]')).toBeVisible();
    
    // Click install
    await page.click('[data-testid="install-app-button"]');
    
    // Prompt should disappear
    await expect(page.locator('[data-testid="install-prompt"]')).not.toBeVisible();
  });

  test('touch gestures work for rating', async ({ page }) => {
    await page.goto('/restaurants/1');
    
    // Simulate touch on star rating
    const starRating = page.locator('[data-testid="star-rating"]');
    await starRating.tap();
    
    // Should see selected rating
    await expect(page.locator('[data-testid="selected-rating"]')).toContainText('8');
  });
});
```

---

## API Testing

### API Testing with Supertest

```typescript
// __tests__/api/integration/ratings.test.ts
import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import ratingsHandler from '@/pages/api/ratings';

const server = createServer((req, res) => {
  ratingsHandler(req as any, res as any);
});

describe('Ratings API Integration', () => {
  it('POST /api/ratings creates a new rating', async () => {
    const ratingData = {
      restaurantId: '123',
      menuItemId: '456',
      rating: 8,
      reviewText: 'Great food!'
    };

    const response = await request(server)
      .post('/api/ratings')
      .set('Authorization', 'Bearer valid-token')
      .send(ratingData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.rating).toBe(8);
    expect(response.body.data.reviewText).toBe('Great food!');
  });

  it('GET /api/ratings returns user ratings', async () => {
    const response = await request(server)
      .get('/api/ratings')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('validates rating data', async () => {
    const invalidData = {
      restaurantId: '123',
      rating: 15 // Invalid rating (max is 10)
    };

    const response = await request(server)
      .post('/api/ratings')
      .set('Authorization', 'Bearer valid-token')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const ratingData = {
      restaurantId: '123',
      menuItemId: '456',
      rating: 8
    };

    await request(server)
      .post('/api/ratings')
      .send(ratingData)
      .expect(401);
  });
});
```

---

## Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  variables:
    userEmails:
      - "user1@test.com"
      - "user2@test.com"
      - "user3@test.com"

scenarios:
  - name: "Browse and rate restaurants"
    weight: 70
    flow:
      - get:
          url: "/"
      - get:
          url: "/search"
      - get:
          url: "/restaurants/{{ $randomInt(1, 100) }}"
      - post:
          url: "/api/ratings"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            restaurantId: "{{ $randomInt(1, 100) }}"
            menuItemId: "{{ $randomInt(1, 20) }}"
            rating: "{{ $randomInt(1, 10) }}"

  - name: "User authentication"
    weight: 20
    flow:
      - post:
          url: "/api/auth/signin"
          json:
            email: "{{ userEmails }}"
            password: "testpassword"

  - name: "API endpoints"
    weight: 10
    flow:
      - get:
          url: "/api/restaurants"
      - get:
          url: "/api/restaurants/{{ $randomInt(1, 100) }}/ratings"
```

### Lighthouse Performance Testing

```typescript
// scripts/lighthouse-test.ts
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const runLighthouse = async (url: string): Promise<any> => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port
  };
  
  const runnerResult = await lighthouse(url, options);
  
  await chrome.kill();
  
  return runnerResult;
};

const testUrls = [
  'http://localhost:3000',
  'http://localhost:3000/search',
  'http://localhost:3000/restaurants/1',
  'http://localhost:3000/dashboard'
];

const runPerformanceTests = async () => {
  console.log('Starting Lighthouse performance tests...');
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    
    const result = await runLighthouse(url);
    const scores = result.lhr.categories;
    
    console.log(`Performance: ${Math.round(scores.performance.score * 100)}`);
    console.log(`Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
    console.log(`Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
    console.log(`SEO: ${Math.round(scores.seo.score * 100)}`);
    console.log(`PWA: ${Math.round(scores.pwa.score * 100)}`);
    console.log('---');
    
    // Fail if performance is below threshold
    if (scores.performance.score < 0.9) {
      throw new Error(`Performance score too low: ${scores.performance.score}`);
    }
  }
  
  console.log('All performance tests passed!');
};

if (require.main === module) {
  runPerformanceTests().catch(console.error);
}
```

---

## Accessibility Testing

### Automated Accessibility Testing

```typescript
// __tests__/accessibility/a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Button } from '@/components/ui/Button';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('RestaurantCard has no accessibility violations', async () => {
    const mockRestaurant = {
      id: '1',
      name: 'Test Restaurant',
      cuisine_type: 'Italian',
      address: '123 Test St',
      average_rating: 8.5,
      total_ratings: 42
    };
    
    const { container } = render(<RestaurantCard restaurant={mockRestaurant} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  it('Button component has proper ARIA attributes', async () => {
    const { container } = render(
      <Button aria-label="Save restaurant rating">
        Save Rating
      </Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Form has proper labels and associations', async () => {
    const { container } = render(
      <form>
        <label htmlFor="rating">Rating</label>
        <input id="rating" type="number" min="1" max="10" />
        
        <label htmlFor="review">Review</label>
        <textarea id="review" />
        
        <button type="submit">Submit</button>
      </form>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Accessibility Testing Checklist

```typescript
// scripts/a11y-checklist.ts
export const accessibilityChecklist = {
  keyboard: [
    'All interactive elements are keyboard accessible',
    'Tab order is logical and predictable',
    'Focus indicators are visible and clear',
    'No keyboard traps exist',
    'Skip links are available for navigation'
  ],
  
  screenReader: [
    'All images have appropriate alt text',
    'Headings are properly structured (h1, h2, h3, etc.)',
    'Form labels are associated with inputs',
    'Error messages are announced',
    'Dynamic content changes are announced'
  ],
  
  visual: [
    'Color contrast meets WCAG AA standards (4.5:1)',
    'Text can be resized up to 200% without horizontal scrolling',
    'Focus indicators are visible',
    'Content is readable without color alone',
    'UI remains functional at high zoom levels'
  ],
  
  motor: [
    'Click targets are at least 44x44 pixels',
    'Drag and drop has keyboard alternatives',
    'Time limits can be extended or disabled',
    'Motion can be disabled for vestibular disorders'
  ]
};
```

---

## Testing Infrastructure

### CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for app to be ready
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse tests
        run: npm run test:lighthouse
      
      - name: Run load tests
        run: npm run test:load
```

### Test Data Management

```typescript
// __tests__/utils/test-data.ts
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  created_at: faker.date.past().toISOString(),
  ...overrides
});

export const createMockRestaurant = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  cuisine_type: faker.helpers.arrayElement(['Italian', 'Chinese', 'Mexican', 'American']),
  address: faker.location.streetAddress(),
  latitude: parseFloat(faker.location.latitude()),
  longitude: parseFloat(faker.location.longitude()),
  average_rating: faker.number.float({ min: 1, max: 10, precision: 0.1 }),
  total_ratings: faker.number.int({ min: 0, max: 1000 }),
  is_active: true,
  ...overrides
});

export const createMockRating = (overrides = {}) => ({
  id: faker.string.uuid(),
  rating: faker.number.int({ min: 1, max: 10 }),
  review_text: faker.lorem.paragraph(),
  created_at: faker.date.recent().toISOString(),
  ...overrides
});

export class TestDataManager {
  private cleanup: (() => Promise<void>)[] = [];

  async createTestUser(overrides = {}) {
    const userData = createMockUser(overrides);
    
    // Create in test database
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;

    // Add to cleanup
    this.cleanup.push(async () => {
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', data.id);
    });

    return data;
  }

  async createTestRestaurant(overrides = {}) {
    const restaurantData = createMockRestaurant(overrides);
    
    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

    if (error) throw error;

    this.cleanup.push(async () => {
      await supabaseAdmin
        .from('restaurants')
        .delete()
        .eq('id', data.id);
    });

    return data;
  }

  async cleanupAll() {
    await Promise.all(this.cleanup.map(fn => fn()));
    this.cleanup = [];
  }
}
```

---

## Related Documentation

- [Technical Frontend Documentation](./TECHNICAL_FRONTEND_DOCUMENTATION.md)
- [API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Database Documentation](./TECHNICAL_DATABASE_DOCUMENTATION.md)
- [CI/CD Documentation](./TECHNICAL_DEPLOYMENT_DOCUMENTATION.md)

---

## Version Information

- **Testing Documentation Version**: 1.0
- **Testing Framework**: Jest + Playwright
- **Coverage Target**: 80%+ across all metrics
- **Last Updated**: August 2025

---

*For testing questions or contributions, contact our QA team at qa@yumzoom.com*
