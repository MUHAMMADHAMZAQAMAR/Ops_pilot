export interface GeminiPlanResult {
  model: string;
  intent: 'inventory_restock' | 'customer_communication' | 'combined_fulfillment' | 'general_inspection';
  targetDomains: string[];
  urgency: 'normal' | 'urgent' | 'critical';
  reasoning: string;
  recommendedTools: ('scan_inventory' | 'scan_orders' | 'draft_customer_email' | 'propose_restock')[];
  proposedCustomerCopy?: string;
  usedFallback?: boolean;
}

/**
 * Invokes Google Gemini API with adaptive fallback
 */
export async function analyzeDirectiveWithGemini(task: string): Promise<GeminiPlanResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const systemPrompt = `You are OpsPilot Neural Planner, an AI business operations orchestrator.
Analyze the operator's directive and output ONLY valid JSON matching this schema:
{
  "intent": "inventory_restock" | "customer_communication" | "combined_fulfillment" | "general_inspection",
  "targetDomains": ["inventory" | "orders" | "customers"],
  "urgency": "normal" | "urgent" | "critical",
  "reasoning": "brief 1-2 sentence rationale",
  "recommendedTools": ["scan_inventory" | "scan_orders" | "draft_customer_email" | "propose_restock"],
  "proposedCustomerCopy": "optional drafted email body if customer communication is needed"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `Operator Directive: "${task}"` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            model: 'gemini-3.8-flash',
            intent: parsed.intent || 'combined_fulfillment',
            targetDomains: parsed.targetDomains || ['inventory', 'orders'],
            urgency: parsed.urgency || 'normal',
            reasoning: parsed.reasoning || 'Directive decomposed via Gemini neural reasoning.',
            recommendedTools: parsed.recommendedTools || ['scan_inventory', 'scan_orders'],
            proposedCustomerCopy: parsed.proposedCustomerCopy,
            usedFallback: false,
          };
        }
      } else {
        console.warn(`Gemini API returned status ${res.status}. Engaging adaptive fallback.`);
      }
    } catch (err: any) {
      console.warn(`Gemini API call bypassed (${err?.name || err?.message}). Engaging adaptive fallback.`);
    }
  }

  // Adaptive Resilient Fallback Engine
  const taskLower = task.toLowerCase();
  const isInventory =
    taskLower.includes('inventory') ||
    taskLower.includes('stock') ||
    taskLower.includes('replenish') ||
    taskLower.includes('sku') ||
    taskLower.includes('brake') ||
    taskLower.includes('tire');

  const isCustomer =
    taskLower.includes('order') ||
    taskLower.includes('customer') ||
    taskLower.includes('client') ||
    taskLower.includes('dispatch') ||
    taskLower.includes('notify') ||
    taskLower.includes('email');

  let intent: GeminiPlanResult['intent'] = 'combined_fulfillment';
  let targetDomains = ['inventory', 'orders'];
  let recommendedTools: GeminiPlanResult['recommendedTools'] = ['scan_inventory', 'scan_orders'];

  if (isInventory && !isCustomer) {
    intent = 'inventory_restock';
    targetDomains = ['inventory'];
    recommendedTools = ['scan_inventory', 'propose_restock'];
  } else if (isCustomer && !isInventory) {
    intent = 'customer_communication';
    targetDomains = ['orders', 'customers'];
    recommendedTools = ['scan_orders', 'draft_customer_email'];
  } else {
    recommendedTools = ['scan_inventory', 'scan_orders', 'propose_restock', 'draft_customer_email'];
  }

  const urgency = taskLower.includes('critical')
    ? 'critical'
    : taskLower.includes('urgent')
    ? 'urgent'
    : 'normal';

  return {
    model: 'gemini-hybrid-planner',
    intent,
    targetDomains,
    urgency,
    reasoning: `Decomposed prompt into ${recommendedTools.join(' and ')} tools with ${urgency} priority based on semantic automotive heuristics.`,
    recommendedTools,
    usedFallback: true,
  };
}

