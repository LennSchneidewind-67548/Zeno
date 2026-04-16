import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use this inside API routes and Server Components (server-only).
// It reads the session from the incoming request's cookies so the server
// knows which user is making the request.
export async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
