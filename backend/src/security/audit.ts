import { createHash } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

export interface LogAuditParams {
  orgId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  public static calculateRecordHash(params: {
    previousHash: string | null;
    orgId: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    metadataJson: Record<string, unknown>;
    createdAt: string;
  }): string {
    const raw = [
      params.previousHash || "GENESIS_BLOCK_0000000000000000000000000000000000000000000000000000000000000000",
      params.orgId,
      params.userId || "SYSTEM",
      params.action,
      params.resourceType,
      params.resourceId,
      JSON.stringify(params.metadataJson, Object.keys(params.metadataJson).sort()),
      params.createdAt,
    ].join("|");

    return createHash("sha256").update(raw).digest("hex");
  }

  public static async log(
    supabase: SupabaseClient<Database>,
    params: LogAuditParams
  ): Promise<{ id: string; currentHash: string }> {
    const { data: latestLog, error: fetchError } = await supabase
      .from("audit_logs")
      .select("current_hash")
      .eq("org_id", params.orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to query latest audit log: ${fetchError.message}`);
    }

    const previousHash = latestLog?.current_hash ?? null;
    const createdAt = new Date().toISOString();
    const metadataJson = params.metadata || {};

    const currentHash = this.calculateRecordHash({
      previousHash,
      orgId: params.orgId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadataJson,
      createdAt,
    });

    const { data, error: insertError } = await supabase
      .from("audit_logs")
      .insert({
        org_id: params.orgId,
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        metadata_json: metadataJson,
        previous_hash: previousHash,
        current_hash: currentHash,
        created_at: createdAt,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Failed to append immutable audit log: ${insertError.message}`);
    }

    return { id: data.id, currentHash };
  }

  public static async verifyChain(
    supabase: SupabaseClient<Database>,
    orgId: string,
    limit = 100
  ): Promise<{ isValid: boolean; brokenAtRecordId?: string; errorDetails?: string }> {
    const { data: records, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error || !records) {
      return { isValid: false, errorDetails: error?.message || "No records found" };
    }

    let expectedPrevHash: string | null = null;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (record.previous_hash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtRecordId: record.id,
          errorDetails: `Chain break at record ${record.id}: expected prev hash ${expectedPrevHash}, found ${record.previous_hash}`,
        };
      }

      const computed = this.calculateRecordHash({
        previousHash: record.previous_hash,
        orgId: record.org_id,
        userId: record.user_id,
        action: record.action,
        resourceType: record.resource_type,
        resourceId: record.resource_id,
        metadataJson: (record.metadata_json as Record<string, unknown>) || {},
        createdAt: record.created_at,
      });

      if (computed !== record.current_hash) {
        return {
          isValid: false,
          brokenAtRecordId: record.id,
          errorDetails: `Hash mismatch at record ${record.id}: computed ${computed}, stored ${record.current_hash}`,
        };
      }

      expectedPrevHash = record.current_hash;
    }

    return { isValid: true };
  }
}

