import { createAdminClient } from '@/lib/supabase/admin';
import { scanInventoryDepletionTool } from '../tools/inventory-tools';
import { scanPendingCustomerOrdersTool } from '../tools/order-tools';
import { createApprovalProposalTool, createMessageDraftTool } from '../tools/draft-tools';
import {
  AGENT_TOOL_DECLARATIONS,
  GEMINI_MODEL,
  analyzeDirectiveWithGemini,
  getGenAIClient,
  type Content,
} from './gemini-client.service';

const MAX_REACT_ITERATIONS = 6;
const REACT_TURN_TIMEOUT_MS = 10000;

interface ReActExecutionSummary {
  usedReAct: boolean;
  model: string;
  iterations: number;
  toolTrace: Array<{ turn: number; tool: string; args: Record<string, unknown>; summary: string }>;
  inventoryScan: {
    depletedSkus: number;
    lowStockSkus: number;
    criticalItems: string[];
  } | null;
  orderScan: {
    pendingOrdersCount: number;
    totalValueCents: number;
  } | null;
  actionProposals: string[];
  finalReasoning: string;
}

async function runReActAgentLoop(
  runId: string,
  task: string,
  userId: string
): Promise<ReActExecutionSummary | null> {
  const ai = getGenAIClient();
  if (!ai) return null;

  const contents: Content[] = [
    {
      role: 'user',
      parts: [{ text: `Operator Directive: "${task}"\n\nExecute the necessary read-only scans first, then stage any required HITL proposals or drafts.` }],
    },
  ];

  const toolTrace: ReActExecutionSummary['toolTrace'] = [];
  const actionProposals: string[] = [];
  let inventoryScan: ReActExecutionSummary['inventoryScan'] = null;
  let orderScan: ReActExecutionSummary['orderScan'] = null;
  let finalReasoning = '';
  let iterations = 0;

  const systemInstruction = `You are OpsPilot Autonomous ReAct Agent for an automotive e-commerce operations platform.
Follow this Reasoning + Acting protocol:
1. First, inspect live state using scan_inventory_depletion and/or scan_pending_orders based on the directive.
2. Only after observing tool results, decide whether to stage HITL proposals:
   - If depleted or low-stock SKUs exist and restocking is relevant, call create_restock_proposal for the highest-priority SKU.
   - If pending orders exist and customer communication is relevant, call create_customer_draft for the top pending order with a concise, professional update.
3. Never invent SKUs, customer IDs, emails, or order numbers; always use exact values returned by scan tools.
4. Once all required actions are staged, stop calling tools and output a concise 1-2 sentence operational summary.`;

  for (let turn = 1; turn <= MAX_REACT_ITERATIONS; turn++) {
    iterations = turn;
    const response = await Promise.race([
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.15,
          tools: [{ functionDeclarations: AGENT_TOOL_DECLARATIONS }],
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`ReAct turn ${turn} timed out`)), REACT_TURN_TIMEOUT_MS)
      ),
    ]);

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    }

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      finalReasoning = response.text?.trim() || 'ReAct loop completed operational assessment.';
      break;
    }

    const responseParts: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = [];

    for (const call of calls) {
      const toolName = call.name || 'unknown_tool';
      const args = (call.args || {}) as Record<string, unknown>;
      let result: Record<string, unknown>;
      let summary = '';

      try {
        if (toolName === 'scan_inventory_depletion') {
          const mult = typeof args.thresholdMultiplier === 'number' ? args.thresholdMultiplier : 1;
          const res = await scanInventoryDepletionTool(mult);
          inventoryScan = {
            depletedSkus: res.totalDepleted,
            lowStockSkus: res.totalLowStock,
            criticalItems: res.items.map((i) => i.sku),
          };
          summary = `Found ${res.totalDepleted} depleted, ${res.totalLowStock} low-stock SKUs`;
          result = {
            totalDepleted: res.totalDepleted,
            totalLowStock: res.totalLowStock,
            items: res.items.slice(0, 10),
          };
        } else if (toolName === 'scan_pending_orders') {
          const res = await scanPendingCustomerOrdersTool();
          orderScan = {
            pendingOrdersCount: res.pendingCount,
            totalValueCents: res.totalValueCents,
          };
          summary = `Found ${res.pendingCount} pending orders`;
          result = {
            pendingCount: res.pendingCount,
            totalValueCents: res.totalValueCents,
            orders: res.orders.slice(0, 10),
          };
        } else if (toolName === 'create_restock_proposal') {
          const approval = await createApprovalProposalTool({
            runId,
            actionType: 'order_inventory_restock',
            requestedBy: userId,
            payload: {
              product_sku: String(args.sku ?? 'UNKNOWN'),
              product_name: String(args.productName ?? 'Automotive Part'),
              quantity: Number(args.quantity ?? 10),
              unit_cost_cents: Number(args.unitPriceCents ?? 0),
              total_cents: Number(args.totalCents ?? 0),
              supplier: String(args.supplier ?? 'Wholesale Direct'),
              urgency: String(args.urgency ?? 'REORDER_THRESHOLD'),
              plannerReasoning: String(args.reasoning ?? 'Staged via ReAct agent'),
            },
          });
          const msg = `Restock purchase proposal created for ${String(args.sku)} (ID: ${approval.approvalId.slice(0, 8)})`;
          actionProposals.push(msg);
          summary = msg;
          result = { success: true, approvalId: approval.approvalId };
        } else if (toolName === 'create_customer_draft') {
          const draft = await createMessageDraftTool({
            runId,
            customerId: String(args.customerId),
            orderId: args.orderId ? String(args.orderId) : undefined,
            content: String(args.content ?? ''),
          });
          await createApprovalProposalTool({
            runId,
            actionType: 'send_customer_email',
            requestedBy: userId,
            payload: {
              customer_name: String(args.customerName ?? 'Customer'),
              recipient_email: String(args.recipientEmail ?? ''),
              order_number: String(args.orderNumber ?? ''),
              draft_id: draft.draftId,
              subject: String(args.subject ?? `OpsPilot Update: Order #${String(args.orderNumber ?? '')}`),
            },
          });
          const msg = `Draft message prepared for ${String(args.customerName)} and gated for review`;
          actionProposals.push(msg);
          summary = msg;
          result = { success: true, draftId: draft.draftId };
        } else {
          summary = `Unknown tool ${toolName}`;
          result = { error: `Tool ${toolName} is not registered.` };
        }
      } catch (toolErr: unknown) {
        const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
        summary = `Error: ${errMsg}`;
        result = { error: errMsg };
      }

      toolTrace.push({ turn, tool: toolName, args, summary });
      responseParts.push({
        functionResponse: {
          name: toolName,
          response: result,
        },
      });
    }

    contents.push({
      role: 'user',
      parts: responseParts,
    });
  }

  return {
    usedReAct: true,
    model: GEMINI_MODEL,
    iterations,
    toolTrace,
    inventoryScan,
    orderScan,
    actionProposals,
    finalReasoning: finalReasoning || `Completed ${iterations} ReAct reasoning turns.`,
  };
}

export async function executeAgentWorkflow(runId: string) {
  const supabase = createAdminClient();
  const startTime = new Date().toISOString();

  // 1. Fetch run details with idempotency guard
  const { data: run, error: runErr } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runErr || !run) {
    throw new Error(`Run ${runId} not found: ${runErr?.message}`);
  }

  if (run.status === 'waiting_approval' || run.status === 'completed') {
    return { success: true, status: run.status, idempotentSkip: true };
  }

  await (supabase.from('agent_runs') as any)
    .update({ status: 'running', started_at: startTime })
    .eq('id', runId);

  try {
    let reactSummary: ReActExecutionSummary | null = null;
    try {
      reactSummary = await runReActAgentLoop(runId, run.task, run.user_id);
    } catch (reactErr: unknown) {
      const msg = reactErr instanceof Error ? reactErr.message : String(reactErr);
      console.warn(`ReAct loop bypassed (${msg}). Falling back to deterministic planner.`);
    }

    if (reactSummary) {
      // STEP 1: ReAct Planning & Reasoning Telemetry
      await (supabase.from('agent_steps') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: {
            architecture: 'ReAct Multi-Turn Function Calling',
            plannerModel: reactSummary.model,
            reactIterations: reactSummary.iterations,
            reasoning: reactSummary.finalReasoning,
            usedFallback: false,
          },
        })
        .eq('run_id', runId)
        .eq('sequence_no', 1);

      // STEP 2: Native Tool Execution Trace
      await (supabase.from('agent_steps') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: {
            toolCallsExecuted: reactSummary.toolTrace.length,
            trace: reactSummary.toolTrace,
            inventoryScan: reactSummary.inventoryScan,
            orderScan: reactSummary.orderScan,
          },
        })
        .eq('run_id', runId)
        .eq('sequence_no', 2);

      // STEP 3: Risk Evaluation & Staged Proposals
      await (supabase.from('agent_steps') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: {
            evaluation:
              reactSummary.actionProposals.length > 0
                ? 'Sensitive external proposals staged for human verification.'
                : 'Read-only inspection completed; no external mutations required.',
            proposalsCount: reactSummary.actionProposals.length,
            proposals: reactSummary.actionProposals,
            plannerModel: reactSummary.model,
          },
        })
        .eq('run_id', runId)
        .eq('sequence_no', 3);

      const hasProposals = reactSummary.actionProposals.length > 0;
      const finalStatus = hasProposals ? 'waiting_approval' : 'completed';

      await (supabase.from('agent_steps') as any)
        .update({
          status: hasProposals ? 'running' : 'completed',
          started_at: new Date().toISOString(),
          completed_at: hasProposals ? null : new Date().toISOString(),
          output: {
            checkpoint: hasProposals
              ? 'Paused at approval gate. Waiting for operator review in /approvals.'
              : 'No sensitive mutations staged; workflow completed autonomously.',
          },
        })
        .eq('run_id', runId)
        .eq('sequence_no', 4);

      await (supabase.from('agent_runs') as any)
        .update({
          status: finalStatus,
          completed_at: hasProposals ? null : new Date().toISOString(),
          result: {
            architecture: 'ReAct',
            planner: reactSummary.model,
            iterations: reactSummary.iterations,
            reasoning: reactSummary.finalReasoning,
            proposalsCount: reactSummary.actionProposals.length,
          },
        })
        .eq('id', runId);

      return {
        success: true,
        status: finalStatus,
        actionProposals: reactSummary.actionProposals,
        planner: reactSummary.model,
      };
    }

    // RESILIENT FALLBACK: Structured Planner + Deterministic Multi-Tool Pipeline
    const plan = await analyzeDirectiveWithGemini(run.task);

    await (supabase.from('agent_steps') as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output: {
          plannerModel: plan.model,
          intent: plan.intent,
          urgency: plan.urgency,
          targetDomains: plan.targetDomains,
          reasoning: plan.reasoning,
          recommendedTools: plan.recommendedTools,
          usedFallback: plan.usedFallback ?? true,
          requiresToolExecution: true,
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 1);

    let inventoryResult = null;
    let orderResult = null;

    const needsInventory =
      plan.recommendedTools.includes('scan_inventory') || plan.targetDomains.includes('inventory');
    const needsOrders =
      plan.recommendedTools.includes('scan_orders') || plan.targetDomains.includes('orders');

    if (needsInventory) {
      inventoryResult = await scanInventoryDepletionTool(1);
    }
    if (needsOrders) {
      orderResult = await scanPendingCustomerOrdersTool();
    }

    await (supabase.from('agent_steps') as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output: {
          inventoryScan: inventoryResult
            ? {
                depletedSkus: inventoryResult.totalDepleted,
                lowStockSkus: inventoryResult.totalLowStock,
                criticalItems: inventoryResult.items.map((i) => i.sku),
              }
            : null,
          orderScan: orderResult
            ? {
                pendingOrdersCount: orderResult.pendingCount,
                totalValueCents: orderResult.totalValueCents,
              }
            : null,
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 2);

    const actionProposals: string[] = [];

    if (inventoryResult && inventoryResult.items.length > 0) {
      const topDepleted = inventoryResult.items[0];
      const approval = await createApprovalProposalTool({
        runId,
        actionType: 'order_inventory_restock',
        requestedBy: run.user_id,
        payload: {
          product_sku: topDepleted.sku,
          product_name: topDepleted.name,
          quantity: topDepleted.unitsNeeded,
          unit_cost_cents: topDepleted.unitPriceCents,
          total_cents: topDepleted.estimatedRestockCostCents,
          supplier: `${topDepleted.brand} Wholesale Direct`,
          urgency: topDepleted.currentStock === 0 ? 'CRITICAL_DEPLETION' : 'REORDER_THRESHOLD',
          plannerReasoning: plan.reasoning,
        },
      });
      actionProposals.push(`Restock purchase proposal created (ID: ${approval.approvalId.slice(0, 8)})`);
    }

    if (orderResult && orderResult.orders.length > 0) {
      const targetOrder = orderResult.orders[0];
      const draftMessage =
        plan.proposedCustomerCopy ||
        `Dear ${targetOrder.customer.name},\n\nYour purchase order #${targetOrder.orderNumber} for automotive components is currently in active processing in our warehouse. Your dispatch tracking will be transmitted immediately upon staging.\n\nWarm regards,\nOpsPilot Operations`;

      const draft = await createMessageDraftTool({
        runId,
        customerId: targetOrder.customer.id,
        orderId: targetOrder.orderId,
        content: draftMessage,
      });

      await createApprovalProposalTool({
        runId,
        actionType: 'send_customer_email',
        requestedBy: run.user_id,
        payload: {
          customer_name: targetOrder.customer.name,
          recipient_email: targetOrder.customer.email,
          order_number: targetOrder.orderNumber,
          draft_id: draft.draftId,
          subject: `OpsPilot Update: Order #${targetOrder.orderNumber} Fulfillment Status`,
        },
      });
      actionProposals.push(`Draft message prepared for ${targetOrder.customer.name} and gated for review`);
    }

    await (supabase.from('agent_steps') as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output: {
          evaluation: 'Action proposals contain sensitive external operations requiring human verification.',
          proposalsCount: actionProposals.length,
          proposals: actionProposals,
          plannerModel: plan.model,
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 3);

    await (supabase.from('agent_steps') as any)
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        output: {
          checkpoint: 'Paused at approval gate. Waiting for operator review in /approvals.',
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 4);

    await (supabase.from('agent_runs') as any)
      .update({
        status: 'waiting_approval',
        result: {
          planner: plan.model,
          intent: plan.intent,
          reasoning: plan.reasoning,
          urgency: plan.urgency,
        },
      })
      .eq('id', runId);

    return { success: true, status: 'waiting_approval', actionProposals, planner: plan.model };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown execution failure';
    console.error('Agent execution error:', errorMsg);

    await (supabase.from('agent_runs') as any)
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMsg,
      })
      .eq('id', runId);

    throw err;
  }
}
