// app/api/v1/agent/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/security/audit";
import { triggerAgentRun } from "@/lib/agent/graph";
import { z } from "zod";

const AgentRunSchema = z.object({
  request_id: z.string().uuid(),
});

interface BusinessRequestRow {
  id: string;
  organization_id: string;
  submitted_by: string;
  sanitized_prompt: string;
  status: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // 1. Authenticate caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse & validate input
    const body: unknown = await req.json();
    const parseResult = AgentRunSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { request_id } = parseResult.data;

    // 3. Fetch the business request
    const bizRequestResult = await (supabase
      .from("business_requests")
      .select("id, organization_id, submitted_by, sanitized_prompt, status")
      .eq("id", request_id)
      .single() as unknown as Promise<{ data: BusinessRequestRow | null; error: { message: string } | null }>);

    if (bizRequestResult.error || !bizRequestResult.data) {
      return NextResponse.json({ error: "Business request not found" }, { status: 404 });
    }

    const bizRequest = bizRequestResult.data;

    if (bizRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is not in PENDING state" },
        { status: 409 }
      );
    }

    // 4. Trigger agent run via backend service
    const agentResult = await triggerAgentRun({
      requestId: bizRequest.id,
      organizationId: bizRequest.organization_id,
      userId: user.id,
      sanitizedPrompt: bizRequest.sanitized_prompt,
    });

    // 5. Write audit log
    await writeAuditLog({
      event_type: "AGENT_RUN_STARTED",
      actor_user_id: user.id,
      organization_id: bizRequest.organization_id,
      resource_id: agentResult.runId,
      resource_type: "agent_run",
      metadata: { request_id },
      ip_address: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json(
      { runId: agentResult.runId, status: agentResult.status },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/v1/agent/run]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
