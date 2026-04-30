import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function hasSupabaseEnv() {
  return getSupabaseConfig() !== null;
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export async function createServerSupabaseClient() {
  return createSupabaseServerClient();
}

export async function createOptionalServerSupabaseClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createSupabaseServerClient();
}
