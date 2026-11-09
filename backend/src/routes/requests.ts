import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { PromptFirewall } from "../security/firewall.js";
import { AuditLogger } from "../security/audit.js";
import { buildAgentGraph } from "../agent/graph.js";
import { adminSupabase } from "../supabase/client.js";

export const requestsRouter = Router();

const SubmitRequestSchema = z.object({
  prompt: z.string().min(3).max(5000),
  category: z.string().default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

// GET /api/v1/requests - List requests for caller's organization
requestsRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { data: requests, error } = await adminSupabase
      .from("business_requests")
      .select("*")
      .eq("org_id", user.orgId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ requests: requests || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/requests/submit - Ingestion endpoint & Prompt Injection Firewall
requestsRouter.post("/submit", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = SubmitRequestSchema.parse(req.body);

    // 1. Ingestion Firewall & Injection Scanning
    const firewallResult = PromptFirewall.scan(parsed.prompt, true);

    // 2. Insert business request into database
    const { data: requestRecord, error: reqInsertError } = await adminSupabase
      .from("business_requests")
      .insert({
        org_id: user.orgId,
        user_id: user.id,
        raw_prompt: parsed.prompt,
        sanitized_prompt: firewallResult.sanitizedContent,
        category: parsed.category,
        priority: parsed.priority,
        status: firewallResult.isSafe ? "ANALYZING" : "FLAGGED",
      })
      .select("id")
      .single();

    if (reqInsertError || !requestRecord) {
      throw new Error(`Database insert failed: ${reqInsertError?.message}`);
    }

    // 3. Create Agent Run record
    const { data: runRecord, error: runInsertError } = await adminSupabase
      .from("agent_runs")
      .insert({
        request_id: requestRecord.id,
        org_id: user.orgId,
        status: "RUNNING",
      })
      .select("id")
      .single();

    if (runInsertError || !runRecord) {
      throw new Error(`Failed to initialize agent run: ${runInsertError?.message}`);
    }

    // 4. Append immutable audit log
    await AuditLogger.log(adminSupabase, {
      orgId: user.orgId,
      userId: user.id,
      action: "BUSINESS_REQUEST_SUBMITTED",
      resourceType: "business_request",
      resourceId: requestRecord.id,
      metadata: {
        threatsDetected: firewallResult.detectedThreats,
        entropy: firewallResult.entropyScore,
        runId: runRecord.id,
      },
    });

    // 5. Trigger LangGraph execution
    const graph = buildAgentGraph();

    const initialState = {
      runId: runRecord.id,
      orgId: user.orgId,
      userId: user.id,
      rawInput: parsed.prompt,
      sanitizedInput: firewallResult.sanitizedContent,
      firewallPassed: firewallResult.isSafe,
      securityThreats: firewallResult.detectedThreats,
      executionPlan: null,
      currentStepIndex: 0,
      currentStep: null,
      overallRiskLevel: "LOW" as const,
      approvalStatus: "NONE" as const,
      approvalToken: null,
      toolResults: {},
      verificationOutcome: null,
      isCompleted: false,
      error: null,
      auditTrail: [],
    };

    const threadConfig = {
      configurable: {
        thread_id: runRecord.id,
      },
    };

    const finalState = await graph.invoke(initialState, threadConfig);

    res.status(201).json({
      success: true,
      requestId: requestRecord.id,
      runId: runRecord.id,
      firewallResult,
      runStatus: finalState.approvalStatus === "PENDING" ? "WAITING_APPROVAL" : "RUNNING",
      approvalToken: finalState.approvalToken,
      executionSummary: finalState.executionPlan?.summary,
    });
  } catch (err) {
    next(err);
  }
});

