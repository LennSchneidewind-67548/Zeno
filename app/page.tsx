"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { getBrowserClient } from "@/lib/supabase-browser";

export default function LandingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => setAuthed(!!data.session));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    router.refresh();
    router.push("/tasks");
  }

  return (
    <LampContainer
      className={authed ? "cursor-pointer" : undefined}
      onClick={authed ? () => router.push("/tasks") : undefined}
    >
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Zeno
      </motion.h1>

      {/* Don't render anything until auth state is known */}
      {authed === null ? null : authed ? (
        <motion.button
          onClick={() => router.push("/tasks")}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: "easeInOut" }}
          className="mt-6 text-sm text-slate-500 tracking-widest uppercase hover:text-slate-300 transition-colors"
        >
          Click anywhere to begin
        </motion.button>
      ) : (
        <>
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeInOut" }}
            className="mt-10 flex flex-col gap-4 w-72"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-transparent border-b border-slate-700 pb-3 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-transparent border-b border-slate-700 pb-3 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors text-left disabled:opacity-40"
            >
              {loading ? "Please wait…" : mode === "login" ? "Log in →" : "Create account →"}
            </button>
          </motion.form>

          <motion.button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
          </motion.button>
        </>
      )}
    </LampContainer>
  );
}
