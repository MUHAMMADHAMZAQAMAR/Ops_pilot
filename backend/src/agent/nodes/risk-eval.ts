import { AgentStateType, AgentStateUpdate } from "../state.js";
import { ApprovalJwtService } from "../../security/jwt.js";
import { adminSupabase } from "../../supabase/client.js";
import { env } from "../../config/env.js";

export async function riskEvaluationNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const currentStep = state.currentStep;

  if (!currentStep) {
    return {
      isCompleted: true,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          node: "RiskEvaluationNode",
          message: "No remaining steps to evaluate. Workflow marked for completion.",
        },
      ],
    };
  }

  const isHighRisk = currentStep.riskLevel === "HIGH" || currentStep.riskLevel === "CRITICAL";

  if (state.approvalStatus === "APPROVED") {
    return {
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          node: "RiskEvaluationNode",
          message: `Step '${currentStep.title}' previously approved via cryptographic JWT. Resuming execution.`,
        },
      ],
    };
  }

  if (isHighRisk) {
    const { token, tokenHash, expiresAt } = await ApprovalJwtService.generateApprovalToken({
      taskId: currentStep.id,
      runId: state.runId,
      orgId: state.orgId,
      actionName: currentStep.toolName,
      parameters: currentStep.parameters,
      riskLevel: currentStep.riskLevel,
      expirationSeconds: env.APPROVAL_TOKEN_TTL_SECONDS,
    });

    await adminSupabase.from("approvals").insert({
      run_id: state.runId,
      task_id: currentStep.id,
      org_id: state.orgId,
      token_hash: tokenHash,
      status: "PENDING",
      decision_notes: `Awaiting cryptographic authorization for ${currentStep.toolName}`,
    });

    await adminSupabase
      .from("agent_runs")
      .update({
        status: "WAITING_APPROVAL",
        current_step_id: currentStep.id,
      })
      .eq("id", state.runId);

    return {
      approvalStatus: "PENDING",
      approvalToken: token,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          node: "RiskEvaluationNode",
          message: `HALTED: Step '${currentStep.title}' is ${currentStep.riskLevel} risk. Approval token minted (Expires: ${new Date(expiresAt * 1000).toISOString()}). Workflow hibernated.`,
          data: {
            taskId: currentStep.id,
            toolName: currentStep.toolName,
            tokenHash,
          },
        },
      ],
    };
  }

  return {
    approvalStatus: "NONE",
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        node: "RiskEvaluationNode",
        message: `Step '${currentStep.title}' evaluated as ${currentStep.riskLevel} risk. Clearance granted for immediate execution.`,
      },
    ],
  };
}

