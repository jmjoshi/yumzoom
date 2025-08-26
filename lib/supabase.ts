import { secretsManager } from './secrets';
import { keyRotationService } from './key-rotation';

// Initialize key rotation service if we're on the server
if (typeof window === 'undefined') {
  keyRotationService.startRotationSchedule();
}

// Create singleton instances to prevent multiple client warnings
let clientInstance: any = null;
let adminInstance: any = null;

// Client-side Supabase instance with singleton pattern
export const getSupabaseClient = () => {
  if (!clientInstance) {
    clientInstance = secretsManager.getSupabaseClient('anon');
  }
  return clientInstance;
};

// Server-side client with service role key with singleton pattern
export const getSupabaseAdmin = () => {
  if (!adminInstance) {
    adminInstance = secretsManager.getSupabaseClient('service');
  }
  return adminInstance;
};

// Export the singletons
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdmin();

// Export key rotation service for admin usage
export { keyRotationService };