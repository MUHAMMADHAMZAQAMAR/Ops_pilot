import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import { AuditLogger } from "../security/audit.js";
import { adminSupabase } from "../supabase/client.js";

export const auditRouter = Router();

// GET /api/v1/audit/logs - List append-only audit trail for organization
auditRouter.get("/logs", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const { data: logs, error } = await adminSupabase
      .from("audit_logs")
      .select("*")
      .eq("org_id", user.orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    res.json({ logs: logs || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/audit/verify - Cryptographic SHA-256 hash-chain verification
auditRouter.post("/verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const verification = await AuditLogger.verifyChain(adminSupabase, user.orgId, 200);
    res.json({ verification });
  } catch (err) {
    next(err);
  }
});

