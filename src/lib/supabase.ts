import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isValidUrl = (u: string | undefined | null): u is string => {
    if (!u) return false;
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 1. Check for manual config in localStorage
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('supabase_url');
    const localKey = localStorage.getItem('supabase_key');
    if (isValidUrl(localUrl) && localKey) {
      return { url: localUrl, key: localKey, isConfigured: true, isUsingFallback: false };
    }
  }

  // 2. Use Environment Variables
  if (isValidUrl(envUrl) && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl, key: envKey, isConfigured: true, isUsingFallback: false };
  }

  // 3. Last Resort Fallback (Demo Keys)
  const fallbackUrl = "https://lkcfspilpsgdybdqjmsd.supabase.co";
  const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY2ZzcGlscHNnZHliZHFqbXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDAwMTcsImV4cCI6MjA4ODk3NjAxN30.8SjFSqSJ6DYAcBJrNGN76hEhcij5vtyJK5G819CvV7Fm";

  return { 
    url: fallbackUrl, 
    key: fallbackKey, 
    isConfigured: isValidUrl(fallbackUrl), 
    isUsingFallback: true 
  };
};

const { url, key, isConfigured, isUsingFallback } = getSupabaseConfig();

export { isConfigured, isUsingFallback };
export const supabase = createClient(url, key);
