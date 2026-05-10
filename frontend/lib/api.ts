const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Email already registered": "이미 가입된 이메일입니다.",
  "Invalid token": "로그인이 만료되었거나 유효하지 않습니다.",
  "User not found": "사용자 정보를 찾을 수 없습니다.",
  "Request failed": "요청 처리에 실패했습니다.",
  "Streaming is unavailable": "AI 응답 스트리밍을 사용할 수 없습니다."
};

function localizeErrorMessage(message: unknown): string {
  if (typeof message !== "string" || !message.trim()) return ERROR_MESSAGES["Request failed"];
  return ERROR_MESSAGES[message] ?? message;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, localizeErrorMessage(error.detail ?? "Request failed"));
  }
  return response.json() as Promise<T>;
}

export async function streamChat(
  payload: { project_id: string; analysis_id?: string; message: string },
  onDelta: (chunk: string) => void
) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/api/analysis/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.body) throw new ApiError(response.status, ERROR_MESSAGES["Streaming is unavailable"]);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      onDelta(JSON.parse(data).delta);
    }
  }
}
