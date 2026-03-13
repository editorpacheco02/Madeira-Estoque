import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const isValidUrl = (u: string | null): u is string => {
    if (!u) return false;
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  console.log('Obtendo configuração do Supabase...');

  // 1. Try to get from localStorage (User manual config)
  try {
    const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_key') : null;

    if (isValidUrl(localUrl) && localKey) {
      console.log('Usando configuração do localStorage');
      return { url: localUrl, key: localKey, isConfigured: true, isUsingFallback: false };
    }
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
  }

  // 2. Try to get from environment variables
  try {
    const meta = (import.meta as any);
    const envUrl = meta.env?.VITE_SUPABASE_URL;
    const envKey = meta.env?.VITE_SUPABASE_ANON_KEY;

    if (isValidUrl(envUrl) && envKey && !envUrl.includes('your-project-id')) {
      console.log('Usando configuração das variáveis de ambiente');
      return { url: envUrl, key: envKey, isConfigured: true, isUsingFallback: false };
    }
  } catch (e) {
    console.error('Erro ao ler variáveis de ambiente:', e);
  }

  // 3. Fallback to the hardcoded values
  const fallbackUrl = "https://lkcfspilpsgdybdqjmsd.supabase.co";
  const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY2ZzcGlscHNnZHliZHFqbXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDAwMTcsImV4cCI6MjA4ODk3NjAxN30.8SjFSqSJ6DYAcBJrNGN76hEhcij5vtyJK5G819CvV7Fm";

  if (isValidUrl(fallbackUrl)) {
    console.log('Usando configuração de fallback (hardcoded)');
    return { url: fallbackUrl, key: fallbackKey, isConfigured: true, isUsingFallback: true };
  }

  console.warn('Nenhuma configuração válida encontrada. Usando placeholder.');
  return {
    url: 'https://placeholder.supabase.co',
    key: 'placeholder',
    isConfigured: false,
    isUsingFallback: true
  };
};

const { url, key, isConfigured, isUsingFallback } = getSupabaseConfig();

export { isConfigured, isUsingFallback };
export const supabase = createClient(url, key);
