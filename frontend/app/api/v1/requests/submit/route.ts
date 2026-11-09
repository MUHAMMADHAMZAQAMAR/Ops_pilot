// app/api/v1/requests/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PromptFirewall } from "@/lib/security/firewall";
import { writeAuditLog } from "@/lib/security/audit";
import { triggerAgentRun } from "@/lib/agent/graph";
import { z } from "zod";

const SubmitRequestSchema = z.object({
  raw_prompt: z.string().min(1).max(10_000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  metadata: z.record(z.unknown()).optional(),
});

interface ProfileRow {
  organization_id: string | null;
}

interface InsertedRequest {
  id: string;
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
    const parseResult = SubmitRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { raw_prompt, priority, metadata } = parseResult.data;

    // 3. Zero-Trust Firewall scan
    const firewallResult = PromptFirewall.scan(raw_prompt);
    if (!firewallResult.isSafe) {
      await writeAuditLog({
        event_type: "REQUEST_FIREWALL_BLOCKED",
        actor_user_id: user.id,
        metadata: {
          threats: firewallResult.detectedThreats,
          entropy: firewallResult.entropyScore,
        },
        ip_address: req.headers.get("x-forwarded-for") ?? undefined,
      });

      return NextResponse.json(
        {
          error: "Request blocked by security firewall.",
          threats: firewallResult.detectedThreats,
        },
        { status: 422 }
      );
    }

    // 4. Fetch user's organization
    const profileResult = await (supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as unknown as Promise<{ data: ProfileRow | null; error: { message: string } | null }>);

    const profile = profileResult.data;

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User organization not found" }, { status: 403 });
    }

    // 5. Insert sanitized business request
    const insertResult = await (supabase
      .from("business_requests")
      .insert({
        organization_id: profile.organization_id,
        submitted_by: user.id,
        raw_prompt,
        sanitized_prompt: firewallResult.sanitizedContent,
        firewall_scan_result: {
          isSafe: firewallResult.isSafe,
          detectedThreats: firewallResult.detectedThreats,
          entropyScore: firewallResult.entropyScore,
          timestamp: firewallResult.timestamp,
        },
        priority,
        status: "PENDING",
        metadata: metadata ?? {},
      } as never)
      .select("id")
      .single() as unknown as Promise<{ data: InsertedRequest | null; error: { message: string } | null }>);

    if (insertResult.error || !insertResult.data) {
      throw new Error(insertResult.error?.message ?? "Failed to insert request");
    }

    const newRequest = insertResult.data;

    // 6. Write audit log
    await writeAuditLog({
      event_type: "REQUEST_SUBMITTED",
      actor_user_id: user.id,
      organization_id: profile.organization_id,
      resource_id: newRequest.id,
      resource_type: "business_request",
      ip_address: req.headers.get("x-forwarded-for") ?? undefined,
    });

    // 7. Trigger agent run
    const agentResult = await triggerAgentRun({
      requestId: newRequest.id,
      organizationId: profile.organization_id,
      userId: user.id,
      sanitizedPrompt: firewallResult.sanitizedContent,
    });

    return NextResponse.json(
      { requestId: newRequest.id, runId: agentResult.runId, status: agentResult.status },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/v1/requests/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
