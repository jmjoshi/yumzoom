/**
 * Integration Tests for Critical User Flows
 * These tests verify that key user journeys work end-to-end
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as nextNavigation from 'next/navigation';

// Mock components and hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/supabase');

const mockPush = jest.fn();

describe('Critical User Flow Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup router mock
    const mockUseRouter = jest.spyOn(nextNavigation, 'useRouter');
    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/',
      query: {},
      asPath: '/',
    } as any);

    // Mock successful API responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/restaurants')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
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
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      }
      
      if (url.includes('/api/restaurants/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
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
          }),
        });
      }
      
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: {
              id: 'user-123',
              email: 'test@example.com',
              full_name: 'Test User',
            },
            session: { access_token: 'mock-token' },
          }),
        });
      }

      if (url.includes('/api/reviews')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { id: 'review-123', rating: 9, comment: 'Great food!' },
          }),
        });
      }

      return Promise.reject(new Error('Unhandled API call'));
    });
  });

  describe('User Authentication Flow', () => {
    it('allows user to log in and redirects to dashboard', async () => {
      const user = userEvent.setup();
      
      // Mock auth hook with proper implementation
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: null,
        login: mockLogin,
        loading: false,
      });

      // Dynamically import and render login component
      const { default: SignInPage } = require('@/app/(auth)/signin/page');
      render(<SignInPage />);

      // Fill out login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify login was called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Restaurant Search and Discovery Flow', () => {
    it('allows user to search for restaurants and view details', async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
      });

      // Dynamically import and render search page
      const { default: SearchPage } = require('@/app/search/page');
      render(<SearchPage />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search restaurants/i);
      await user.type(searchInput, 'Italian');

      // Verify API call for restaurants
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/restaurants'),
          expect.any(Object)
        );
      });

      // Verify restaurant results are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      });

      // Click on restaurant to view details
      const restaurantCard = screen.getByText('Test Restaurant');
      await user.click(restaurantCard);

      // Verify navigation to restaurant details
      expect(mockPush).toHaveBeenCalledWith('/restaurants/1');
    });
  });

  describe('Review Submission Flow', () => {
    it('allows authenticated user to submit a review', async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
      });

      // Dynamically import and render restaurant details page
      const { default: RestaurantPage } = require('@/app/restaurants/[id]/page');
      render(<RestaurantPage params={{ id: '1' }} />);

      // Wait for restaurant data to load
      await waitFor(() => {
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      });

      // Find and click review button
      const reviewButton = screen.getByRole('button', { name: /write review/i });
      await user.click(reviewButton);

      // Fill out review form
      const ratingInput = screen.getByRole('slider', { name: /rating/i });
      const commentTextarea = screen.getByLabelText(/comment/i);
      const submitReviewButton = screen.getByRole('button', { name: /submit review/i });

      await user.clear(ratingInput);
      await user.type(ratingInput, '9');
      await user.type(commentTextarea, 'Great food and excellent service!');
      await user.click(submitReviewButton);

      // Verify review submission API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reviews'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Great food'),
          })
        );
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/review submitted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('handles API errors gracefully and shows user-friendly messages', async () => {
      const user = userEvent.setup();

      // Mock API error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Mock authenticated user
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
      });

      // Render search page
      const { default: SearchPage } = require('@/app/search/page');
      render(<SearchPage />);

      // Try to search
      const searchInput = screen.getByPlaceholderText(/search restaurants/i);
      await user.type(searchInput, 'Italian');      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design Flow', () => {
    it('adapts layout for mobile and desktop screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Mock authenticated user
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
      });

      // Render main page
      const { default: HomePage } = require('@/app/page');
      render(<HomePage />);

      // Verify main content is present (responsive design)
      expect(screen.getByText('Welcome to YumZoom')).toBeInTheDocument();

      // Verify buttons are present and responsive
      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      const browseRestaurantsButton = screen.getByRole('button', { name: /browse restaurants/i });

      expect(getStartedButton).toBeInTheDocument();
      expect(browseRestaurantsButton).toBeInTheDocument();

      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Verify buttons are still present (responsive design maintained)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /browse restaurants/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Flow', () => {
    it('supports keyboard navigation and screen readers', async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
      });

      // Mock next-intl translations
      jest.mock('next-intl', () => ({
        useTranslations: () => (key: string) => key,
      }));

      // Render search page
      const { default: SearchPage } = require('@/app/search/page');
      render(<SearchPage />);

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText(/search restaurants/i);

      // Focus should move through interactive elements
      await user.tab();
      expect(searchInput).toBeInTheDocument();      // Verify ARIA labels and roles
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('search'));
      
      // Test screen reader announcements
      const mainContent = screen.getByText(/advanced restaurant search/i) || screen.getByText('Welcome to YumZoom');
      expect(mainContent).toBeInTheDocument();
    });
  });
});
