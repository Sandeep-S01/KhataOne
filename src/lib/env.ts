const optionalEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getPublicEnv() {
  return optionalEnv;
}

export function hasSupabaseConfig() {
  return Boolean(optionalEnv.supabaseUrl && optionalEnv.supabaseAnonKey);
}

export function getOptionalServerEnv(name: string) {
  return process.env[name];
}

export function requireServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
