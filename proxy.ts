import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Build a response object we can attach cookie updates to
  const response = NextResponse.next();

  // Create a Supabase client that can read/write cookies from this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() is the safe way to check auth — it verifies the token with Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in and trying to reach a protected page → send to landing
  if (!user && path === "/tasks") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

// Run on all routes except Next.js internals and static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
