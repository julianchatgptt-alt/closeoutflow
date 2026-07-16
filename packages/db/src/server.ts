import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types.generated";

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export function createServiceClient(config: ServiceClientConfig): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
