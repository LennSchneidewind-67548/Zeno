import { createBrowserClient } from "@supabase/ssr";

// Use this inside React components ("use client" files).
// It reads and writes the session via a cookie in the browser.
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
