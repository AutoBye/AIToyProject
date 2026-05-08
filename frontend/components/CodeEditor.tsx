"use client";

import Editor from "@monaco-editor/react";

export function CodeEditor({ value }: { value: string }) {
  return (
    <div className="h-[560px] overflow-hidden rounded-lg border border-border">
      <Editor
        height="560px"
        defaultLanguage="markdown"
        value={value}
        theme="vs-dark"
        options={{ readOnly: true, minimap: { enabled: false }, wordWrap: "on", fontSize: 13 }}
      />
    </div>
  );
}
