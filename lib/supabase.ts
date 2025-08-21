import { secretsManager } from './secrets';
import { keyRotationService } from './key-rotation';

// Initialize key rotation service if we're on the server
if (typeof window === 'undefined') {
  keyRotationService.startRotationSchedule();
}

// Client-side Supabase instance
export const supabase = secretsManager.getSupabaseClient('anon');

// Server-side client with service role key
export const supabaseAdmin = secretsManager.getSupabaseClient('service');

// Export key rotation service for admin usage
export { keyRotationService };