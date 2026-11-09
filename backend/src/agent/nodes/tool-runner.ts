import { AgentStateType, AgentStateUpdate } from "../state.js";
import { CustomerSearchTool } from "../../tools/customer-search.js";
import { SalesAnalyzerTool } from "../../tools/sales-analyzer.js";
import { EmailGeneratorTool } from "../../tools/email-generator.js";
import { EmailSenderTool } from "../../tools/email-sender.js";
import { adminSupabase } from "../../supabase/client.js";
import { SecurityContext } from "../../types/security.js";
import { createHash } from "crypto";

const toolRegistry: Record<string, any> = {
  customer_search: new CustomerSearchTool(),
  sales_analyzer: new SalesAnalyzerTool(),
  email_generator: new EmailGeneratorTool(),
  email_sender: new EmailSenderTool(),
};

export async function toolRunnerNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const currentStep = state.currentStep;

  if (!currentStep) {
    return { isCompleted: true };
  }

  if (state.approvalStatus === "PENDING") {
    return {
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          node: "ToolRunnerNode",
          message: `Execution blocked: Step '${currentStep.title}' requires explicit cryptographic approval.`,
        },
      ],
    };
  }

  const tool = toolRegistry[currentStep.toolName];
  if (!tool) {
    throw new Error(`Unregistered or prohibited tool invocation: ${currentStep.toolName}`);
  }

  const { data: memberRecord } = await adminSupabase
    .from("organization_members")
    .select("role")
    .eq("org_id", state.orgId)
    .eq("user_id", state.userId)
    .maybeSingle();

  const userRole = (memberRecord?.role as "owner" | "admin" | "member") || "member";

  const securityContext: SecurityContext = {
    userId: state.userId,
    orgId: state.orgId,
    role: userRole,
  };

  const idempotencyKey = createHash("sha256")
    .update(`${state.runId}:${currentStep.id}:${currentStep.toolName}`)
    .digest("hex");

  const executionResult = await tool.run(
    currentStep.parameters,
    securityContext,
    adminSupabase,
    idempotencyKey,
    currentStep.id
  );

  const updatedResults = {
    ...state.toolResults,
    [currentStep.toolName]: executionResult.data ?? executionResult.rawUntrustedOutput,
  };

  const plan = state.executionPlan;
  const nextIndex = state.currentStepIndex + 1;
  const hasMoreSteps = plan && nextIndex < plan.steps.length;
  const nextStep = hasMoreSteps ? plan.steps[nextIndex] : null;

  return {
    toolResults: updatedResults,
    currentStepIndex: nextIndex,
    currentStep: nextStep,
    approvalStatus: "NONE",
    approvalToken: null,
    isCompleted: !hasMoreSteps,
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        node: "ToolRunnerNode",
        message: executionResult.success
          ? `Executed tool '${tool.name}' successfully in ${executionResult.executionTimeMs}ms.`
          : `Tool '${tool.name}' failed: ${executionResult.error}`,
        data: {
          toolName: tool.name,
          executionTimeMs: executionResult.executionTimeMs,
          success: executionResult.success,
        },
      },
    ],
  };
}

