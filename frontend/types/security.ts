import { z } from "zod";

export type Role = "owner" | "admin" | "member";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SecurityContext {
  userId: string;
  orgId: string;
  role: Role;
  clientIp?: string;
  userAgent?: string;
}

export const ApprovalPayloadSchema = z.object({
  taskId: z.string().uuid(),
  runId: z.string().uuid(),
  orgId: z.string().uuid(),
  actionName: z.string(),
  parametersHash: z.string(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  issuedAt: z.number(),
  expiresAt: z.number(),
});

export type ApprovalPayload = z.infer<typeof ApprovalPayloadSchema>;

export interface FirewallScanResult {
  isSafe: boolean;
  sanitizedContent: string;
  detectedThreats: string[];
  entropyScore: number;
  timestamp: string;
}

export interface AuditLogEntry {
  id?: string;
  orgId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataJson: Record<string, unknown>;
  previousHash: string | null;
  currentHash: string;
  createdAt?: string;
}

