import { ZodType } from "zod";
import { RiskLevel, SecurityContext } from "../types/security.js";
import { PromptFirewall } from "../security/firewall.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

export interface ToolExecutionResult<TOutput> {
  success: boolean;
  data?: TOutput;
  rawUntrustedOutput: string;
  executionTimeMs: number;
  idempotencyKey: string;
  error?: string;
}

export abstract class AgentTool<TInput, TOutput> {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly riskLevel: RiskLevel;
  public abstract readonly requiredRole: "member" | "admin" | "owner";
  public abstract readonly inputSchema: ZodType<TInput>;
  public abstract readonly outputSchema: ZodType<TOutput>;

  protected abstract executeInternal(
    input: TInput,
    context: SecurityContext,
    supabase: SupabaseClient<Database>
  ): Promise<TOutput>;

  public async run(
    rawInput: unknown,
    context: SecurityContext,
    supabase: SupabaseClient<Database>,
    idempotencyKey: string,
    taskId: string
  ): Promise<ToolExecutionResult<TOutput>> {
    const startTime = Date.now();

    if (!this.checkAuthorization(context.role)) {
      const errorMsg = `Unauthorized: User role '${context.role}' does not satisfy minimum requirement '${this.requiredRole}' for tool '${this.name}'`;
      return {
        success: false,
        rawUntrustedOutput: PromptFirewall.wrapUntrustedContent(this.name, { error: errorMsg }),
        executionTimeMs: Date.now() - startTime,
        idempotencyKey,
        error: errorMsg,
      };
    }

    const parsedInput = this.inputSchema.safeParse(rawInput);
    if (!parsedInput.success) {
      const validationError = `Invalid tool input format: ${parsedInput.error.message}`;
      return {
        success: false,
        rawUntrustedOutput: PromptFirewall.wrapUntrustedContent(this.name, { error: validationError }),
        executionTimeMs: Date.now() - startTime,
        idempotencyKey,
        error: validationError,
      };
    }

    try {
      const outputData = await this.executeInternal(parsedInput.data, context, supabase);

      const parsedOutput = this.outputSchema.safeParse(outputData);
      if (!parsedOutput.success) {
        throw new Error(`Tool output violated runtime schema: ${parsedOutput.error.message}`);
      }

      const executionTimeMs = Date.now() - startTime;
      const rawUntrustedOutput = PromptFirewall.wrapUntrustedContent(this.name, parsedOutput.data);

      await supabase.from("tool_executions").insert({
        task_id: taskId,
        org_id: context.orgId,
        tool_name: this.name,
        input_payload: parsedInput.data as any,
        output_payload: parsedOutput.data as any,
        execution_time_ms: executionTimeMs,
        status: "COMPLETED",
        idempotency_key: idempotencyKey,
      });

      return {
        success: true,
        data: parsedOutput.data,
        rawUntrustedOutput,
        executionTimeMs,
        idempotencyKey,
      };
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown tool execution failure";

      await supabase.from("tool_executions").insert({
        task_id: taskId,
        org_id: context.orgId,
        tool_name: this.name,
        input_payload: (rawInput as any) || {},
        output_payload: { error: errorMsg },
        execution_time_ms: executionTimeMs,
        status: "FAILED",
        idempotency_key: idempotencyKey,
      });

      return {
        success: false,
        rawUntrustedOutput: PromptFirewall.wrapUntrustedContent(this.name, { error: errorMsg }),
        executionTimeMs,
        idempotencyKey,
        error: errorMsg,
      };
    }
  }

  private checkAuthorization(userRole: "owner" | "admin" | "member"): boolean {
    const hierarchy: Record<string, number> = {
      member: 1,
      admin: 2,
      owner: 3,
    };
    return (hierarchy[userRole] || 0) >= (hierarchy[this.requiredRole] || 1);
  }
}

