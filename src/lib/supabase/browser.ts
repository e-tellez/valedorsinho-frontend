import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      // This client is pinned to the pkce flow by @supabase/ssr. Its automatic
      // URL detection throws "Not a valid PKCE flow url" on the implicit hash
      // tokens delivered to /auth/callback, so we disable it and set the session
      // explicitly there via setSession().
      { auth: { detectSessionInUrl: false } },
    );
  }
  return client;
}
