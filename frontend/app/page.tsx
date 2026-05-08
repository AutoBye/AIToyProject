"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Activity, Bot, FileUp, History, Loader2, Send, WalletCards } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { CodeEditor } from "@/components/CodeEditor";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, streamChat } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Analysis, Dashboard, Project, Upload } from "@/types/api";

const kindLabel: Record<Analysis["kind"] | Upload["kind"], string> = {
  code: "\ucf54\ub4dc",
  log: "\ub85c\uadf8"
};

const statusLabel: Record<Analysis["status"], string> = {
  queued: "\ub300\uae30",
  running: "\ubd84\uc11d \uc911",
  completed: "\uc644\ub8cc",
  failed: "\uc2e4\ud328"
};

export default function Home() {
  const auth = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("\uc6b4\uc601 API");
  const [upload, setUpload] = useState<Upload | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [chat, setChat] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    auth.loadUser().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!auth.token) return;
    refresh().catch((exc) => setError(exc.message));
  }, [auth.token]);

  async function refresh() {
    const [dashboardData, projectData, historyData] = await Promise.all([
      apiFetch<Dashboard>("/api/projects/dashboard"),
      apiFetch<Project[]>("/api/projects"),
      apiFetch<Analysis[]>("/api/analysis/history")
    ]);
    setDashboard(dashboardData);
    setProjects(projectData);
    setHistory(historyData);
    if (!projectId && projectData[0]) setProjectId(projectData[0].id);
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    const project = await apiFetch<Project>("/api/projects", { method: "POST", body: JSON.stringify({ name: projectName }) });
    setProjects((items) => [project, ...items]);
    setProjectId(project.id);
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;
    setBusy(true);
    const form = new FormData();
    form.set("project_id", projectId);
    form.set("file", file);
    try {
      const uploaded = await apiFetch<Upload>("/api/uploads", { method: "POST", body: form });
      setUpload(uploaded);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "\ud30c\uc77c \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis(kind: "code" | "log") {
    if (!upload) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<Analysis>(`/api/analysis/${kind}`, { method: "POST", body: JSON.stringify({ upload_id: upload.id }) });
      setAnalysis(result);
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "\ubd84\uc11d \uc2e4\ud589\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.");
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !chat.trim()) return;
    setAnswer("");
    await streamChat({ project_id: projectId, analysis_id: analysis?.id, message: chat }, (chunk) => setAnswer((text) => text + chunk));
    setChat("");
  }

  if (!mounted) {
    return <main className="min-h-screen bg-surface" />;
  }

  if (!auth.token) return <AuthPanel />;

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity size={16} /> 대시보드</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="프로젝트" value={dashboard?.projects ?? 0} />
              <Metric label="분석" value={dashboard?.analyses ?? 0} />
              <Metric label="업로드" value={dashboard?.uploads ?? 0} />
              <Metric label="토큰" value={dashboard?.tokens ?? 0} icon={<WalletCards size={14} />} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-panel p-4">
            <form onSubmit={createProject} className="space-y-3">
              <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <Button className="w-full">프로젝트 생성</Button>
            </form>
            <select className="mt-3 h-10 w-full rounded-md border border-border bg-panel px-3 text-sm" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">프로젝트 선택</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </section>

          <section className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><History size={16} /> 분석 기록</h2>
            <div className="space-y-2">
              {history.slice(0, 8).map((item) => (
                <button key={item.id} onClick={() => setAnalysis(item)} className="w-full rounded-md border border-border p-2 text-left text-xs hover:bg-surface">
                  <span className="font-semibold">{kindLabel[item.kind]}</span> {statusLabel[item.status]}
                  <div className="truncate text-slate-500">{item.summary ?? item.id}</div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-panel p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <FileUp size={16} />
                <input type="file" className="hidden" onChange={onUpload} />
                코드 또는 로그 업로드
              </label>
              <div className="flex gap-2">
                <Button disabled={!upload || busy} onClick={() => runAnalysis("code")}>코드 분석</Button>
                <Button disabled={!upload || busy} onClick={() => runAnalysis("log")} className="bg-slate-700">로그 분석</Button>
              </div>
            </div>
            {upload && <p className="mt-3 text-sm text-slate-500">{upload.file_name} / {kindLabel[upload.kind]} / {upload.size_bytes} bytes</p>}
            {busy && <p className="mt-3 flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} /> 처리 중입니다</p>}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <CodeEditor value={analysis?.result.markdown ?? "소스 코드 또는 서버 로그를 업로드한 뒤 분석을 실행하세요."} />

          <form onSubmit={sendChat} className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> AI 어시스턴트</h2>
            <div className="flex gap-2">
              <Input value={chat} onChange={(event) => setChat(event.target.value)} placeholder="원인, 해결 방법, 리팩토링 방향을 질문하세요..." />
              <Button className="w-10 px-0" title="전송"><Send size={17} /></Button>
            </div>
            {answer && <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface p-3 text-sm">{answer}</pre>}
          </form>
        </section>
      </div>
    </Shell>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-1 text-xs text-slate-500">{icon}{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
