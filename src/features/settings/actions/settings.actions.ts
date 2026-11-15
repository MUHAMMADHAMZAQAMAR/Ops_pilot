'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';

export async function saveOperatorSettings(formData: FormData) {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { error: 'Authentication required.' };
  }

  const thresholdDollars = Number(formData.get('thresholdDollars') || 500);
  const autoApproveThresholdCents = Math.max(0, Math.round(thresholdDollars * 100));
  const aiModel = (formData.get('aiModel') as string) || 'gemini-3.8-flash';
  const aiFallbackEnabled = formData.get('aiFallbackEnabled') === 'true';
  const notifyApprovals = formData.get('notifyApprovals') === 'true';
  const notifyRuns = formData.get('notifyRuns') === 'true';
  const notifyDrafts = formData.get('notifyDrafts') === 'true';
  const ambientTheme = (formData.get('ambientTheme') as string) || 'deep-space-crystal';

  const supabase = createAdminClient();
  const { error } = await (supabase.from('operator_settings' as any) as any).upsert(
    {
      user_id: operator.id,
      auto_approve_threshold_cents: autoApproveThresholdCents,
      ai_model: aiModel,
      ai_fallback_enabled: aiFallbackEnabled,
      notify_approvals: notifyApprovals,
      notify_runs: notifyRuns,
      notify_drafts: notifyDrafts,
      ambient_theme: ambientTheme,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return {
      error:
        'Settings table not initialized yet. Run supabase/migrations/003_operator_settings.sql in Supabase SQL Editor to persist changes.',
    };
  }

  revalidatePath('/settings');
  return { success: true };
}
