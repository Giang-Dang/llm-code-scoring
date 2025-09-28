import type { ScoringRequest, ScoringResponse } from "@/types/api";

export type ApiClientOptions = {
  baseUrl?: string;
};

export class ApiClient {
  private baseUrl: string;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  }

  async score(request: ScoringRequest, signal?: AbortSignal): Promise<ScoringResponse> {
    const res = await fetch(`${this.baseUrl}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    if (!res.ok) {
      const detail = (await safeReadJson(res).catch(() => ({}))) as { detail?: unknown };
      const message = typeof detail.detail === "string" ? detail.detail : `HTTP ${res.status}`;
      throw new Error(String(message));
    }
    return (await res.json()) as ScoringResponse;
  }
}

async function safeReadJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text };
  }
}


