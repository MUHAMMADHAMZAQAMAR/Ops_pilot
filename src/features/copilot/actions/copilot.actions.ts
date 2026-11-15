'use server';

import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { scanInventoryDepletionTool } from '@/features/agent/tools/inventory-tools';
import { scanPendingCustomerOrdersTool } from '@/features/agent/tools/order-tools';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  toolsUsed?: string[];
  actionLink?: { label: string; href: string };
  timestamp: string;
}

export interface CopilotResponse {
  error?: string;
  reply?: string;
  model?: string;
  toolsUsed?: string[];
  actionLink?: { label: string; href: string };
}

export async function askOpsPilotCopilot(
  prompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<CopilotResponse> {
  const cleanPrompt = prompt?.trim();
  if (!cleanPrompt) {
    return { error: 'Please enter a question or command.' };
  }

  const user = await getVerifiedOperator();
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const lower = cleanPrompt.toLowerCase();
  const toolsUsed: string[] = [];

  // Fetch only the relevant live context based on user query (avoids unnecessary bulk DB calls)
  const needsInventory =
    lower.includes('stock') ||
    lower.includes('inventory') ||
    lower.includes('sku') ||
    lower.includes('product') ||
    lower.includes('deplet') ||
    lower.includes('restock') ||
    lower.includes('overview') ||
    lower.includes('status');

  const needsOrders =
    lower.includes('order') ||
    lower.includes('customer') ||
    lower.includes('pending') ||
    lower.includes('revenue') ||
    lower.includes('client') ||
    lower.includes('overview') ||
    lower.includes('status');

  const needsApprovals =
    lower.includes('approv') ||
    lower.includes('gate') ||
    lower.includes('draft') ||
    lower.includes('email') ||
    lower.includes('run') ||
    lower.includes('overview') ||
    lower.includes('status');

  // Default to lightweight overview if query is very general
  const fetchAll = !needsInventory && !needsOrders && !needsApprovals;

  let inventoryContext: any = null;
  let ordersContext: any = null;
  let governanceContext: any = null;

  const tasks: Promise<void>[] = [];

  if (needsInventory || fetchAll) {
    tasks.push(
      scanInventoryDepletionTool(15).then((res) => {
        inventoryContext = res;
        toolsUsed.push(`Inventory Scan (${res.items.length} alerts)`);
      })
    );
  }

  if (needsOrders || fetchAll) {
    tasks.push(
      scanPendingCustomerOrdersTool().then((res) => {
        ordersContext = res;
        toolsUsed.push(`Orders Scan (${res.pendingCount} pending)`);
      })
    );
  }

  if (needsApprovals || fetchAll) {
    tasks.push(
      (async () => {
        const admin = createAdminClient();
        const [appRes, draftRes, runRes] = await Promise.all([
          admin
            .from('action_approvals')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          admin
            .from('message_drafts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft'),
          admin
            .from('agent_runs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'waiting_approval'),
        ]);
        governanceContext = {
          pendingApprovals: appRes.count ?? 0,
          pendingDrafts: draftRes.count ?? 0,
          waitingRuns: runRes.count ?? 0,
        };
        toolsUsed.push('Governance Telemetry');
      })()
    );
  }

  await Promise.all(tasks);

  // Suggest contextual navigation link
  let actionLink: { label: string; href: string } | undefined;
  if (governanceContext?.pendingApprovals > 0 && (needsApprovals || lower.includes('approv'))) {
    actionLink = { label: `Review ${governanceContext.pendingApprovals} Pending Approvals`, href: '/approvals' };
  } else if (needsInventory && inventoryContext?.items?.length > 0) {
    actionLink = { label: 'Open Inventory Ledger', href: '/inventory' };
  } else if (needsOrders && ordersContext?.pendingCount > 0) {
    actionLink = { label: 'View Pending Orders', href: '/orders' };
  } else if (lower.includes('draft') || lower.includes('email')) {
    actionLink = { label: 'Open Drafts Hub', href: '/drafts' };
  }

  // Call Google Gemini with live operational context + 4.5s timeout fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const recentHistory = history
        .slice(-4)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const systemContext = `You are OpsPilot Copilot, a concise, accurate AI Operations Assistant for an automotive e-commerce business.
Answer the operator's question directly using ONLY the live database facts below. Be concise (2-5 sentences or bullet points). Format dollar amounts from cents properly (divide by 100).

LIVE DATA SNAPSHOT:
- Inventory Alerts: ${JSON.stringify(inventoryContext?.items || [])}
- Pending Orders: ${JSON.stringify(ordersContext || {})}
- Governance Counts: ${JSON.stringify(governanceContext || {})}

RECENT CHAT:
${recentHistory}`;

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
                parts: [{ text: systemContext }, { text: `Operator Question: ${cleanPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 350,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return {
            reply: text,
            model: 'gemini-3.8-flash',
            toolsUsed,
            actionLink,
          };
        }
      }
    } catch {
      // Graceful fallback below
    }
  }

  // Deterministic Smart Fallback (Zero-Crash Guarantee)
  const parts: string[] = [];

  if (inventoryContext) {
    if (inventoryContext.items.length === 0) {
      parts.push('Inventory levels are healthy with zero depleted or low-stock SKUs.');
    } else {
      const top = inventoryContext.items
        .slice(0, 3)
        .map((i: any) => `${i.name} (${i.sku}: ${i.currentStock} left, reorder threshold ${i.reorderThreshold})`)
        .join('; ');
      parts.push(
        `Inventory Alert: ${inventoryContext.totalDepleted} depleted and ${inventoryContext.totalLowStock} low-stock SKU(s). Top items: ${top}.`
      );
    }
  }

  if (ordersContext) {
    const dollars = ((ordersContext.totalValueCents || 0) / 100).toFixed(2);
    parts.push(
      `Orders: ${ordersContext.pendingCount} pending order(s) totaling $${dollars}.`
    );
  }

  if (governanceContext) {
    parts.push(
      `Governance: ${governanceContext.pendingApprovals} pending approval gate(s), ${governanceContext.pendingDrafts} staged customer draft(s), and ${governanceContext.waitingRuns} run(s) awaiting review.`
    );
  }

  return {
    reply: parts.join('\n\n') || 'OpsPilot Copilot is online. Ask me about inventory, orders, or pending approvals.',
    model: 'opspilot-deterministic-core',
    toolsUsed,
    actionLink,
  };
}
