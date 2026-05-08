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
      setError(exc instanceof Error ? exc.message : "인증에 실패했습니다.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-sm">
        <ShieldCheck className="mb-5 text-accent" size={34} />
        <h1 className="text-xl font-bold">AI 분석 워크스페이스</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">로그인 후 코드, 로그, 분석 기록, AI 사용량을 관리하세요.</p>
        <div className="mt-5 space-y-3">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" />
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <Button disabled={auth.loading} className="mt-5 w-full">{mode === "login" ? "로그인" : "회원가입"}</Button>
        <button type="button" className="mt-4 text-sm text-accent" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
        </button>
      </form>
    </main>
  );
}
