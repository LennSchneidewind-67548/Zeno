"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getBrowserClient();

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Refresh the server-side session then navigate to the app
    router.refresh();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-white flex justify-center px-6 py-20">
      <main className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-zinc-400 mb-10">
          {mode === "login" ? "Log in to see your tasks." : "Sign up to get started."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-transparent border-b border-zinc-200 pb-3 text-sm text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-zinc-400 transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-transparent border-b border-zinc-200 pb-3 text-sm text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-zinc-400 transition-colors"
          />

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 text-sm font-medium text-zinc-900 hover:text-zinc-500 transition-colors text-left disabled:opacity-40"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in →" : "Create account →"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="mt-8 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
        </button>
      </main>
    </div>
  );
}
