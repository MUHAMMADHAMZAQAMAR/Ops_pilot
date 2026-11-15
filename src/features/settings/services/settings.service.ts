import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';

export interface OperatorSettingsData {
  auto_approve_threshold_cents: number;
  ai_model: string;
  ai_fallback_enabled: boolean;
  notify_approvals: boolean;
  notify_runs: boolean;
  notify_drafts: boolean;
  ambient_theme: string;
}

export interface SettingsPageSummary {
  settings: OperatorSettingsData;
  tableReady: boolean;
  systemHealth: {
    supabaseConnected: boolean;
    geminiConfigured: boolean;
    operatorEmail: string;
    appPort: string;
  };
}

const DEFAULT_SETTINGS: OperatorSettingsData = {
  auto_approve_threshold_cents: 50000,
  ai_model: 'gemini-3.8-flash',
  ai_fallback_enabled: true,
  notify_approvals: true,
  notify_runs: true,
  notify_drafts: true,
  ambient_theme: 'deep-space-crystal',
};

export const getOperatorSettings = cache(async (): Promise<SettingsPageSummary> => {
  const operator = await getVerifiedOperator();
  const supabase = createAdminClient();

  let tableReady = true;
  let settings = DEFAULT_SETTINGS;

  if (operator) {
    const { data, error } = await (supabase.from('operator_settings' as any) as any)
      .select('*')
      .eq('user_id', operator.id)
      .maybeSingle();

    if (error) {
      tableReady = false;
    } else if (data) {
      settings = {
        auto_approve_threshold_cents:
          data.auto_approve_threshold_cents ?? DEFAULT_SETTINGS.auto_approve_threshold_cents,
        ai_model: data.ai_model ?? DEFAULT_SETTINGS.ai_model,
        ai_fallback_enabled: data.ai_fallback_enabled ?? DEFAULT_SETTINGS.ai_fallback_enabled,
        notify_approvals: data.notify_approvals ?? DEFAULT_SETTINGS.notify_approvals,
        notify_runs: data.notify_runs ?? DEFAULT_SETTINGS.notify_runs,
        notify_drafts: data.notify_drafts ?? DEFAULT_SETTINGS.notify_drafts,
        ambient_theme: data.ambient_theme ?? DEFAULT_SETTINGS.ambient_theme,
      };
    }
  }

  return {
    settings,
    tableReady,
    systemHealth: {
      supabaseConnected: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      operatorEmail:
        operator?.email || process.env.NEXT_PUBLIC_DEMO_OPERATOR_EMAIL || 'operator@opspilot.com',
      appPort: process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000',
    },
  };
});
