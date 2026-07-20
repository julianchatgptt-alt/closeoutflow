import "server-only";

import {
  createServerAuthClient,
  getVerifiedAssuranceLevel,
  getVerifiedUser
} from "@closeoutflow/auth/server";
import { serverEnv } from "@closeoutflow/env/server";
import { cookies } from "next/headers";

export async function createRequestAuthClient() {
  if (!serverEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const cookieStore = await cookies();
  return createServerAuthClient({
    url: serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (updates) => {
        try {
          for (const cookie of updates) cookieStore.set(cookie);
        } catch {
          // Server Components cannot set cookies. The proxy refresh path owns rotation.
        }
      }
    }
  });
}

export async function getRequestUser() {
  const client = await createRequestAuthClient();
  if (!client) return null;
  return getVerifiedUser(client);
}

export type RequestAuthClient = NonNullable<Awaited<ReturnType<typeof createRequestAuthClient>>>;

export { getVerifiedAssuranceLevel };
