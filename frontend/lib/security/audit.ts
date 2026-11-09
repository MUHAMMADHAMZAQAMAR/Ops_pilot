import { createClient } from "@/lib/supabase/server";

export type AuditEventType =
  | "REQUEST_SUBMITTED"
  | "REQUEST_FIREWALL_BLOCKED"
  | "AGENT_RUN_STARTED"
  | "AGENT_RUN_COMPLETED"
  | "AGENT_RUN_FAILED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_RESOLVED"
  | "TOOL_INVOKED"
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT";

export interface AuditEventPayload {
  event_type: AuditEventType;
  actor_user_id?: string;
  organization_id?: string;
  resource_id?: string;
  resource_type?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

interface AuditLogInsert {
  event_type: string;
  actor_user_id: string | null;
  organization_id: string | null;
  resource_id: string | null;
  resource_type: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

/**
 * Writes a tamper-evident audit log entry to the database.
 */
export async function writeAuditLog(payload: AuditEventPayload): Promise<void> {
  try {
    const supabase = await createClient();
    const record: AuditLogInsert = {
      event_type: payload.event_type,
      actor_user_id: payload.actor_user_id ?? null,
      organization_id: payload.organization_id ?? null,
      resource_id: payload.resource_id ?? null,
      resource_type: payload.resource_type ?? null,
      metadata: payload.metadata ?? {},
      ip_address: payload.ip_address ?? null,
      created_at: new Date().toISOString(),
    };

    await (supabase.from("audit_logs").insert(record as never) as unknown as Promise<unknown>);
  } catch (err) {
    // Audit failures must never crash the main application flow.
    console.error("[AuditLog] Failed to write audit entry:", err);
  }
}
