"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Activity, Bot, FileUp, History, Loader2, Send, WalletCards, X } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { CodeEditor } from "@/components/CodeEditor";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, streamChat } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Analysis, ChatMessage, Dashboard, Project, Upload } from "@/types/api";

const text = {
  analysisFailed: "\ubd84\uc11d \uc2e4\ud589\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  analyses: "\ubd84\uc11d",
  assistant: "AI \uc5b4\uc2dc\uc2a4\ud134\ud2b8",
  chatPlaceholder: "\uc6d0\uc778, \ud574\uacb0 \ubc29\ubc95, \ub9ac\ud329\ud1a0\ub9c1 \ubc29\ud5a5\uc744 \uc9c8\ubb38\ud558\uc138\uc694...",
  chatHistory: "AI \ub300\ud654 \uae30\ub85d",
  chatHistoryEmpty: "\uc544\uc9c1 \uc800\uc7a5\ub41c AI \ub300\ud654\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
  code: "\ucf54\ub4dc",
  codeAnalysis: "\ucf54\ub4dc \ubd84\uc11d",
  dashboard: "\ub300\uc2dc\ubcf4\ub4dc",
  failed: "\uc2e4\ud328",
  history: "\ubd84\uc11d \uae30\ub85d",
  log: "\ub85c\uadf8",
  logAnalysis: "\ub85c\uadf8 \ubd84\uc11d",
  noProjectHint: "\uba3c\uc800 \ud504\ub85c\uc81d\ud2b8\ub97c \uc0dd\uc131\ud558\uac70\ub098 \uc120\ud0dd\ud55c \ub4a4 \ud30c\uc77c\uc744 \uc5c5\ub85c\ub4dc\ud558\uc138\uc694.",
  processing: "\ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4",
  removeUpload: "\uc5c5\ub85c\ub4dc \ucde8\uc18c",
  projectDefault: "\uc6b4\uc601 API",
  projectSelect: "\ud504\ub85c\uc81d\ud2b8 \uc120\ud0dd",
  projectCreate: "\ud504\ub85c\uc81d\ud2b8 \uc0dd\uc131",
  projects: "\ud504\ub85c\uc81d\ud2b8",
  readyHint: "\uc18c\uc2a4 \ucf54\ub4dc \ub610\ub294 \uc11c\ubc84 \ub85c\uadf8\ub97c \uc5c5\ub85c\ub4dc\ud55c \ub4a4 \ubd84\uc11d\uc744 \uc2e4\ud589\ud558\uc138\uc694.",
  send: "\uc804\uc1a1",
  senderAssistant: "AI",
  senderUser: "\ub098",
  statusCompleted: "\uc644\ub8cc",
  statusQueued: "\ub300\uae30",
  statusRunning: "\ubd84\uc11d \uc911",
  tokens: "\ud1a0\ud070",
  upload: "\ucf54\ub4dc \ub610\ub294 \ub85c\uadf8 \uc5c5\ub85c\ub4dc",
  uploadFailed: "\ud30c\uc77c \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  uploads: "\uc5c5\ub85c\ub4dc"
};

const kindLabel: Record<Analysis["kind"] | Upload["kind"], string> = {
  code: text.code,
  log: text.log
};

const statusLabel: Record<Analysis["status"], string> = {
  queued: text.statusQueued,
  running: text.statusRunning,
  completed: text.statusCompleted,
  failed: text.failed
};

export default function Home() {
  const auth = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState(text.projectDefault);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canUpload = Boolean(projectId) && !busy;

  useEffect(() => {
    setMounted(true);
    auth.loadUser().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!auth.token) return;
    refresh().catch((exc) => setError(exc.message));
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token || !projectId) {
      setChatMessages([]);
      return;
    }
    loadChatHistory(projectId).catch((exc) => setError(exc.message));
  }, [auth.token, projectId]);

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

  async function loadChatHistory(targetProjectId: string) {
    const messages = await apiFetch<ChatMessage[]>(`/api/analysis/chat/history?project_id=${targetProjectId}`);
    setChatMessages(messages);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : text.uploadFailed);
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
      if (result.status === "failed") {
        setError(result.error_message ?? text.analysisFailed);
      }
      await refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : text.analysisFailed);
    } finally {
      setBusy(false);
    }
  }

  function clearUpload() {
    setUpload(null);
    setAnalysis(null);
    setAnswer("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !chat.trim()) return;
    const question = chat;
    setAnswer("");
    setChat("");
    setChatMessages((messages) => [
      ...messages,
      {
        id: `local-user-${Date.now()}`,
        analysis_id: analysis?.id ?? null,
        project_id: projectId,
        role: "user",
        content: question,
        created_at: new Date().toISOString()
      }
    ]);
    let collected = "";
    await streamChat({ project_id: projectId, analysis_id: analysis?.id, message: question }, (chunk) => {
      collected += chunk;
      setAnswer((value) => value + chunk);
    });
    setChatMessages((messages) => [
      ...messages,
      {
        id: `local-assistant-${Date.now()}`,
        analysis_id: analysis?.id ?? null,
        project_id: projectId,
        role: "assistant",
        content: collected,
        created_at: new Date().toISOString()
      }
    ]);
    await loadChatHistory(projectId);
  }

  if (!mounted) return <main className="min-h-screen bg-surface" />;
  if (!auth.token) return <AuthPanel />;

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(720px,1fr)_300px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity size={16} /> {text.dashboard}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label={text.projects} value={dashboard?.projects ?? 0} />
              <Metric label={text.analyses} value={dashboard?.analyses ?? 0} />
              <Metric label={text.uploads} value={dashboard?.uploads ?? 0} />
              <Metric label={text.tokens} value={dashboard?.tokens ?? 0} icon={<WalletCards size={14} />} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-panel p-4">
            <form onSubmit={createProject} className="space-y-3">
              <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <Button className="w-full">{text.projectCreate}</Button>
            </form>
            <select className="mt-3 h-10 w-full rounded-md border border-border bg-panel px-3 text-sm" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">{text.projectSelect}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </section>

          <section className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><History size={16} /> {text.history}</h2>
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
              <label
                aria-disabled={!canUpload}
                className={`flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition ${
                  canUpload ? "cursor-pointer hover:bg-surface" : "cursor-not-allowed opacity-50"
                }`}
              >
                <FileUp size={16} />
                <input ref={fileInputRef} type="file" className="hidden" disabled={!canUpload} onChange={onUpload} />
                {text.upload}
              </label>
              <div className="flex gap-2">
                <Button disabled={!upload || busy} onClick={() => runAnalysis("code")}>{text.codeAnalysis}</Button>
                <Button disabled={!upload || busy} onClick={() => runAnalysis("log")} className="bg-slate-700">{text.logAnalysis}</Button>
              </div>
            </div>
            {!projectId && <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">{text.noProjectHint}</p>}
            {upload && (
              <div className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-surface p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">{upload.file_name} / {kindLabel[upload.kind]} / {upload.size_bytes} bytes</p>
                <Button className="h-8 gap-2 bg-slate-700 px-3" type="button" onClick={clearUpload}>
                  <X size={15} />
                  <span>{text.removeUpload}</span>
                </Button>
              </div>
            )}
            {busy && <p className="mt-3 flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} /> {text.processing}</p>}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <CodeEditor value={analysis?.result.markdown ?? text.readyHint} />

          <form onSubmit={sendChat} className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> {text.assistant}</h2>
            <div className="flex gap-2">
              <Input value={chat} onChange={(event) => setChat(event.target.value)} placeholder={text.chatPlaceholder} />
              <Button className="h-10 min-w-24 shrink-0 gap-2 px-4 text-sm" title={text.send}>
                <Send size={22} />
                <span className="whitespace-nowrap">{text.send}</span>
              </Button>
            </div>
            {answer && <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface p-3 text-sm">{answer}</pre>}
          </form>
        </section>

        <aside className="rounded-lg border border-border bg-panel p-4 xl:ml-auto xl:w-[300px]">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> {text.chatHistory}</h2>
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {chatMessages.length === 0 && <p className="rounded-md border border-border bg-surface p-3 text-sm text-slate-500">{text.chatHistoryEmpty}</p>}
            {chatMessages.map((message) => (
              <div key={message.id} className="rounded-md border border-border bg-surface p-3 text-sm">
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  {message.role === "user" ? text.senderUser : text.senderAssistant}
                </div>
                <p className="whitespace-pre-wrap leading-6">{message.content}</p>
              </div>
            ))}
          </div>
        </aside>
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
