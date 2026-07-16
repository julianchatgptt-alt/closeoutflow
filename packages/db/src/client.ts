import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types.generated";

export type AnonClientConfig = {
  url: string;
  anonKey: string;
};

export function createAnonClient(config: AnonClientConfig): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
