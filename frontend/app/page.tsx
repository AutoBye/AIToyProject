"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Activity, Bot, Check, Copy, FileUp, History, Loader2, Send, WalletCards, X, ArrowDownToLine } from "lucide-react";
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
  analysisComplete: "\ubd84\uc11d \uc644\ub8cc!",
  analyzing: "\ubd84\uc11d \uc911\uc785\ub2c8\ub2e4",
  analyses: "\ubd84\uc11d",
  assistant: "AI \uc5b4\uc2dc\uc2a4\ud134\ud2b8",
  chatPlaceholder: "\uc6d0\uc778, \ud574\uacb0 \ubc29\ubc95, \ub9ac\ud329\ud1a0\ub9c1 \ubc29\ud5a5\uc744 \uc9c8\ubb38\ud558\uc138\uc694...",
  chatHistory: "AI \ub300\ud654 \uae30\ub85d",
  chatHistoryEmpty: "\uc774 \ubd84\uc11d\uc5d0 \uc800\uc7a5\ub41c AI \ub300\ud654\uac00 \uc544\uc9c1 \uc5c6\uc2b5\ub2c8\ub2e4.",
  chatScrollBottom: "\ub9e8 \ubc11\uc73c\ub85c",
  code: "\ucf54\ub4dc",
  codeAnalysis: "\ucf54\ub4dc \ubd84\uc11d",
  codeCopied: "\ubcf5\uc0ac\ub428",
  codeCopy: "\ubcf5\uc0ac",
  codeExample: "\ucf54\ub4dc \uc608\uc2dc",
  codeLanguage: "\uc5b8\uc5b4",
  improvedCode: "\uac1c\uc120/\uc218\uc815 \ucf54\ub4dc",
  improvedCodeHint: "AI \ubd84\uc11d \uacb0\uacfc\uc5d0\uc11c \uac10\uc9c0\ub41c \ucf54\ub4dc \ube14\ub85d\uc785\ub2c8\ub2e4. \ud544\uc694\ud55c \ucf54\ub4dc\ub97c \ubcf5\uc0ac\ud574 \uc0ac\uc6a9\ud558\uc138\uc694.",
  dashboard: "\ub300\uc2dc\ubcf4\ub4dc",
  failed: "\uc2e4\ud328",
  history: "\ubd84\uc11d \uae30\ub85d",
  log: "\ub85c\uadf8",
  logAnalysis: "\ub85c\uadf8 \ubd84\uc11d",
  noProjectHint: "\uba3c\uc800 \ud504\ub85c\uc81d\ud2b8\ub97c \uc0dd\uc131\ud558\uac70\ub098 \uc120\ud0dd\ud55c \ub4a4 \ud30c\uc77c\uc744 \uc5c5\ub85c\ub4dc\ud558\uc138\uc694.",
  dropHint: "\ud30c\uc77c\uc744 \uc5ec\uae30\uc5d0 \ub4dc\ub798\uadf8\ud574 \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  autoAnalysisHint: "\uc5c5\ub85c\ub4dc \ub610\ub294 \ubd99\uc5ec\ub123\uae30 \uc644\ub8cc \ud6c4 \uc790\ub3d9\uc73c\ub85c \ubd84\uc11d\uc774 \uc2dc\uc791\ub429\ub2c8\ub2e4.",
  pasteContent: "\ucf54\ub4dc/\ub85c\uadf8 \ubd99\uc5ec\ub123\uae30",
  pastePlaceholder: "\ubd84\uc11d\ud560 \ucf54\ub4dc \ub610\ub294 \ub85c\uadf8\ub97c \uc5ec\uae30\uc5d0 \ubd99\uc5ec\ub123\uc73c\uc138\uc694.",
  pasteSubmit: "\ubd99\uc5ec\ub123\uace0 \uc790\ub3d9 \ubd84\uc11d",
  pasteRequired: "\ubd99\uc5ec\ub123\uc740 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574\uc57c \ud569\ub2c8\ub2e4.",
  cancelUpload: "\uc5c5\ub85c\ub4dc/\ubd84\uc11d \ucde8\uc18c",
  cancelComplete: "\uc5c5\ub85c\ub4dc\uc640 \ubd84\uc11d\uc744 \ucde8\uc18c\ud588\uc2b5\ub2c8\ub2e4.",
  cancelFailed: "\ucde8\uc18c \uc694\uccad \ucc98\ub9ac \uc911 \uc77c\ubd80 \uc815\ub9ac\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  noAnalysisChatHint: "\uba3c\uc800 \ubd84\uc11d\uc744 \uc2e4\ud589\ud558\uac70\ub098 \uae30\ub85d\uc5d0\uc11c \ubd84\uc11d\uc744 \uc120\ud0dd\ud558\uba74 AI \ub300\ud654\ub97c \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  processing: "\ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4",
  removeUpload: "\uc5c5\ub85c\ub4dc \ucde8\uc18c",
  projectNameRequired: "\ud504\ub85c\uc81d\ud2b8 \uc774\ub984\uc744 \uc785\ub825\ud574\uc57c \ud569\ub2c8\ub2e4.",
  projectNamePlaceholder: "\ud504\ub85c\uc81d\ud2b8 \uc774\ub984",
  projectSelect: "\ud504\ub85c\uc81d\ud2b8 \uc120\ud0dd",
  projectCreate: "\ud504\ub85c\uc81d\ud2b8 \uc0dd\uc131",
  projects: "\ud504\ub85c\uc81d\ud2b8",
  readyHint: "\uc18c\uc2a4 \ucf54\ub4dc \ub610\ub294 \uc11c\ubc84 \ub85c\uadf8\ub97c \uc5c5\ub85c\ub4dc\ud558\uac70\ub098 \ubd99\uc5ec\ub123\uc73c\uba74 \uc790\ub3d9\uc73c\ub85c \ubd84\uc11d\uc774 \uc2dc\uc791\ub429\ub2c8\ub2e4.",
  send: "\uc804\uc1a1",
  senderAssistant: "AI",
  senderUser: "\ub098",
  statusCompleted: "\uc644\ub8cc",
  statusQueued: "\ub300\uae30",
  statusRunning: "\ubd84\uc11d \uc911",
  tokens: "\ud1a0\ud070",
  upload: "\ucf54\ub4dc \ub610\ub294 \ub85c\uadf8 \uc5c5\ub85c\ub4dc",
  uploading: "\uc5c5\ub85c\ub4dc \uc911\uc785\ub2c8\ub2e4",
  uploadFailed: "\ud30c\uc77c \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  uploads: "\uc5c5\ub85c\ub4dc"
};

type CodeBlock = {
  language: string;
  code: string;
};

function extractCodeBlocks(markdown?: string): CodeBlock[] {
  if (!markdown) return [];
  const blocks: CodeBlock[] = [];
  const fencePattern = /```([a-zA-Z0-9_+.-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = fencePattern.exec(markdown)) !== null) {
    const code = match[2].trim();
    if (!code) continue;
    blocks.push({
      language: match[1] || "text",
      code
    });
  }
  return blocks;
}

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

const genericSummaryLabels = new Set(["개요", "요약", "문제점", "권장 수정 사항", "권장 조치", "근본 원인"]);

function cleanSummaryLine(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function readableAnalysisSummary(item: Analysis): string {
  if (item.status === "failed" && item.error_message) return item.error_message;
  const markdown = typeof item.result.markdown === "string" ? item.result.markdown : "";
  const candidates = [item.summary ?? "", ...markdown.split(/\r?\n/)];
  let inCodeBlock = false;
  for (const rawLine of candidates) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const line = cleanSummaryLine(trimmed);
    if (!line || genericSummaryLabels.has(line)) continue;
    if (line.length < 8) continue;
    return line.length > 120 ? `${line.slice(0, 120)}...` : line;
  }
  return item.id;
}

function readableAnalysisTitle(item: Analysis): string {
  const source = item.upload_file_name?.trim() || kindLabel[item.kind];
  return `${source} ${statusLabel[item.status]}`;
}

const SELECTED_PROJECT_STORAGE_KEY = "selected_project_id";
const SELECTED_ANALYSIS_STORAGE_KEY = "selected_analysis_id";

export default function Home() {
  const auth = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeUploadRef = useRef<Upload | null>(null);
  const operationIdRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectError, setProjectError] = useState("");
  const [upload, setUpload] = useState<Upload | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [error, setError] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pasteKind, setPasteKind] = useState<"code" | "log">("code");
  const [pasteContent, setPasteContent] = useState("");
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const canUpload = Boolean(projectId) && !busy;
  const codeBlocks = useMemo(() => {
    const analysisBlocks = extractCodeBlocks(analysis?.result.markdown);
    const chatBlocks = chatMessages.flatMap((message) => message.role === "assistant" ? extractCodeBlocks(message.content) : []);
    const streamingBlocks = extractCodeBlocks(answer);
    return [...analysisBlocks, ...chatBlocks, ...streamingBlocks];
  }, [analysis?.result.markdown, answer, chatMessages]);

  useEffect(() => {
    setMounted(true);
    auth.loadUser().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!auth.token) return;
    refresh().catch((exc) => setError(exc.message));
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token || !projectId) return;
    localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, projectId);
  }, [auth.token, projectId]);

  useEffect(() => {
    if (!auth.token || !analysis?.id) return;
    localStorage.setItem(SELECTED_ANALYSIS_STORAGE_KEY, analysis.id);
  }, [auth.token, analysis?.id]);

  useEffect(() => {
    if (!auth.token || !projectId) {
      setHistory([]);
      setAnalysis(null);
      setUpload(null);
      return;
    }
    loadAnalysisHistory(projectId).catch((exc) => setError(exc.message));
    setUpload(null);
    setAnswer("");
  }, [auth.token, projectId]);

  useEffect(() => {
    if (!auth.token || !projectId || !analysis?.id) {
      setChatMessages([]);
      return;
    }
    loadChatHistory(projectId, analysis.id).catch((exc) => setError(exc.message));
  }, [auth.token, projectId, analysis?.id]);

  useEffect(() => {
    chatHistoryRef.current?.scrollTo({
      top: chatHistoryRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [chatMessages.length, answer]);

  async function refresh() {
    const [dashboardData, projectData] = await Promise.all([
      apiFetch<Dashboard>("/api/projects/dashboard"),
      apiFetch<Project[]>("/api/projects")
    ]);
    setDashboard(dashboardData);
    setProjects(projectData);
    const savedProjectId = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    const savedProjectExists = projectData.some((project) => project.id === savedProjectId);
    const selectedProjectId = projectId || (savedProjectExists ? savedProjectId : projectData[0]?.id) || "";
    if (selectedProjectId && !projectId) setProjectId(selectedProjectId);
    if (selectedProjectId) await loadAnalysisHistory(selectedProjectId);
  }

  async function loadAnalysisHistory(targetProjectId: string, preferredAnalysisId?: string) {
    const items = await apiFetch<Analysis[]>(`/api/analysis/history?project_id=${targetProjectId}`);
    setHistory(items);
    const savedAnalysisId = preferredAnalysisId ?? localStorage.getItem(SELECTED_ANALYSIS_STORAGE_KEY);
    const savedAnalysis = items.find((item) => item.id === savedAnalysisId);
    setAnalysis(savedAnalysis ?? items[0] ?? null);
  }

  async function loadChatHistory(targetProjectId: string, targetAnalysisId: string) {
    const messages = await apiFetch<ChatMessage[]>(`/api/analysis/chat/history?project_id=${targetProjectId}&analysis_id=${targetAnalysisId}`);
    setChatMessages(messages);
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) {
      setProjectError(text.projectNameRequired);
      return;
    }
    setProjectError("");
    const project = await apiFetch<Project>("/api/projects", { method: "POST", body: JSON.stringify({ name }) });
    setProjects((items) => [project, ...items]);
    setProjectId(project.id);
    setProjectName("");
  }

  function beginUploadOperation(): { operationId: number; controller: AbortController } {
    const controller = new AbortController();
    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    abortControllerRef.current = controller;
    activeUploadRef.current = null;
    return { operationId, controller };
  }

  function isActiveOperation(operationId: number, signal?: AbortSignal): boolean {
    return operationIdRef.current === operationId && !signal?.aborted;
  }

  async function uploadFile(file: File | undefined) {
    if (!file || !projectId) return;
    const { operationId, controller } = beginUploadOperation();
    setBusy(true);
    setActionStatus("uploading");
    setError("");
    const form = new FormData();
    form.set("project_id", projectId);
    form.set("file", file);
    try {
      const uploaded = await apiFetch<Upload>("/api/uploads", { method: "POST", body: form, signal: controller.signal });
      if (!isActiveOperation(operationId, controller.signal)) return;
      setUpload(uploaded);
      activeUploadRef.current = uploaded;
      if (fileInputRef.current) fileInputRef.current.value = "";
      await executeAnalysis(uploaded, uploaded.kind, operationId, controller.signal);
    } catch (exc) {
      if (exc instanceof DOMException && exc.name === "AbortError") return;
      setError(exc instanceof Error ? exc.message : text.uploadFailed);
    } finally {
      if (isActiveOperation(operationId)) {
        setBusy(false);
        setActionStatus("idle");
        abortControllerRef.current = null;
        activeUploadRef.current = null;
      }
    }
  }

  async function uploadPastedContent() {
    if (!projectId) return;
    const content = pasteContent.trim();
    if (!content) {
      setError(text.pasteRequired);
      return;
    }
    const { operationId, controller } = beginUploadOperation();
    setBusy(true);
    setActionStatus("uploading");
    setError("");
    try {
      const uploaded = await apiFetch<Upload>("/api/uploads/text", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, kind: pasteKind, content }),
        signal: controller.signal
      });
      if (!isActiveOperation(operationId, controller.signal)) return;
      setUpload(uploaded);
      activeUploadRef.current = uploaded;
      setPasteContent("");
      await executeAnalysis(uploaded, uploaded.kind, operationId, controller.signal);
    } catch (exc) {
      if (exc instanceof DOMException && exc.name === "AbortError") return;
      setError(exc instanceof Error ? exc.message : text.uploadFailed);
    } finally {
      if (isActiveOperation(operationId)) {
        setBusy(false);
        setActionStatus("idle");
        abortControllerRef.current = null;
        activeUploadRef.current = null;
      }
    }
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    await uploadFile(event.target.files?.[0]);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (canUpload) setIsDraggingFile(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    if (!canUpload) return;
    await uploadFile(event.dataTransfer.files?.[0]);
  }

  async function executeAnalysis(targetUpload: Upload, kind: "code" | "log", operationId: number, signal: AbortSignal) {
    setActionStatus("analyzing");
    try {
      const result = await apiFetch<Analysis>(`/api/analysis/${kind}`, { method: "POST", body: JSON.stringify({ upload_id: targetUpload.id }), signal });
      if (!isActiveOperation(operationId, signal)) return;
      setAnalysis(result);
      setHistory((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      localStorage.setItem(SELECTED_ANALYSIS_STORAGE_KEY, result.id);
      setChatMessages([]);
      if (result.status === "failed") {
        setError(result.error_message ?? text.analysisFailed);
      } else {
        setToast(text.analysisComplete);
        window.setTimeout(() => setToast(""), 2500);
      }
      await refresh();
      await loadAnalysisHistory(result.project_id, result.id);
    } catch (exc) {
      if (exc instanceof DOMException && exc.name === "AbortError") return;
      setError(exc instanceof Error ? exc.message : text.analysisFailed);
    }
  }

  async function clearUpload() {
    const uploadToDelete = activeUploadRef.current ?? upload;
    operationIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeUploadRef.current = null;
    setUpload(null);
    setAnalysis(null);
    setChatMessages([]);
    setAnswer("");
    setError("");
    setBusy(false);
    setActionStatus("idle");
    localStorage.removeItem(SELECTED_ANALYSIS_STORAGE_KEY);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (uploadToDelete) {
      try {
        await apiFetch(`/api/uploads/${uploadToDelete.id}`, { method: "DELETE" });
        setHistory((items) => items.filter((item) => item.upload_id !== uploadToDelete.id));
      } catch {
        setError(text.cancelFailed);
        return;
      }
    }
    setToast(text.cancelComplete);
    window.setTimeout(() => setToast(""), 2500);
  }

  async function copyCodeBlock(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    window.setTimeout(() => setCopiedCodeIndex(null), 1600);
  }

  function scrollChatHistoryToBottom() {
    chatHistoryRef.current?.scrollTo({
      top: chatHistoryRef.current.scrollHeight,
      behavior: "smooth"
    });
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !analysis?.id || !chat.trim()) return;
    const question = chat;
    setAnswer("");
    setChat("");
    setChatMessages((messages) => [
      ...messages,
      {
        id: `local-user-${Date.now()}`,
        analysis_id: analysis.id,
        project_id: projectId,
        role: "user",
        content: question,
        created_at: new Date().toISOString()
      }
    ]);
    let collected = "";
    await streamChat({ project_id: projectId, analysis_id: analysis.id, message: question }, (chunk) => {
      collected += chunk;
      setAnswer((value) => value + chunk);
    });
    setChatMessages((messages) => [
      ...messages,
      {
        id: `local-assistant-${Date.now()}`,
        analysis_id: analysis.id,
        project_id: projectId,
        role: "assistant",
        content: collected,
        created_at: new Date().toISOString()
      }
    ]);
    await loadChatHistory(projectId, analysis.id);
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
              <Input
                value={projectName}
                onChange={(event) => {
                  setProjectName(event.target.value);
                  if (projectError) setProjectError("");
                }}
                placeholder={text.projectNamePlaceholder}
              />
              <Button className="w-full">{text.projectCreate}</Button>
            </form>
            {projectError && <p className="mt-2 text-sm text-red-500">{projectError}</p>}
            <select className="mt-3 h-10 w-full rounded-md border border-border bg-panel px-3 text-sm" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">{text.projectSelect}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </section>

          <section className="rounded-lg border border-border bg-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><History size={16} /> {text.history}</h2>
            <div className="space-y-2">
              {history.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setAnalysis(item);
                    localStorage.setItem(SELECTED_ANALYSIS_STORAGE_KEY, item.id);
                  }}
                  className="w-full rounded-md border border-border p-2 text-left text-xs hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{readableAnalysisTitle(item)}</span>
                    {item.severity && <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-slate-500">{item.severity}</span>}
                  </div>
                  <div className="mt-1 truncate text-slate-500">{readableAnalysisSummary(item)}</div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div
            className={`rounded-lg border bg-panel p-4 transition ${
              isDraggingFile ? "border-accent ring-2 ring-accent/40" : "border-border"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
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
              {(busy || upload) && (
                <Button className="h-10 gap-2 bg-red-600 px-3 hover:bg-red-700" type="button" onClick={clearUpload}>
                  <X size={16} />
                  <span>{text.cancelUpload}</span>
                </Button>
              )}
            </div>
            {canUpload && <p className="mt-3 text-sm text-slate-500">{text.dropHint}</p>}
            {projectId && <p className="mt-2 text-sm text-slate-500">{text.autoAnalysisHint}</p>}
            {!projectId && <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">{text.noProjectHint}</p>}
            <div className="mt-4 rounded-md border border-border bg-surface p-3">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold">{text.pasteContent}</h3>
                <select
                  className="h-9 rounded-md border border-border bg-panel px-3 text-sm"
                  disabled={!projectId || busy}
                  value={pasteKind}
                  onChange={(event) => setPasteKind(event.target.value as "code" | "log")}
                >
                  <option value="code">{text.code}</option>
                  <option value="log">{text.log}</option>
                </select>
              </div>
              <textarea
                className="min-h-36 w-full resize-y rounded-md border border-border bg-panel p-3 text-sm outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!projectId || busy}
                value={pasteContent}
                onChange={(event) => setPasteContent(event.target.value)}
                placeholder={text.pastePlaceholder}
              />
              <Button className="mt-2 w-full" disabled={!projectId || busy || !pasteContent.trim()} type="button" onClick={uploadPastedContent}>
                {text.pasteSubmit}
              </Button>
            </div>
            {upload && (
              <div className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-surface p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">{upload.file_name} / {kindLabel[upload.kind]} / {upload.size_bytes} bytes</p>
                <Button className="h-8 gap-2 bg-red-600 px-3 hover:bg-red-700" type="button" onClick={clearUpload}>
                  <X size={15} />
                  <span>{text.cancelUpload}</span>
                </Button>
              </div>
            )}
            {busy && <p className="mt-3 flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} /> {text.processing}</p>}
            {busy && (
              <div className="mt-3 overflow-hidden rounded-full bg-surface">
                <div className="h-2 w-1/3 rounded-full bg-accent indeterminate-progress" />
              </div>
            )}
            {actionStatus !== "idle" && (
              <p className="mt-2 text-xs text-slate-500">
                {actionStatus === "uploading" ? text.uploading : text.analyzing}
              </p>
            )}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <CodeEditor value={analysis?.result.markdown ?? text.readyHint} />

          {codeBlocks.length > 0 && (
            <section className="rounded-lg border border-border bg-panel p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{text.improvedCode}</h2>
                  <p className="mt-1 text-xs text-slate-500">{text.improvedCodeHint}</p>
                </div>
              </div>
              <div className="space-y-3">
                {codeBlocks.map((block, index) => (
                  <div key={`${block.language}-${index}`} className="overflow-hidden rounded-md border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-slate-500">
                      <span>{text.codeExample} {index + 1} / {text.codeLanguage}: {block.language}</span>
                      <Button className="h-8 gap-2 bg-slate-700 px-3" type="button" onClick={() => copyCodeBlock(block.code, index)}>
                        {copiedCodeIndex === index ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copiedCodeIndex === index ? text.codeCopied : text.codeCopy}</span>
                      </Button>
                    </div>
                    <pre className="max-h-80 overflow-auto p-3 text-xs leading-5">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}

        </section>

        <aside className="flex flex-col rounded-lg border border-border bg-panel p-4 xl:ml-auto xl:w-[300px]">
          <form onSubmit={sendChat} className="border-b border-border pb-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> {text.assistant}</h2>
            {!analysis?.id && <p className="mb-3 rounded-md border border-border bg-surface p-3 text-sm text-slate-500">{text.noAnalysisChatHint}</p>}
            <div className="space-y-2">
              <Input disabled={!analysis?.id} value={chat} onChange={(event) => setChat(event.target.value)} placeholder={text.chatPlaceholder} />
              <Button disabled={!analysis?.id || !chat.trim()} className="h-10 w-full gap-2 px-4 text-sm" title={text.send}>
                <Send size={22} />
                <span className="whitespace-nowrap">{text.send}</span>
              </Button>
            </div>
          </form>

          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> {text.chatHistory}</h2>
              <Button className="h-8 gap-1 bg-slate-700 px-2 text-xs" type="button" onClick={scrollChatHistoryToBottom}>
                <ArrowDownToLine size={14} />
                <span>{text.chatScrollBottom}</span>
              </Button>
            </div>
            <div ref={chatHistoryRef} className="max-h-[660px] space-y-3 overflow-y-auto pr-1">
              {!analysis?.id && <p className="rounded-md border border-border bg-surface p-3 text-sm text-slate-500">{text.noAnalysisChatHint}</p>}
              {analysis?.id && chatMessages.length === 0 && <p className="rounded-md border border-border bg-surface p-3 text-sm text-slate-500">{text.chatHistoryEmpty}</p>}
              {chatMessages.map((message) => (
                <div key={message.id} className="rounded-md border border-border bg-surface p-3 text-sm">
                  <div className="mb-1 text-xs font-semibold text-slate-500">
                    {message.role === "user" ? text.senderUser : text.senderAssistant}
                  </div>
                  <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                </div>
              ))}
              {answer && (
                <div className="rounded-md border border-border bg-surface p-3 text-sm">
                  <div className="mb-1 text-xs font-semibold text-slate-500">{text.senderAssistant}</div>
                  <p className="whitespace-pre-wrap leading-6">{answer}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md border border-emerald-500/40 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
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
