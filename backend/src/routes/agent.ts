import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { buildAgentGraph } from "../agent/graph.js";
import { adminSupabase } from "../supabase/client.js";

export const agentRouter = Router();

const RunTriggerSchema = z.object({
  runId: z.string().uuid(),
});

// GET /api/v1/agent/runs - List agent runs for organization
agentRouter.get("/runs", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { data: runs, error } = await adminSupabase
      .from("agent_runs")
      .select("*, business_requests(*)")
      .eq("org_id", user.orgId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ runs: runs || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/agent/runs/:id - Get detailed agent run state
agentRouter.get("/runs/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const runId = req.params.id;

    const { data: run, error } = await adminSupabase
      .from("agent_runs")
      .select("*, business_requests(*), tasks(*), approvals(*)")
      .eq("id", runId)
      .eq("org_id", user.orgId)
      .single();

    if (error || !run) {
      res.status(404).json({ error: "Agent run not found" });
      return;
    }

    res.json({ run });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/agent/run - Resumes or triggers execution of an agent run from checkpoint
agentRouter.post("/run", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = RunTriggerSchema.parse(req.body);
    const { runId } = parsed;

    const { data: run, error: runError } = await adminSupabase
      .from("agent_runs")
      .select("*, business_requests(*)")
      .eq("id", runId)
      .eq("org_id", user.orgId)
      .single();

    if (runError || !run) {
      res.status(404).json({ error: "Agent run not found" });
      return;
    }

    const graph = buildAgentGraph();
    const threadConfig = {
      configurable: {
        thread_id: runId,
      },
    };

    const updatedState = await graph.invoke(null, threadConfig);

    res.json({
      success: true,
      runId,
      status: updatedState.isCompleted ? "COMPLETED" : "RUNNING",
      currentStep: updatedState.currentStep?.title ?? null,
      verification: updatedState.verificationOutcome,
    });
  } catch (err) {
    next(err);
  }
});

