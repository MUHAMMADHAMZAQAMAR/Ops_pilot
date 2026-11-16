import { NextRequest } from 'next/server';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { scanInventoryDepletionTool } from '@/features/agent/tools/inventory-tools';
import { scanPendingCustomerOrdersTool } from '@/features/agent/tools/order-tools';
import {
  COPILOT_TOOL_DECLARATIONS,
  GEMINI_MODEL,
  getGenAIClient,
  type Content,
} from '@/features/agent/services/gemini-client.service';

export const runtime = 'nodejs';

interface CopilotStreamRequest {
  prompt: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

async function fetchGovernanceTelemetry() {
  const admin = createAdminClient();
  const [appRes, draftRes, runRes] = await Promise.all([
    admin.from('action_approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('message_drafts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('agent_runs').select('id', { count: 'exact', head: true }).eq('status', 'waiting_approval'),
  ]);

  return {
    pendingApprovals: appRes.count ?? 0,
    pendingDrafts: draftRes.count ?? 0,
    waitingRuns: runRes.count ?? 0,
  };
}

export async function POST(req: NextRequest) {
  const user = await getVerifiedOperator();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: CopilotStreamRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cleanPrompt = body.prompt?.trim();
  if (!cleanPrompt) {
    return new Response(JSON.stringify({ error: 'Please enter a question or command.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      const toolsUsed: string[] = [];
      let inventoryContext: Awaited<ReturnType<typeof scanInventoryDepletionTool>> | null = null;
      let ordersContext: Awaited<ReturnType<typeof scanPendingCustomerOrdersTool>> | null = null;
      let governanceContext: Awaited<ReturnType<typeof fetchGovernanceTelemetry>> | null = null;
      let actionLink: { label: string; href: string } | undefined;

      const computeActionLink = () => {
        if (governanceContext && governanceContext.pendingApprovals > 0) {
          return {
            label: `Review ${governanceContext.pendingApprovals} Pending Approvals`,
            href: '/approvals',
          };
        }
        if (inventoryContext && inventoryContext.items.length > 0) {
          return { label: 'Open Inventory Ledger', href: '/inventory' };
        }
        if (ordersContext && ordersContext.pendingCount > 0) {
          return { label: 'View Pending Orders', href: '/orders' };
        }
        return undefined;
      };

      const ai = getGenAIClient();

      if (ai) {
        try {
          const contents: Content[] = [
            ...history.map((m) => ({
              role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
              parts: [{ text: m.content }],
            })),
            { role: 'user', parts: [{ text: cleanPrompt }] },
          ];

          const systemInstruction = `You are OpsPilot Copilot, a concise, accurate AI Operations Assistant for an automotive e-commerce business.
Use the provided tools to inspect live inventory, pending orders, or governance telemetry before answering.
Answer directly using ONLY the live database facts returned by tools. Format dollar amounts from cents properly (divide by 100). Keep replies concise (2-5 sentences or bullet points).`;

          // Step 1: Agentic Tool-Calling Turn (up to 3 tool rounds)
          let readyToStream = false;
          for (let round = 0; round < 3; round++) {
            const turnRes = await Promise.race([
              ai.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config: {
                  systemInstruction,
                  temperature: 0.2,
                  tools: [{ functionDeclarations: COPILOT_TOOL_DECLARATIONS }],
                },
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Copilot tool turn timeout')), 6000)
              ),
            ]);

            const calls = turnRes.functionCalls;
            if (!calls || calls.length === 0) {
              // Model answered directly without needing more tools
              const directText = turnRes.text?.trim();
              if (directText) {
                actionLink = computeActionLink();
                sendEvent({ type: 'meta', model: GEMINI_MODEL, toolsUsed, actionLink });
                sendEvent({ type: 'delta', text: directText });
                sendEvent({ type: 'done' });
                controller.close();
                return;
              }
              readyToStream = true;
              break;
            }

            if (turnRes.candidates?.[0]?.content) {
              contents.push(turnRes.candidates[0].content);
            }

            const fnResponseParts: Array<{
              functionResponse: { name: string; response: Record<string, unknown> };
            }> = [];

            for (const call of calls) {
              const name = call.name || '';
              const args = (call.args || {}) as Record<string, unknown>;

              if (name === 'scan_inventory_depletion') {
                const mult = typeof args.thresholdMultiplier === 'number' ? args.thresholdMultiplier : 15;
                inventoryContext = await scanInventoryDepletionTool(mult);
                toolsUsed.push(`Inventory Scan (${inventoryContext.items.length} alerts)`);
                fnResponseParts.push({
                  functionResponse: { name, response: inventoryContext as unknown as Record<string, unknown> },
                });
              } else if (name === 'scan_pending_orders') {
                ordersContext = await scanPendingCustomerOrdersTool();
                toolsUsed.push(`Orders Scan (${ordersContext.pendingCount} pending)`);
                fnResponseParts.push({
                  functionResponse: { name, response: ordersContext as unknown as Record<string, unknown> },
                });
              } else if (name === 'get_governance_telemetry') {
                governanceContext = await fetchGovernanceTelemetry();
                toolsUsed.push('Governance Telemetry');
                fnResponseParts.push({
                  functionResponse: { name, response: governanceContext as unknown as Record<string, unknown> },
                });
              }
            }

            contents.push({ role: 'user', parts: fnResponseParts });
            readyToStream = true;
          }

          // Step 2: Stream Grounded Response Token-by-Token
          if (readyToStream) {
            actionLink = computeActionLink();
            sendEvent({ type: 'meta', model: GEMINI_MODEL, toolsUsed, actionLink });

            const streamResult = await ai.models.generateContentStream({
              model: GEMINI_MODEL,
              contents,
              config: {
                systemInstruction,
                temperature: 0.3,
                maxOutputTokens: 400,
              },
            });

            let streamedAny = false;
            for await (const chunk of streamResult) {
              const delta = chunk.text;
              if (delta) {
                streamedAny = true;
                sendEvent({ type: 'delta', text: delta });
              }
            }

            if (streamedAny) {
              sendEvent({ type: 'done' });
              controller.close();
              return;
            }
          }
        } catch (err) {
          console.warn('Copilot streaming fallback engaged:', err instanceof Error ? err.message : err);
        }
      }

      // Deterministic Resilient Fallback
      if (!inventoryContext) {
        inventoryContext = await scanInventoryDepletionTool(15);
        toolsUsed.push(`Inventory Scan (${inventoryContext.items.length} alerts)`);
      }
      if (!ordersContext) {
        ordersContext = await scanPendingCustomerOrdersTool();
        toolsUsed.push(`Orders Scan (${ordersContext.pendingCount} pending)`);
      }
      if (!governanceContext) {
        governanceContext = await fetchGovernanceTelemetry();
        toolsUsed.push('Governance Telemetry');
      }

      const lines: string[] = ['Live Operations Snapshot:'];
      if (inventoryContext.items.length > 0) {
        const top = inventoryContext.items
          .slice(0, 3)
          .map((i) => `${i.sku} (${i.currentStock} left)`)
          .join(', ');
        lines.push(`• Inventory: ${inventoryContext.items.length} SKUs at/below threshold (${top}).`);
      } else {
        lines.push('• Inventory: All tracked SKUs are healthy.');
      }

      const totalVal = ((ordersContext.totalValueCents || 0) / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      lines.push(`• Orders: ${ordersContext.pendingCount} pending/processing orders totaling ${totalVal}.`);
      lines.push(
        `• Governance: ${governanceContext.pendingApprovals} pending approvals, ${governanceContext.pendingDrafts} unsent drafts.`
      );

      actionLink = computeActionLink();
      sendEvent({ type: 'meta', model: 'opspilot-deterministic-v2', toolsUsed, actionLink });
      sendEvent({ type: 'delta', text: lines.join('\n') });
      sendEvent({ type: 'done' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
