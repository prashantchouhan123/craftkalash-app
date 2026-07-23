import { createClient } from '@supabase/supabase-js';

// Pre-check URL hash/search for recovery tokens or errors BEFORE Supabase client strips the URL
if (typeof window !== 'undefined') {
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const href = window.location.href || '';
    const isSent =
      sessionStorage.getItem('reset_password_email_sent') === 'true' ||
      localStorage.getItem('reset_password_email_sent') === 'true';

    // Extract error description if present in URL (e.g., token expired)
    if (hash.includes('error_description=') || search.includes('error_description=')) {
      const match = (hash + search).match(/error_description=([^&]+)/);
      if (match && match[1]) {
        const decodedError = decodeURIComponent(match[1].replace(/\+/g, ' '));
        sessionStorage.setItem('password_recovery_error', decodedError);
        localStorage.setItem('password_recovery_error', decodedError);
      }
    }

    // Check if initial URL indicates a password recovery session
    const isRecoveryToken =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('type=recovery_grant') ||
      search.includes('type=recovery_grant') ||
      href.includes('type=recovery') ||
      hash.includes('error_description=') ||
      search.includes('error_description=') ||
      (search.includes('code=') && (isSent || href.includes('reset-password'))) ||
      (hash.includes('access_token=') && !hash.includes('type=signup') && !hash.includes('type=email_change'));

    if (isRecoveryToken) {
      // If we landed on root "/" or any non-reset page with a recovery token/hash,
      // rewrite the pathname to "/reset-password" in history before React Router reads it!
      if (window.location.pathname !== '/reset-password') {
        const newUrl = window.location.origin + '/reset-password' + search + hash;
        window.history.replaceState(null, '', newUrl);
      }
    }
  } catch (err) {
    console.error('Error pre-checking recovery URL params:', err);
  }
}

// Access client-side env variables securely using Vite's env mechanism
const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val: string) => {
  if (!val) return true;
  const v = val.toLowerCase().trim();
  return (
    v.includes('placeholder') ||
    v.includes('your-supabase') ||
    v.includes('your_') ||
    v.includes('example') ||
    v === 'https://.supabase.co'
  );
};

export const isSupabaseConfigured = Boolean(
  rawUrl && rawKey && !isPlaceholder(rawUrl) && !isPlaceholder(rawKey)
);

// Initialize Supabase client
export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder-project-id.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder-anon-key'
);


