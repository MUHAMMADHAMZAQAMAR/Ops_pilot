import { frontendEnv } from "./config";
import { createClient } from "./supabase/client";

/**
 * Type-safe HTTP Client for invoking the Zero-Trust Backend API Gateway.
 * Automatically injects Supabase session Bearer tokens into request headers.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const baseUrl = frontendEnv.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "");
  const targetUrl = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Backend request failed with status ${response.status}`);
  }

  return data as T;
}

export const BackendAPI = {
  // Requests
  getRequests: () => apiFetch<{ requests: any[] }>("/api/v1/requests"),
  submitRequest: (payload: { prompt: string; category?: string; priority?: string }) =>
    apiFetch<{
      success: boolean;
      requestId: string;
      runId: string;
      firewallResult: any;
      runStatus: string;
      approvalToken: string | null;
      executionSummary?: string;
    }>("/api/v1/requests/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Agent Runs
  getRuns: () => apiFetch<{ runs: any[] }>("/api/v1/agent/runs"),
  getRunById: (runId: string) => apiFetch<{ run: any }>(`/api/v1/agent/runs/${runId}`),
  triggerRun: (runId: string) =>
    apiFetch<{ success: boolean; runId: string; status: string; currentStep?: string }>(
      "/api/v1/agent/run",
      {
        method: "POST",
        body: JSON.stringify({ runId }),
      }
    ),

  // Approvals
  getApprovals: () => apiFetch<{ approvals: any[] }>("/api/v1/approvals"),
  resolveApproval: (payload: { token: string; decision: "APPROVED" | "REJECTED"; decisionNotes?: string }) =>
    apiFetch<{
      success: boolean;
      message: string;
      runId: string;
      taskId: string;
      currentStep?: string;
      isCompleted?: boolean;
    }>("/api/v1/approvals/resolve", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Audit
  getAuditLogs: (limit = 50) => apiFetch<{ logs: any[] }>(`/api/v1/audit/logs?limit=${limit}`),
  verifyAuditChain: () =>
    apiFetch<{ verification: { isValid: boolean; brokenAtRecordId?: string; errorDetails?: string } }>(
      "/api/v1/audit/verify",
      { method: "POST" }
    ),

  // Tools
  getTools: () => apiFetch<{ tools: any[] }>("/api/v1/tools"),
};

