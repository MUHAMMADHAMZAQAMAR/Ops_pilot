import { Annotation } from "@langchain/langgraph";
import { RiskLevel } from "../types/security.js";
import { ExecutionPlan, TaskStep, VerificationOutcome } from "../types/agent.js";

export interface AuditTrailEntry {
  timestamp: string;
  node: string;
  message: string;
  data?: Record<string, unknown>;
}

export const AgentStateAnnotation = Annotation.Root({
  runId: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),
  orgId: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),
  rawInput: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),
  sanitizedInput: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),
  firewallPassed: Annotation<boolean>({
    reducer: (prev, next) => next ?? prev,
    default: () => true,
  }),
  securityThreats: Annotation<string[]>({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => [],
  }),
  executionPlan: Annotation<ExecutionPlan | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  currentStepIndex: Annotation<number>({
    reducer: (prev, next) => next ?? prev,
    default: () => 0,
  }),
  currentStep: Annotation<TaskStep | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  overallRiskLevel: Annotation<RiskLevel>({
    reducer: (prev, next) => next ?? prev,
    default: () => "LOW",
  }),
  approvalStatus: Annotation<"NONE" | "PENDING" | "APPROVED" | "REJECTED">({
    reducer: (prev, next) => next ?? prev,
    default: () => "NONE",
  }),
  approvalToken: Annotation<string | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  toolResults: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...(next || {}) }),
    default: () => ({}),
  }),
  verificationOutcome: Annotation<VerificationOutcome | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  isCompleted: Annotation<boolean>({
    reducer: (prev, next) => next ?? prev,
    default: () => false,
  }),
  error: Annotation<string | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  auditTrail: Annotation<AuditTrailEntry[]>({
    reducer: (prev, next) => (next ? [...prev, ...next] : prev),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;

