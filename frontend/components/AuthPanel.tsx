"use client";

import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const auth = useAuthStore();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "login") await auth.login(email, password);
      else await auth.register(email, password);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Authentication failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-sm">
        <ShieldCheck className="mb-5 text-accent" size={34} />
        <h1 className="text-xl font-bold">Secure workspace access</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Sign in to analyze code, logs, history, and AI usage.</p>
        <div className="mt-5 space-y-3">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <Button disabled={auth.loading} className="mt-5 w-full">{mode === "login" ? "Log in" : "Create account"}</Button>
        <button type="button" className="mt-4 text-sm text-accent" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account?" : "Have an account?"}
        </button>
      </form>
    </main>
  );
}
