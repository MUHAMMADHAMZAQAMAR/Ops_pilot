import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { ApprovalJwtService } from "../security/jwt.js";
import { AuditLogger } from "../security/audit.js";
import { buildAgentGraph } from "../agent/graph.js";
import { adminSupabase } from "../supabase/client.js";

export const approvalsRouter = Router();

const ResolveApprovalSchema = z.object({
  token: z.string().min(10),
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNotes: z.string().max(500).optional(),
});

// GET /api/v1/approvals - List pending & historical approvals for organization
approvalsRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { data: approvals, error } = await adminSupabase
      .from("approvals")
      .select("*, tasks(*)")
      .eq("org_id", user.orgId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ approvals: approvals || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/approvals/resolve - Cryptographic JWT verification & state resumption
approvalsRouter.post("/resolve", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = ResolveApprovalSchema.parse(req.body);
    const { token, decision, decisionNotes } = parsed;

    // 1. Verify single-use JWT signature & temporal validity
    const verifyResult = await ApprovalJwtService.verifyApprovalToken(token, user.orgId);
    if (!verifyResult.valid || !verifyResult.payload) {
      res.status(400).json({ error: `Cryptographic verification failed: ${verifyResult.error}` });
      return;
    }

    const { taskId, runId, orgId, actionName } = verifyResult.payload;

    // 2. Enforce RBAC (Approver must be owner or admin)
    if (user.role !== "admin" && user.role !== "owner") {
      res.status(403).json({ error: "Forbidden: Approver does not possess required admin/owner role" });
      return;
    }

    // 3. Update Approvals Record in PostgreSQL
    const { error: updateApprovalError } = await adminSupabase
      .from("approvals")
      .update({
        approver_id: user.id,
        status: decision,
        decision_notes: decisionNotes || `Resolved as ${decision} by ${user.email}`,
        resolved_at: new Date().toISOString(),
      })
      .eq("run_id", runId)
      .eq("task_id", taskId);

    if (updateApprovalError) {
      throw new Error(`Failed to update approval status: ${updateApprovalError.message}`);
    }

    // 4. Append Immutable Audit Log
    await AuditLogger.log(adminSupabase, {
      orgId,
      userId: user.id,
      action: `ACTION_APPROVAL_${decision}`,
      resourceType: "approval",
      resourceId: taskId,
      metadata: {
        runId,
        actionName,
        decision,
        decisionNotes,
      },
    });

    // 5. If APPROVED, resume LangGraph State Machine from checkpoint
    if (decision === "APPROVED") {
      const graph = buildAgentGraph();

      const threadConfig = {
        configurable: {
          thread_id: runId,
        },
      };

      const resumedState = await graph.invoke(
        {
          approvalStatus: "APPROVED",
        },
        threadConfig
      );

      res.json({
        success: true,
        message: "Approval resolved and workflow resumed successfully",
        runId,
        taskId,
        actionName,
        currentStep: resumedState.currentStep?.title || "Completed",
        isCompleted: resumedState.isCompleted,
        verification: resumedState.verificationOutcome,
      });
      return;
    }

    // If REJECTED, cancel the agent run
    await adminSupabase
      .from("agent_runs")
      .update({ status: "CANCELLED" })
      .eq("id", runId);

    res.json({
      success: true,
      message: "Action rejected. Agent run cancelled.",
      runId,
      taskId,
      decision: "REJECTED",
    });
  } catch (err) {
    next(err);
  }
});

