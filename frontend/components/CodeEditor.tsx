"use client";

import { AlertTriangle, Check, CheckCircle2, ClipboardList, Copy, Download, FileText, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type MarkdownPart =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

type ReportStats = {
  headings: number;
  issues: number;
  codeBlocks: number;
  severity: "critical" | "high" | "medium" | "low" | "none";
};

const copyLabel = "\ubcf5\uc0ac";
const copiedLabel = "\ubcf5\uc0ac\ub428";
const reportTitle = "\ubd84\uc11d \ub9ac\ud3ec\ud2b8";
const downloadLabel = "Markdown \ub2e4\uc6b4\ub85c\ub4dc";

function stripMarkdownInline(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseMarkdown(markdown: string): MarkdownPart[] {
  const lines = markdown.split(/\r?\n/);
  const parts: MarkdownPart[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCode = false;

  function flushParagraph() {
    const text = stripMarkdownInline(paragraph.join(" "));
    if (text) parts.push({ type: "paragraph", text });
    paragraph = [];
  }

  function flushList() {
    if (listItems.length > 0) parts.push({ type: "list", items: listItems });
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const fence = line.match(/^```([a-zA-Z0-9_+.-]*)/);
    if (fence) {
      if (inCode) {
        parts.push({ type: "code", language: codeLanguage || "text", code: codeLines.join("\n").trimEnd() });
        codeLines = [];
        codeLanguage = "";
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        codeLanguage = fence[1] || "text";
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      parts.push({ type: "heading", level: heading[1].length, text: stripMarkdownInline(heading[2]) });
      continue;
    }

    const list = line.match(/^\s*[-*]\s+(.+)$/);
    if (list) {
      flushParagraph();
      listItems.push(stripMarkdownInline(list[1]));
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (inCode) parts.push({ type: "code", language: codeLanguage || "text", code: codeLines.join("\n").trimEnd() });
  flushParagraph();
  flushList();
  return parts;
}

function headingKind(text: string): "security" | "issue" | "fix" | "default" {
  const normalized = text.toLowerCase();
  if (/보안|취약|위협|critical|security|vulnerab/.test(normalized)) return "security";
  if (/문제|오류|원인|이슈|issue|error|root cause/.test(normalized)) return "issue";
  if (/권장|수정|개선|조치|fix|recommend|action|refactor/.test(normalized)) return "fix";
  return "default";
}

function iconForHeading(text: string) {
  const kind = headingKind(text);
  if (kind === "security") return <ShieldAlert size={18} className="text-red-500" />;
  if (kind === "issue") return <AlertTriangle size={18} className="text-amber-500" />;
  if (kind === "fix") return <CheckCircle2 size={18} className="text-emerald-500" />;
  return <ClipboardList size={18} className="text-slate-500" />;
}

function sectionTone(text: string): string {
  const kind = headingKind(text);
  if (kind === "security") return "border-red-500/30 bg-red-500/5";
  if (kind === "issue") return "border-amber-500/30 bg-amber-500/5";
  if (kind === "fix") return "border-emerald-500/30 bg-emerald-500/5";
  return "border-border bg-panel";
}

function analyzeReport(markdown: string, parts: MarkdownPart[]): ReportStats {
  const normalized = markdown.toLowerCase();
  const issues = (normalized.match(/취약|오류|위험|문제|exception|error|critical|high/g) ?? []).length;
  let severity: ReportStats["severity"] = "none";
  if (/critical|치명/.test(normalized)) severity = "critical";
  else if (/high|높음|심각/.test(normalized)) severity = "high";
  else if (/medium|중간/.test(normalized)) severity = "medium";
  else if (/low|낮음/.test(normalized)) severity = "low";
  return {
    headings: parts.filter((part) => part.type === "heading").length,
    issues,
    codeBlocks: parts.filter((part) => part.type === "code").length,
    severity
  };
}

function severityLabel(severity: ReportStats["severity"]): string {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";
  return "\ubbf8\ubd84\ub958";
}

function severityClass(severity: ReportStats["severity"]): string {
  if (severity === "critical") return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300";
  if (severity === "high") return "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300";
  if (severity === "medium") return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  if (severity === "low") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  return "border-border bg-surface text-slate-500";
}

export function MarkdownMessage({ value }: { value: string }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const parts = useMemo(() => parseMarkdown(value), [value]);

  async function copyCode(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    window.setTimeout(() => setCopiedCodeIndex(null), 1600);
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === "heading") {
          return <h3 key={`${part.type}-${index}`} className="text-sm font-semibold">{part.text}</h3>;
        }

        if (part.type === "list") {
          return (
            <ul key={`${part.type}-${index}`} className="space-y-1 text-sm leading-6">
              {part.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (part.type === "code") {
          return (
            <div key={`${part.type}-${index}`} className="overflow-hidden rounded-md border border-border bg-panel">
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs font-semibold text-slate-500">
                <span>{part.language}</span>
                <Button className="h-7 shrink-0 gap-1 bg-slate-700 px-2 text-xs" type="button" onClick={() => copyCode(part.code, index)}>
                  {copiedCodeIndex === index ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCodeIndex === index ? copiedLabel : copyLabel}</span>
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto p-3 text-xs leading-5">
                <code>{part.code}</code>
              </pre>
            </div>
          );
        }

        return <p key={`${part.type}-${index}`} className="whitespace-pre-wrap text-sm leading-6">{part.text}</p>;
      })}
    </div>
  );
}

export function CodeEditor({ value }: { value: string }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const parts = useMemo(() => parseMarkdown(value), [value]);
  const stats = useMemo(() => analyzeReport(value, parts), [value, parts]);
  const hasReport = parts.some((part) => part.type === "heading");
  const headings = parts.filter((part): part is Extract<MarkdownPart, { type: "heading" }> => part.type === "heading");
  let currentHeading = reportTitle;

  async function copyCode(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    window.setTimeout(() => setCopiedCodeIndex(null), 1600);
  }

  function downloadMarkdown() {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `analysis-report-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
      <div className="border-b border-border bg-panel px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <FileText size={18} />
              {reportTitle}
            </div>
            <p className="mt-1 text-sm text-slate-500">AI가 생성한 분석 결과와 반영된 후속 답변을 한 화면에서 검토합니다.</p>
          </div>
          <Button className="h-9 gap-2 bg-slate-800 px-3 text-xs" type="button" onClick={downloadMarkdown} disabled={!hasReport}>
            <Download size={15} />
            <span>{downloadLabel}</span>
          </Button>
        </div>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
          <ReportMetric label="Severity" value={severityLabel(stats.severity)} className={severityClass(stats.severity)} />
          <ReportMetric label="Sections" value={stats.headings} />
          <ReportMetric label="Signals" value={stats.issues} />
          <ReportMetric label="Code Blocks" value={stats.codeBlocks} />
        </div>
        {headings.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {headings.slice(0, 8).map((heading, index) => (
              <span key={`${heading.text}-${index}`} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-slate-500">
                {heading.text}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-[720px] space-y-4 overflow-y-auto p-4">
        {!hasReport && (
          <div className="rounded-md border border-dashed border-border bg-surface p-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {value}
          </div>
        )}
        {hasReport && parts.map((part, index) => {
          if (part.type === "heading") {
            currentHeading = part.text;
            return (
              <div key={`${part.type}-${index}`} className={`rounded-md border p-3 ${sectionTone(part.text)}`}>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  {iconForHeading(part.text)}
                  {part.text}
                </h2>
              </div>
            );
          }

          if (part.type === "list") {
            return (
              <div key={`${part.type}-${index}`} className={`rounded-md border p-4 ${sectionTone(currentHeading)}`}>
                <ul className="space-y-2 text-sm leading-6">
                  {part.items.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (part.type === "code") {
            return (
              <div key={`${part.type}-${index}`} className="overflow-hidden rounded-md border border-border bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs font-semibold text-slate-500">
                  <span>{part.language}</span>
                  <Button className="h-8 shrink-0 gap-2 bg-slate-700 px-3" type="button" onClick={() => copyCode(part.code, index)}>
                    {copiedCodeIndex === index ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedCodeIndex === index ? copiedLabel : copyLabel}</span>
                  </Button>
                </div>
                <pre className="max-h-96 overflow-auto p-3 text-xs leading-5">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={`${part.type}-${index}`} className="rounded-md border border-border bg-surface p-4 text-sm leading-6">
              {part.text}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReportMetric({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-surface px-3 py-2 ${className ?? ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}
