/**
 * lib/agent/graph.ts
 *
 * Frontend-side agent graph trigger client.
 * Calls the backend LangGraph execution service via the internal API.
 * The actual LangGraph state machine runs in the backend service.
 */

import { frontendEnv } from "@/lib/config";

export interface AgentRunInput {
  requestId: string;
  organizationId: string;
  userId: string;
  sanitizedPrompt: string;
}

export interface AgentRunResult {
  runId: string;
  status: "STARTED" | "FAILED";
  message?: string;
}

/**
 * Triggers a new LangGraph agent run on the backend service.
 */
export async function triggerAgentRun(input: AgentRunInput): Promise<AgentRunResult> {
  const backendUrl = frontendEnv.NEXT_PUBLIC_BACKEND_API_URL;

  const response = await fetch(`${backendUrl}/api/agent/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Backend agent trigger failed (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<AgentRunResult>;
}

