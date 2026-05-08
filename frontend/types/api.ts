export type User = {
  id: string;
  email: string;
  full_name?: string | null;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
};

export type Upload = {
  id: string;
  project_id: string;
  file_name: string;
  kind: "code" | "log";
  size_bytes: number;
  sha256: string;
};

export type Analysis = {
  id: string;
  project_id: string;
  upload_id: string;
  upload_file_name?: string | null;
  kind: "code" | "log";
  status: "queued" | "running" | "completed" | "failed";
  severity?: string | null;
  summary?: string | null;
  result: { markdown?: string; [key: string]: unknown };
  error_message?: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  analysis_id?: string | null;
  project_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type Dashboard = {
  projects: number;
  analyses: number;
  uploads: number;
  tokens: number;
  recent_analyses: Array<Record<string, string | number | null>>;
};
