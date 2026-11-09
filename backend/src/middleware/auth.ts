import { Request, Response, NextFunction } from "express";
import { createScopedClient, adminSupabase } from "../supabase/client.js";
import { Role } from "../types/security.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  orgId: string;
  role: Role;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Enterprise Authentication & Tenancy Resolution Middleware.
 * Extracts Bearer token, verifies user with Supabase Auth, and resolves organization membership.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header (Bearer token required)" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const scopedSupabase = createScopedClient(token);
    const { data: { user }, error } = await scopedSupabase.auth.getUser();

    if (error || !user) {
      res.status(401).json({ error: "Invalid or expired session token" });
      return;
    }

    // Resolve user's active organization & role
    const { data: membership, error: memError } = await adminSupabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memError || !membership) {
      res.status(403).json({ error: "User is not assigned to an active organization tenant" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      orgId: membership.org_id,
      role: membership.role as Role,
      token,
    };

    next();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication error";
    res.status(500).json({ error: msg });
  }
}

