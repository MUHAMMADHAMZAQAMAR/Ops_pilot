// app/api/v1/approvals/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/security/audit";
import { z } from "zod";

const ResolveApprovalSchema = z.object({
  approval_id: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewer_notes: z.string().max(2000).optional(),
});

interface ApprovalRow {
  id: string;
  status: string;
  agent_run_id: string;
  organization_id: string;
  required_role: string;
}

interface ProfileRow {
  role: string;
  organization_id: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // 1. Authenticate & verify reviewer identity
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse & validate input
    const body: unknown = await req.json();
    const parseResult = ResolveApprovalSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { approval_id, decision, reviewer_notes } = parseResult.data;

    // 3. Fetch and validate the approval record
    const approvalResult = await (supabase
      .from("approvals")
      .select("id, status, agent_run_id, organization_id, required_role")
      .eq("id", approval_id)
      .single() as unknown as Promise<{ data: ApprovalRow | null; error: { message: string } | null }>);

    if (approvalResult.error || !approvalResult.data) {
      return NextResponse.json({ error: "Approval record not found" }, { status: 404 });
    }

    const approval = approvalResult.data;

    if (approval.status !== "PENDING") {
      return NextResponse.json(
        { error: "Approval has already been resolved" },
        { status: 409 }
      );
    }

    // 4. Verify reviewer has the required role
    const profileResult = await (supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single() as unknown as Promise<{ data: ProfileRow | null; error: { message: string } | null }>);

    const profile = profileResult.data;

    if (!profile || profile.organization_id !== approval.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roleHierarchy: Record<string, number> = {
      VIEWER: 0,
      ANALYST: 1,
      MANAGER: 2,
      ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    const requiredLevel = roleHierarchy[approval.required_role] ?? 2;
    const reviewerLevel = roleHierarchy[profile.role] ?? 0;

    if (reviewerLevel < requiredLevel) {
      return NextResponse.json(
        { error: "Insufficient role to resolve this approval" },
        { status: 403 }
      );
    }

    // 5. Update the approval record
    const updateResult = await (supabase
      .from("approvals")
      .update({
        status: decision,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        reviewer_notes: reviewer_notes ?? null,
      } as never)
      .eq("id", approval_id) as unknown as Promise<{ error: { message: string } | null }>);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    // 6. Write audit log
    await writeAuditLog({
      event_type: "APPROVAL_RESOLVED",
      actor_user_id: user.id,
      organization_id: approval.organization_id,
      resource_id: approval_id,
      resource_type: "approval",
      metadata: { decision, agent_run_id: approval.agent_run_id },
      ip_address: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ approvalId: approval_id, decision }, { status: 200 });
  } catch (err) {
    console.error("[/api/v1/approvals/resolve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
