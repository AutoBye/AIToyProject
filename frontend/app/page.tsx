"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  FilePlus2,
  FileText,
  History,
  Loader2,
  MessageSquareQuote,
  RotateCcw,
  Send,
  Sparkles,
  UploadCloud,
  User,
  WalletCards,
  X
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { CodeEditor, MarkdownMessage } from "@/components/CodeEditor";
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
  inputPanel: "\ubd84\uc11d \uc785\ub825",
  inputPanelHint: "\ucf54\ub4dc\ub098 \ub85c\uadf8\ub97c \ubd99\uc5ec\ub123\uac70\ub098 \ud30c\uc77c\ub85c \uc62c\ub9ac\uba74 \uc790\ub3d9\uc73c\ub85c \ubd84\uc11d\ud569\ub2c8\ub2e4.",
  pasteTab: "\ubd99\uc5ec\ub123\uae30",
  fileTab: "\ud30c\uc77c \uc5c5\ub85c\ub4dc",
  fileDropTitle: "\ud30c\uc77c\uc744 \ub193\uac70\ub098 \uc120\ud0dd\ud558\uc138\uc694",
  fileDropDescription: "\uc18c\uc2a4 \ucf54\ub4dc, \uc11c\ubc84 \ub85c\uadf8, \uc5d0\ub7ec \uc2a4\ud0dd\uc744 \ubd84\uc11d\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  pasteContent: "\ucf54\ub4dc/\ub85c\uadf8 \ubd99\uc5ec\ub123\uae30",
  pastePlaceholder: "\ubd84\uc11d\ud560 \ucf54\ub4dc \ub610\ub294 \ub85c\uadf8\ub97c \uc5ec\uae30\uc5d0 \ubd99\uc5ec\ub123\uc73c\uc138\uc694.",
  pasteSubmit: "\ubd99\uc5ec\ub123\uace0 \uc790\ub3d9 \ubd84\uc11d",
  pasteRequired: "\ubd99\uc5ec\ub123\uc740 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574\uc57c \ud569\ub2c8\ub2e4.",
  sampleLoad: "\uc0d8\ud50c \ubd88\ub7ec\uc624\uae30",
  retryAnalysis: "\uc7ac\ubd84\uc11d",
  applyToReport: "\ub9ac\ud3ec\ud2b8\uc5d0 \ubc18\uc601",
  applyingToReport: "\ubc18\uc601 \uc911",
  alreadyAppliedToReport: "\uc774\ubbf8 \ubc18\uc601\ub428",
  reportApplied: "\ub9ac\ud3ec\ud2b8\uc5d0 \ubc18\uc601\ud588\uc2b5\ub2c8\ub2e4.",
  reportApplyFailed: "\ub9ac\ud3ec\ud2b8 \ubc18\uc601\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  cancelUpload: "\uc5c5\ub85c\ub4dc/\ubd84\uc11d \ucde8\uc18c",
  cancelComplete: "\uc5c5\ub85c\ub4dc\uc640 \ubd84\uc11d\uc744 \ucde8\uc18c\ud588\uc2b5\ub2c8\ub2e4.",
  cancelFailed: "\ucde8\uc18c \uc694\uccad \ucc98\ub9ac \uc911 \uc77c\ubd80 \uc815\ub9ac\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  noAnalysisChatHint: "\uba3c\uc800 \ubd84\uc11d\uc744 \uc2e4\ud589\ud558\uac70\ub098 \uae30\ub85d\uc5d0\uc11c \ubd84\uc11d\uc744 \uc120\ud0dd\ud558\uba74 AI \ub300\ud654\ub97c \ub0a8\uae38 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  suggestedQuestions: "\ucd94\ucc9c \uc9c8\ubb38",
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

const SAMPLE_CODE = `const express = require("express");
const app = express();

app.get("/users", async (req, res) => {
  const id = req.query.id;
  const rows = await db.query("SELECT * FROM users WHERE id = " + id);
  res.json(rows);
});

app.listen(3000);`;

const suggestedQuestions = [
  "\uac00\uc7a5 \uc704\ud5d8\ud55c \ubb38\uc81c\ubd80\ud130 \uc6b0\uc120\uc21c\uc704\ub97c \uc815\ub9ac\ud574\uc918",
  "\ud3ec\ud2b8\ud3f4\ub9ac\uc624\uc5d0 \uc801\uae30 \uc88b\uac8c \uac1c\uc120 \ud3ec\uc778\ud2b8\ub97c \uc694\uc57d\ud574\uc918",
  "\uc218\uc815 \uc608\uc2dc \ucf54\ub4dc\uc640 \uc774\uc720\ub97c \uac19\uc774 \ubcf4\uc5ec\uc918"
];

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

function statusBadgeClass(status: Analysis["status"]): string {
  if (status === "completed") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  if (status === "failed") return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300";
  if (status === "running") return "border-accent/40 bg-accent/10 text-accent";
  return "border-border bg-surface text-slate-500";
}

function severityBadgeClass(severity?: string | null): string {
  const value = severity?.toLowerCase() ?? "";
  if (value.includes("critical") || value.includes("high")) return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300";
  if (value.includes("medium")) return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (value.includes("low")) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  return "border-border bg-surface text-slate-500";
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
  const [inputMode, setInputMode] = useState<"paste" | "file">("paste");
  const [pasteKind, setPasteKind] = useState<"code" | "log">("code");
  const [pasteContent, setPasteContent] = useState("");
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

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

  function loadSampleContent() {
    setPasteKind("code");
    setPasteContent(SAMPLE_CODE);
    setError("");
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

  async function retryCurrentAnalysis() {
    if (!upload || busy) return;
    const { operationId, controller } = beginUploadOperation();
    activeUploadRef.current = upload;
    setBusy(true);
    setError("");
    await executeAnalysis(upload, upload.kind, operationId, controller.signal);
    if (isActiveOperation(operationId)) {
      setBusy(false);
      setActionStatus("idle");
      abortControllerRef.current = null;
      activeUploadRef.current = null;
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
    setAnswer("");
  }

  async function applyAnswerToReport(messageId: string, content: string) {
    if (!analysis?.id || !content.trim() || isAnswerAppliedToReport(content)) return;
    setApplyingMessageId(messageId);
    setError("");
    try {
      const updated = await apiFetch<Analysis>(`/api/analysis/${analysis.id}/report/append`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
      setAnalysis(updated);
      setHistory((items) => [updated, ...items.filter((item) => item.id !== updated.id)]);
      setToast(text.reportApplied);
      window.setTimeout(() => setToast(""), 2500);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : text.reportApplyFailed);
    } finally {
      setApplyingMessageId(null);
    }
  }

  function isAnswerAppliedToReport(content: string): boolean {
    const markdown = typeof analysis?.result.markdown === "string" ? analysis.result.markdown : "";
    const answer = content.trim();
    return Boolean(answer && markdown.includes(answer));
  }

  if (!mounted) return <main className="min-h-screen bg-surface" />;
  if (!auth.token) return <AuthPanel />;

  return (
    <Shell>
      <div className="mb-5 rounded-lg border border-border bg-panel p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={19} /> AI 코드/로그 분석 워크스페이스</h1>
            <p className="mt-1 text-sm text-slate-500">업로드부터 분석, 후속 질문, 리포트 반영까지 한 흐름으로 검토합니다.</p>
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-4 xl:min-w-[620px]">
            <StepPill active={Boolean(projectId)} done={Boolean(projectId)} label="프로젝트" />
            <StepPill active={actionStatus === "uploading"} done={Boolean(upload)} label="입력" />
            <StepPill active={actionStatus === "analyzing"} done={analysis?.status === "completed"} label="분석" />
            <StepPill active={Boolean(analysis?.id)} done={chatMessages.some((message) => message.role === "assistant")} label="후속 질문" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(720px,1fr)_320px]">
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
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {history.map((item) => {
                const isSelected = analysis?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAnalysis(item);
                      localStorage.setItem(SELECTED_ANALYSIS_STORAGE_KEY, item.id);
                    }}
                    className={`w-full rounded-md border p-3 text-left text-xs transition ${
                      isSelected ? "border-accent bg-accent/10 shadow-sm" : "border-border hover:bg-surface"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                        <FileText size={14} className="shrink-0 text-slate-500" />
                        <span className="truncate">{item.upload_file_name?.trim() || kindLabel[item.kind]}</span>
                      </span>
                      {isSelected && <CheckCircle2 size={14} className="shrink-0 text-accent" />}
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(item.status)}`}>
                        {statusLabel[item.status]}
                      </span>
                      <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        {kindLabel[item.kind]}
                      </span>
                      {item.severity && (
                        <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${severityBadgeClass(item.severity)}`}>
                          {item.severity}
                        </span>
                      )}
                    </div>
                    <div className="line-clamp-2 text-slate-500">{readableAnalysisSummary(item)}</div>
                  </button>
                );
              })}
              {history.length === 0 && (
                <p className="rounded-md border border-border bg-surface p-3 text-xs text-slate-500">
                  분석 기록이 아직 없습니다.
                </p>
              )}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} /> {text.inputPanel}</h2>
                <p className="mt-1 text-sm text-slate-500">{text.inputPanelHint}</p>
              </div>
              {(busy || upload) && (
                <Button className="h-10 gap-2 bg-red-600 px-3 hover:bg-red-700" type="button" onClick={clearUpload}>
                  <X size={16} />
                  <span>{text.cancelUpload}</span>
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-1">
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                  inputMode === "paste" ? "bg-panel shadow-sm" : "text-slate-500 hover:bg-panel/70"
                }`}
                type="button"
                onClick={() => setInputMode("paste")}
              >
                <ClipboardPaste size={16} />
                <span>{text.pasteTab}</span>
              </button>
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                  inputMode === "file" ? "bg-panel shadow-sm" : "text-slate-500 hover:bg-panel/70"
                }`}
                type="button"
                onClick={() => setInputMode("file")}
              >
                <UploadCloud size={16} />
                <span>{text.fileTab}</span>
              </button>
            </div>
            {!projectId && <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{text.noProjectHint}</p>}
            {inputMode === "paste" ? (
              <div className="mt-4 rounded-md border border-border bg-surface p-3">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold">{text.pasteContent}</h3>
                  <div className="flex gap-2">
                    <Button className="h-9 gap-1 bg-slate-700 px-3 text-xs" disabled={busy} type="button" onClick={loadSampleContent}>
                      <Sparkles size={14} />
                      <span>{text.sampleLoad}</span>
                    </Button>
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
                </div>
                <textarea
                  className="min-h-44 w-full resize-y rounded-md border border-border bg-panel p-3 text-sm outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!projectId || busy}
                  value={pasteContent}
                  onChange={(event) => setPasteContent(event.target.value)}
                  placeholder={text.pastePlaceholder}
                />
                <Button className="mt-2 w-full" disabled={!projectId || busy || !pasteContent.trim()} type="button" onClick={uploadPastedContent}>
                  {text.pasteSubmit}
                </Button>
              </div>
            ) : (
              <label
                aria-disabled={!canUpload}
                className={`mt-4 flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center transition ${
                  canUpload ? "cursor-pointer border-accent/50 bg-accent/5 hover:bg-accent/10" : "cursor-not-allowed border-border bg-surface opacity-60"
                }`}
              >
                <input ref={fileInputRef} type="file" className="hidden" disabled={!canUpload} onChange={onUpload} />
                <UploadCloud size={36} className="mb-3 text-accent" />
                <span className="text-sm font-semibold">{text.fileDropTitle}</span>
                <span className="mt-1 max-w-md text-sm text-slate-500">{text.fileDropDescription}</span>
                {canUpload && <span className="mt-3 text-xs text-slate-500">{text.dropHint}</span>}
              </label>
            )}
            {projectId && <p className="mt-3 text-sm text-slate-500">{text.autoAnalysisHint}</p>}
            {upload && (
              <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-surface p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">{upload.file_name} / {kindLabel[upload.kind]} / {upload.size_bytes} bytes</p>
                <Button className="h-8 gap-1 bg-slate-700 px-3 text-xs" disabled={busy} type="button" onClick={retryCurrentAnalysis}>
                  <RotateCcw size={14} />
                  <span>{text.retryAnalysis}</span>
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

        </section>

        <aside className="flex flex-col self-start rounded-lg border border-border bg-panel p-4 xl:sticky xl:top-20 xl:ml-auto xl:h-[calc(100vh-6rem)] xl:w-[300px]">
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
            {analysis?.id && (
              <div className="mt-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <MessageSquareQuote size={14} />
                  <span>{text.suggestedQuestions}</span>
                </div>
                <div className="space-y-1.5">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left text-xs text-slate-600 transition hover:border-accent hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      type="button"
                      onClick={() => setChat(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Bot size={16} /> {text.chatHistory}</h2>
              <Button className="h-8 gap-1 bg-slate-700 px-2 text-xs" type="button" onClick={scrollChatHistoryToBottom}>
                <ArrowDownToLine size={14} />
                <span>{text.chatScrollBottom}</span>
              </Button>
            </div>
            <div ref={chatHistoryRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {!analysis?.id && <p className="rounded-md border border-border bg-surface p-3 text-sm text-slate-500">{text.noAnalysisChatHint}</p>}
              {analysis?.id && chatMessages.length === 0 && (
                <div className="rounded-md border border-border bg-surface p-3 text-sm text-slate-500">
                  <p>{text.chatHistoryEmpty}</p>
                  <div className="mt-3 space-y-1.5">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-left text-xs text-slate-600 transition hover:border-accent hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                        type="button"
                        onClick={() => setChat(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((message) => {
                const isApplied = message.role === "assistant" && isAnswerAppliedToReport(message.content);
                const isApplying = applyingMessageId === message.id;
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`rounded-md border p-3 text-sm ${
                      isUser ? "ml-8 border-accent/30 bg-accent/10" : "mr-2 border-border bg-surface"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-accent text-white" : "bg-panel text-accent"}`}>
                        {isUser ? <User size={13} /> : <Bot size={13} />}
                      </span>
                      <span>{isUser ? text.senderUser : text.senderAssistant}</span>
                    </div>
                    <MarkdownMessage value={message.content} />
                    {message.role === "assistant" && (
                      <div className="mt-3 border-t border-border pt-3">
                        <Button
                          className="h-8 w-full shrink-0 gap-1 bg-slate-700 px-2 text-xs disabled:bg-emerald-700"
                          disabled={isApplying || isApplied}
                          onClick={() => applyAnswerToReport(message.id, message.content)}
                          title={isApplied ? text.alreadyAppliedToReport : text.applyToReport}
                          type="button"
                        >
                          {isApplying ? <Loader2 className="animate-spin" size={13} /> : isApplied ? <CheckCircle2 size={13} /> : <FilePlus2 size={13} />}
                          <span>{isApplying ? text.applyingToReport : isApplied ? text.alreadyAppliedToReport : text.applyToReport}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {answer && (
                <div className="mr-2 rounded-md border border-border bg-surface p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel text-accent"><Bot size={13} /></span>
                    <span>{text.senderAssistant}</span>
                    <Loader2 className="ml-auto animate-spin" size={13} />
                  </div>
                  <MarkdownMessage value={answer} />
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

function StepPill({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-10 items-center gap-2 rounded-md border px-3 ${done ? "border-emerald-500/40 bg-emerald-500/10" : active ? "border-accent bg-accent/10" : "border-border bg-surface"}`}>
      {done ? <CheckCircle2 size={15} className="text-emerald-500" /> : active ? <Loader2 size={15} className="animate-spin text-accent" /> : <span className="h-2 w-2 rounded-full bg-slate-400" />}
      <span className="font-semibold">{label}</span>
    </div>
  );
}
