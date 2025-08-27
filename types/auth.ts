import { User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_mobile?: string;
  phone_home?: string;
  phone_work?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}