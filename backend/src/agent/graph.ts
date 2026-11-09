import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentStateAnnotation, AgentStateType } from "./state.js";
import { sanitizeInputNode } from "./nodes/sanitize.js";
import { planExecutionNode } from "./nodes/plan.js";
import { riskEvaluationNode } from "./nodes/risk-eval.js";
import { toolRunnerNode } from "./nodes/tool-runner.js";
import { verifyOutcomeNode } from "./nodes/verify.js";
import { PostgresWorkflowCheckpointer } from "./checkpointer.js";
import { adminSupabase } from "../supabase/client.js";

export function buildAgentGraph() {
  const checkpointer = new PostgresWorkflowCheckpointer(adminSupabase);

  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("sanitize", sanitizeInputNode)
    .addNode("plan", planExecutionNode)
    .addNode("risk_eval", riskEvaluationNode)
    .addNode("tool_runner", toolRunnerNode)
    .addNode("verify", verifyOutcomeNode)

    .addEdge(START, "sanitize")

    .addConditionalEdges("sanitize", (state: AgentStateType) => {
      if (!state.firewallPassed && state.sanitizedInput.length === 0) {
        return END;
      }
      return "plan";
    })

    .addEdge("plan", "risk_eval")

    .addConditionalEdges("risk_eval", (state: AgentStateType) => {
      if (state.approvalStatus === "PENDING") {
        return END;
      }
      if (state.isCompleted || !state.currentStep) {
        return "verify";
      }
      return "tool_runner";
    })

    .addConditionalEdges("tool_runner", (state: AgentStateType) => {
      if (state.isCompleted || !state.currentStep) {
        return "verify";
      }
      return "risk_eval";
    })

    .addEdge("verify", END);

  return workflow.compile({
    checkpointer,
  });
}

