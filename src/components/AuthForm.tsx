"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Authentication failed.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="murmur-auth-card">
      <div className="murmur-auth-brand">
        <span className="murmur-logo">✺</span>
        <div>
          <h1>Murmur</h1>
          <p>Sign in to deploy and replay durable AI swarms.</p>
        </div>
      </div>

      <div className="murmur-auth-tabs" role="tablist" aria-label="Authentication mode">
        <button className={mode === "sign-in" ? "is-active" : ""} onClick={() => setMode("sign-in")}>
          Sign in
        </button>
        <button className={mode === "sign-up" ? "is-active" : ""} onClick={() => setMode("sign-up")}>
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="murmur-auth-form">
        {mode === "sign-up" && (
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </label>
        {error && <p className="murmur-auth-error">{error}</p>}
        <button type="submit" className="murmur-run" disabled={busy}>
          {busy ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
