import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Manglende miljøvariabel: ${name}`);
  }

  return value;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      requireEnv("VITE_SUPABASE_URL"),
      requireEnv("VITE_SUPABASE_ANON_KEY"),
    );
  }

  return supabaseClient;
}
