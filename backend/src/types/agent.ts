import { z } from "zod";
import { RiskLevel } from "./security.js";

export const TaskStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  toolName: z.string(),
  parameters: z.record(z.unknown()),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dependencies: z.array(z.string()).default([]),
  status: z.enum(["PENDING", "RUNNING", "WAITING_APPROVAL", "COMPLETED", "FAILED", "SKIPPED"]).default("PENDING"),
  output: z.unknown().optional(),
  error: z.string().optional(),
});

export type TaskStep = z.infer<typeof TaskStepSchema>;

export const ExecutionPlanSchema = z.object({
  summary: z.string(),
  overallRiskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  steps: z.array(TaskStepSchema),
  rationale: z.string(),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export const VerificationOutcomeSchema = z.object({
  isSatisfied: z.boolean(),
  integrityCheckPassed: z.boolean(),
  findings: z.array(z.string()),
  summaryText: z.string(),
  requiresCorrection: z.boolean(),
});

export type VerificationOutcome = z.infer<typeof VerificationOutcomeSchema>;

export interface AgentGraphState {
  runId: string;
  orgId: string;
  userId: string;
  rawInput: string;
  sanitizedInput: string;
  firewallPassed: boolean;
  securityThreats: string[];
  executionPlan: ExecutionPlan | null;
  currentStepIndex: number;
  currentStep: TaskStep | null;
  overallRiskLevel: RiskLevel;
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  approvalToken: string | null;
  toolResults: Record<string, unknown>;
  verificationOutcome: VerificationOutcome | null;
  isCompleted: boolean;
  error: string | null;
  auditTrail: Array<{
    timestamp: string;
    node: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
}

