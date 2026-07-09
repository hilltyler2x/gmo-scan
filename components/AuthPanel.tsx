"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

export function AuthPanel() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;

  if (user) {
    return (
      <div className="mb-6 flex items-center justify-between border-2 border-ink/20 bg-ink/5 px-3 py-2 font-mono text-xs">
        <span className="truncate">Signed in as {user.email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-3 shrink-0 uppercase text-stamp hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (mode === "signup") {
      setMessage("Check your email to confirm your account, then log in.");
    }
    setSubmitting(false);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="mb-6 border-2 border-ink/20 p-3">
      <p className="mb-2 font-mono text-xs uppercase text-manifest">
        Sign in to save your scan history
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-stamp"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-stamp"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-sm border-2 border-ink bg-ink py-2 font-display text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {mode === "signup" ? "Sign up" : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
              setMessage(null);
            }}
            className="shrink-0 rounded-sm border-2 border-ink px-3 font-mono text-xs uppercase text-ink hover:bg-ink hover:text-paper"
          >
            {mode === "signup" ? "Have an account?" : "New here?"}
          </button>
        </div>
      </form>

      <div className="my-3 flex items-center gap-3 font-mono text-xs uppercase text-manifest">
        <div className="h-px flex-1 bg-manifest/40" />
        or
        <div className="h-px flex-1 bg-manifest/40" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2 rounded-sm border-2 border-ink bg-paper py-2 font-display text-sm font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-paper"
      >
        <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Continue with Google
      </button>

      {error && <p className="mt-2 font-mono text-xs text-stamp">{error}</p>}
      {message && <p className="mt-2 font-mono text-xs text-verified">{message}</p>}
    </div>
  );
}
