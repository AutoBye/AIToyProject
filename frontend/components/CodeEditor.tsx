"use client";

import { AlertTriangle, Check, CheckCircle2, ClipboardList, Copy, FileText, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type MarkdownPart =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

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

function iconForHeading(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes("보안") || normalized.includes("취약") || normalized.includes("위협") || normalized.includes("critical")) {
    return <ShieldAlert size={18} className="text-red-500" />;
  }
  if (normalized.includes("문제") || normalized.includes("오류") || normalized.includes("원인") || normalized.includes("issue")) {
    return <AlertTriangle size={18} className="text-amber-500" />;
  }
  if (normalized.includes("권장") || normalized.includes("수정") || normalized.includes("개선") || normalized.includes("fix")) {
    return <CheckCircle2 size={18} className="text-emerald-500" />;
  }
  return <ClipboardList size={18} className="text-slate-500" />;
}

function sectionTone(text: string): string {
  const normalized = text.toLowerCase();
  if (normalized.includes("보안") || normalized.includes("취약") || normalized.includes("위협") || normalized.includes("critical")) {
    return "border-red-500/30 bg-red-500/5";
  }
  if (normalized.includes("문제") || normalized.includes("오류") || normalized.includes("원인") || normalized.includes("issue")) {
    return "border-amber-500/30 bg-amber-500/5";
  }
  if (normalized.includes("권장") || normalized.includes("수정") || normalized.includes("개선") || normalized.includes("fix")) {
    return "border-emerald-500/30 bg-emerald-500/5";
  }
  return "border-border bg-panel";
}

export function MarkdownMessage({ value }: { value: string }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const parts = parseMarkdown(value);

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
                  <span>{copiedCodeIndex === index ? "복사됨" : "복사"}</span>
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
  const parts = parseMarkdown(value);
  const hasReport = parts.some((part) => part.type === "heading");
  let currentHeading = "분석 결과";

  async function copyCode(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    window.setTimeout(() => setCopiedCodeIndex(null), 1600);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel">
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText size={17} />
          분석 리포트
        </div>
      </div>
      <div className="max-h-[680px] space-y-4 overflow-y-auto p-4">
        {!hasReport && (
          <div className="rounded-md border border-border bg-surface p-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
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
                    <span>{copiedCodeIndex === index ? "복사됨" : "복사"}</span>
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
