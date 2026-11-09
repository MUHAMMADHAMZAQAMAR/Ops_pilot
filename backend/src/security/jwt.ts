import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { ApprovalPayload, ApprovalPayloadSchema, RiskLevel } from "../types/security.js";
import { env } from "../config/env.js";

const JWT_SECRET = new TextEncoder().encode(env.APPROVAL_JWT_SECRET);

export class ApprovalJwtService {
  public static computeParametersHash(parameters: Record<string, unknown>): string {
    const canonicalString = JSON.stringify(parameters, Object.keys(parameters).sort());
    return createHash("sha256").update(canonicalString).digest("hex");
  }

  public static computeTokenHash(
    taskId: string,
    actionName: string,
    parametersHash: string,
    orgId: string,
    issuedAt: number
  ): string {
    const raw = `${taskId}:${actionName}:${parametersHash}:${orgId}:${issuedAt}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  public static async generateApprovalToken(params: {
    taskId: string;
    runId: string;
    orgId: string;
    actionName: string;
    parameters: Record<string, unknown>;
    riskLevel: RiskLevel;
    expirationSeconds?: number;
  }): Promise<{ token: string; tokenHash: string; expiresAt: number }> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const ttl = params.expirationSeconds || env.APPROVAL_TOKEN_TTL_SECONDS;
    const expiresAt = issuedAt + ttl;

    const parametersHash = this.computeParametersHash(params.parameters);
    const tokenHash = this.computeTokenHash(
      params.taskId,
      params.actionName,
      parametersHash,
      params.orgId,
      issuedAt
    );

    const payload: ApprovalPayload = {
      taskId: params.taskId,
      runId: params.runId,
      orgId: params.orgId,
      actionName: params.actionName,
      parametersHash,
      riskLevel: params.riskLevel,
      issuedAt,
      expiresAt,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .setSubject(params.taskId)
      .setIssuer("zero-trust-agent-runtime")
      .sign(JWT_SECRET);

    return { token, tokenHash, expiresAt };
  }

  public static async verifyApprovalToken(
    token: string,
    expectedOrgId?: string
  ): Promise<{ valid: boolean; payload?: ApprovalPayload; error?: string }> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: "zero-trust-agent-runtime",
      });

      const parsed = ApprovalPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        return { valid: false, error: "Malformed approval token payload" };
      }

      if (expectedOrgId && parsed.data.orgId !== expectedOrgId) {
        return { valid: false, error: "Token organization mismatch (Cross-tenant breach attempt)" };
      }

      return { valid: true, payload: parsed.data };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Token verification failed";
      return { valid: false, error: errorMessage };
    }
  }
}

