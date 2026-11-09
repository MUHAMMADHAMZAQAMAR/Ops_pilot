import { PromptFirewall } from "../../security/firewall.js";
import { AgentStateType, AgentStateUpdate } from "../state.js";

export async function sanitizeInputNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const scanResult = PromptFirewall.scan(state.rawInput, true);

  const trailEntry = {
    timestamp: new Date().toISOString(),
    node: "SanitizeInputNode",
    message: scanResult.isSafe
      ? "Input passed zero-trust firewall check with 0 detected threats"
      : `Firewall neutralized ${scanResult.detectedThreats.length} threat(s)`,
    data: {
      threats: scanResult.detectedThreats,
      entropy: scanResult.entropyScore,
    },
  };

  return {
    sanitizedInput: scanResult.sanitizedContent,
    firewallPassed: scanResult.isSafe,
    securityThreats: scanResult.detectedThreats,
    auditTrail: [trailEntry],
  };
}

