import { createAdminClient } from '@/lib/supabase/admin';
import { scanInventoryDepletionTool } from '../tools/inventory-tools';
import { scanPendingCustomerOrdersTool } from '../tools/order-tools';
import { createApprovalProposalTool, createMessageDraftTool } from '../tools/draft-tools';
import { analyzeDirectiveWithGemini } from './gemini-client.service';

export async function executeAgentWorkflow(runId: string) {
  const supabase = createAdminClient();
  const startTime = new Date().toISOString();

  // 1. Fetch run details
  const { data: run, error: runErr } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runErr || !run) {
    throw new Error(`Run ${runId} not found: ${runErr?.message}`);
  }

  // Set run status to running
  await (supabase.from('agent_runs') as any)
    .update({ status: 'running', started_at: startTime })
    .eq('id', runId);

  try {
    // STEP 1: Gemini Neural Decomposition & Planning
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
          usedFallback: plan.usedFallback ?? false,
          requiresToolExecution: true,
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 1);

    // STEP 2: Deterministic Multi-Tool Execution (Query Live State)
    let inventoryResult = null;
    let orderResult = null;

    const needsInventory = plan.recommendedTools.includes('scan_inventory') || plan.targetDomains.includes('inventory');
    const needsOrders = plan.recommendedTools.includes('scan_orders') || plan.targetDomains.includes('orders');

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
          inventoryScan: inventoryResult ? {
            depletedSkus: inventoryResult.totalDepleted,
            lowStockSkus: inventoryResult.totalLowStock,
            criticalItems: inventoryResult.items.map((i) => i.sku),
          } : null,
          orderScan: orderResult ? {
            pendingOrdersCount: orderResult.pendingCount,
            totalValueCents: orderResult.totalValueCents,
          } : null,
        },
      })
      .eq('run_id', runId)
      .eq('sequence_no', 2);

    // STEP 3: Risk Evaluation & Action Proposals
    const actionProposals: string[] = [];

    // If depleted items found and tool recommends restock proposal
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

    // If pending client orders found, create proactive draft notification
    if (orderResult && orderResult.orders.length > 0) {
      const targetOrder = orderResult.orders[0];
      const draftMessage = plan.proposedCustomerCopy ||
        `Dear ${targetOrder.customer.name},\n\nYour purchase order #${targetOrder.orderNumber} for automotive components is currently in active processing in our warehouse. Your dispatch tracking will be transmitted immediately upon staging.\n\nWarm regards,\nOpsPilot Operations`;

      const draft = await createMessageDraftTool({
        runId,
        customerId: targetOrder.customer.id,
        orderId: targetOrder.orderId,
        content: draftMessage,
      });

      // Post approval gate for sending the draft message
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

    // STEP 4: Enter Human Approval Checkpoint
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

    // Set run status to waiting_approval
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
