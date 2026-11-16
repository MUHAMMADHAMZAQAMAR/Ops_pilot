import { GoogleGenAI, Type, type FunctionDeclaration, type Content } from '@google/genai';
import { z } from 'zod';

export const GEMINI_MODEL = 'gemini-2.5-flash';

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

const PlanSchema = z.object({
  intent: z
    .enum(['inventory_restock', 'customer_communication', 'combined_fulfillment', 'general_inspection'])
    .default('combined_fulfillment'),
  targetDomains: z.array(z.string()).default(['inventory', 'orders']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  reasoning: z.string().default('Directive decomposed via Gemini neural reasoning.'),
  recommendedTools: z
    .array(z.enum(['scan_inventory', 'scan_orders', 'draft_customer_email', 'propose_restock']))
    .default(['scan_inventory', 'scan_orders']),
  proposedCustomerCopy: z.string().optional(),
});

let cachedClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

/**
 * Native Gemini Function Declarations for the ReAct Agent Orchestrator
 */
export const AGENT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'scan_inventory_depletion',
    description:
      'Scans live warehouse inventory in Supabase to find depleted (0 stock) and low-stock SKUs below their reorder threshold.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        thresholdMultiplier: {
          type: Type.NUMBER,
          description: 'Multiplier applied to reorder_level (default 1.0). Use >1.0 for proactive buffer scans.',
        },
      },
    },
  },
  {
    name: 'scan_pending_orders',
    description:
      'Queries live customer purchase orders with status pending or processing, including customer contact info and order totals.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'create_restock_proposal',
    description:
      'Stages a supplier inventory restock purchase proposal in the Human-in-the-Loop (HITL) approval gate. Must be called after scanning inventory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sku: { type: Type.STRING, description: 'Product SKU to restock' },
        productName: { type: Type.STRING, description: 'Product name' },
        quantity: { type: Type.NUMBER, description: 'Units to order' },
        unitPriceCents: { type: Type.NUMBER, description: 'Unit price in cents' },
        totalCents: { type: Type.NUMBER, description: 'Total restock cost in cents' },
        supplier: { type: Type.STRING, description: 'Supplier name' },
        urgency: {
          type: Type.STRING,
          description: 'CRITICAL_DEPLETION or REORDER_THRESHOLD',
        },
        reasoning: { type: Type.STRING, description: 'Concise rationale for this restock proposal' },
      },
      required: ['sku', 'productName', 'quantity', 'unitPriceCents', 'totalCents', 'supplier', 'urgency'],
    },
  },
  {
    name: 'create_customer_draft',
    description:
      'Creates a customer fulfillment email draft and stages it in the Human-in-the-Loop (HITL) approval gate before sending.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer UUID from scan_pending_orders' },
        customerName: { type: Type.STRING, description: 'Customer full name' },
        recipientEmail: { type: Type.STRING, description: 'Customer email address' },
        orderId: { type: Type.STRING, description: 'Order UUID' },
        orderNumber: { type: Type.STRING, description: 'Human-readable order number' },
        subject: { type: Type.STRING, description: 'Email subject line' },
        content: { type: Type.STRING, description: 'Professional customer email body' },
      },
      required: ['customerId', 'customerName', 'recipientEmail', 'orderId', 'orderNumber', 'subject', 'content'],
    },
  },
];

/**
 * Native Gemini Function Declarations for OpsPilot Copilot (Read-Only Grounded Retrieval)
 */
export const COPILOT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'scan_inventory_depletion',
    description:
      'Fetches live inventory alerts, low-stock SKUs, current stock quantities, and estimated restock costs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        thresholdMultiplier: {
          type: Type.NUMBER,
          description: 'Multiplier on reorder_level. Use 15 for broad stock overview, 1 for strictly low/depleted SKUs.',
        },
      },
    },
  },
  {
    name: 'scan_pending_orders',
    description: 'Fetches live pending and processing customer orders with customer details and total order value.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_governance_telemetry',
    description:
      'Fetches live counts of pending HITL approvals, staged customer email drafts, and agent runs waiting for approval.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export type { Content };

/**
 * Invokes Google Gemini API via official @google/genai SDK with structured output & adaptive fallback
 */
export async function analyzeDirectiveWithGemini(task: string): Promise<GeminiPlanResult> {
  const ai = getGenAIClient();

  if (ai) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `Operator Directive: "${task}"`,
          config: {
            systemInstruction:
              'You are OpsPilot Neural Planner, an AI business operations orchestrator. Decompose the operator directive into a structured execution plan.',
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: {
                  type: Type.STRING,
                  enum: ['inventory_restock', 'customer_communication', 'combined_fulfillment', 'general_inspection'],
                },
                targetDomains: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                urgency: {
                  type: Type.STRING,
                  enum: ['normal', 'urgent', 'critical'],
                },
                reasoning: { type: Type.STRING },
                recommendedTools: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                    enum: ['scan_inventory', 'scan_orders', 'draft_customer_email', 'propose_restock'],
                  },
                },
                proposedCustomerCopy: { type: Type.STRING },
              },
              required: ['intent', 'targetDomains', 'urgency', 'reasoning', 'recommendedTools'],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini planner timeout')), 8000)
        ),
      ]);

      const rawText = response.text;
      if (rawText) {
        const parsed = PlanSchema.parse(JSON.parse(rawText));
        return {
          model: GEMINI_MODEL,
          ...parsed,
          usedFallback: false,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini SDK planner bypassed (${msg}). Engaging adaptive fallback.`);
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
