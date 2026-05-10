"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, Eye, EyeOff, FileSearch, Loader2, LockKeyhole, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const features = [
  "코드와 서버 로그를 AI로 분석",
  "후속 질문을 리포트에 직접 반영",
  "분석 히스토리와 채팅 기록 저장"
];

const demoSteps = ["샘플 입력", "AI 분석", "질문", "리포트 반영"];
const REMEMBER_EMAIL_KEY = "remembered_login_email";

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuthStore();

  const isLogin = mode === "login";

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (!rememberedEmail) return;
    setEmail(rememberedEmail);
    setRememberEmail(true);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await auth.login(email, password);
        if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } else {
        await auth.register(email, password, fullName.trim());
      }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "인증에 실패했습니다.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,.18),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(56,189,248,.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,.12),rgba(2,6,23,.96))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between gap-10">
        <section className="pt-8 lg:pt-16">
          <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles size={16} className="text-cyan-300" />
              AI Code & Log Analyzer
            </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              코드와 로그를 분석하고, AI 답변까지 리포트로 정리합니다.
            </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              업로드, 분석, 후속 질문, 리포트 반영, Markdown 다운로드까지 이어지는 포트폴리오용 AI 분석 워크스페이스입니다.
            </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 gap-2 bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200" type="button" onClick={() => setShowAuth(true)}>
                  <LockKeyhole size={18} />
                  <span>AI 분석 워크스페이스 시작하기</span>
                  <ArrowRight size={18} />
                </Button>
                <a className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10" href="http://localhost:8000/docs">
                  API 문서 보기
                </a>
              </div>
            </div>

            <div className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileSearch size={17} />
                데모 흐름
              </div>
              <div className="grid gap-2">
                {demoSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2 rounded-md bg-slate-900/70 px-3 py-2 text-xs font-semibold">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-[11px] text-slate-950">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature}
                className="feature-rise min-h-36 rounded-md border border-white/15 bg-white/10 p-6 text-lg font-semibold leading-7 shadow-sm opacity-0 backdrop-blur"
                style={{ animationDelay: `${350 + index * 520}ms` }}
              >
                  <CheckCircle2 className="mb-5 text-emerald-300" size={24} />
                  <span>{feature}</span>
                </div>
            ))}
          </div>
        </section>
      </div>

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-border bg-panel p-6 text-slate-950 shadow-2xl dark:text-white">
            <button
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-surface"
              type="button"
              onClick={() => setShowAuth(false)}
              title="로그인 창 닫기"
            >
              <X size={18} />
            </button>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-accent/10 text-accent">
              <ShieldCheck size={26} />
            </div>
            <div className="mb-5 grid grid-cols-2 rounded-md border border-border bg-surface p-1 text-sm font-semibold">
              <button
                className={`h-9 rounded-md transition ${isLogin ? "bg-panel text-accent shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                로그인
              </button>
              <button
                className={`h-9 rounded-md transition ${!isLogin ? "bg-panel text-accent shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                회원가입
              </button>
            </div>
            <h2 className="text-2xl font-bold">{isLogin ? "워크스페이스 로그인" : "새 계정 만들기"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isLogin
                ? "기존 계정으로 프로젝트, 분석 리포트, AI 대화 기록을 이어서 관리합니다."
                : "새 계정을 만들고 AI 분석 워크스페이스를 바로 시작합니다."}
            </p>

            {isLogin && <div className="mt-6 rounded-md border border-border bg-surface p-3 text-xs text-slate-500">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <Bot size={15} />
                빠른 데모 계정
              </div>
              <div className="mt-2 grid gap-1">
                <span>email: demo@example.com</span>
                <span>password: password123</span>
              </div>
            </div>}

            <div className="mt-6 space-y-4">
              {!isLogin && (
                <label className="block text-sm font-semibold">
                  이름
                  <Input className="mt-2" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="홍길동" />
                </label>
              )}
              <label className="block text-sm font-semibold">
                이메일
                <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="demo@example.com" />
              </label>
              <label className="block text-sm font-semibold">
                비밀번호
                <div className="relative mt-2">
                  <Input
                    className="pr-11"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="password123"
                  />
                  <button
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-surface"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              {isLogin && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    checked={rememberEmail}
                    className="h-4 w-4 rounded border-border accent-teal-600"
                    type="checkbox"
                    onChange={(event) => setRememberEmail(event.target.checked)}
                  />
                  <span>로그인했던 아이디 기억하기</span>
                </label>
              )}
            </div>

            {error && <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}

            <Button disabled={auth.loading} className="mt-6 h-11 w-full gap-2">
              {auth.loading ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
              <span>{isLogin ? "로그인" : "회원가입"}</span>
              {!auth.loading && <ArrowRight size={18} />}
            </Button>

            <button
              type="button"
              className="mt-5 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-accent hover:bg-surface"
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setError("");
              }}
            >
              {isLogin ? "처음이신가요? 새 계정 만들기" : "이미 계정이 있나요? 로그인으로 돌아가기"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
