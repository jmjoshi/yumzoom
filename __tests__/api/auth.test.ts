import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock NextRequest
const createMockNextRequest = (body: any): NextRequest => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue(body),
  } as any;
  return mockRequest;
};

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully logs in with valid credentials', async () => {
    const mockRequest = createMockNextRequest({
      email: 'test@example.com',
      password: 'validpassword123',
    });

    // Mock successful authentication
    const { supabase } = require('@/lib/supabase');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
        },
      },
      error: null,
    });

    supabase.single.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
      },
      error: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@example.com');
    expect(data.session).toBeDefined();
  });

  it('rejects login with invalid credentials', async () => {
    const mockRequest = createMockNextRequest({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    // Mock authentication failure
    const { supabase } = require('@/lib/supabase');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid login credentials');
  });

  it('validates required fields', async () => {
    const mockRequest = createMockNextRequest({
      email: '', // Missing email
      password: 'password123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('validates email format', async () => {
    const mockRequest = createMockNextRequest({
      email: 'invalid-email',
      password: 'password123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('handles server errors gracefully', async () => {
    const mockRequest = createMockNextRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    // Mock server error
    const { supabase } = require('@/lib/supabase');
    supabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('prevents SQL injection attempts', async () => {
    const mockRequest = createMockNextRequest({
      email: "test@example.com'; DROP TABLE users; --",
      password: 'password123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    // Should handle malicious input gracefully
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.success).toBe(false);
  });
});
