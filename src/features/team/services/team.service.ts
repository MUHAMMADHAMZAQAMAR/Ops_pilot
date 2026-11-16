import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';

export type OperatorRoleType = 'admin' | 'operator' | 'auditor';

export interface TeamMember {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: OperatorRoleType;
  department: string;
  approval_limit_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface TeamDirectorySummary {
  members: TeamMember[];
  tableReady: boolean;
  currentOperatorEmail: string;
  metrics: {
    totalMembers: number;
    adminsCount: number;
    operatorsCount: number;
    auditorsCount: number;
  };
}

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'team-default-1',
    user_id: null,
    email: 'operator@opspilot.com',
    full_name: 'Alex Henderson',
    role: 'admin',
    department: 'Executive Operations',
    approval_limit_cents: 1000000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team-default-2',
    user_id: null,
    email: 'sarah.jenkins@opspilot.com',
    full_name: 'Sarah Jenkins',
    role: 'operator',
    department: 'Inventory & Supply',
    approval_limit_cents: 50000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team-default-3',
    user_id: null,
    email: 'marcus.vance@opspilot.com',
    full_name: 'Marcus Vance',
    role: 'auditor',
    department: 'Compliance & Risk',
    approval_limit_cents: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const getTeamDirectory = cache(async (): Promise<TeamDirectorySummary> => {
  const [operator, supabase] = await Promise.all([
    getVerifiedOperator(),
    Promise.resolve(createAdminClient()),
  ]);

  const { data, error } = await (supabase.from('operator_roles' as any) as any)
    .select('*')
    .order('created_at', { ascending: true });

  const tableReady = !error;
  const members: TeamMember[] =
    !error && Array.isArray(data) && data.length > 0 ? (data as TeamMember[]) : DEFAULT_TEAM;

  const adminsCount = members.filter((m) => m.role === 'admin' && m.is_active).length;
  const operatorsCount = members.filter((m) => m.role === 'operator' && m.is_active).length;
  const auditorsCount = members.filter((m) => m.role === 'auditor' && m.is_active).length;

  return {
    members,
    tableReady,
    currentOperatorEmail:
      operator?.email || process.env.NEXT_PUBLIC_DEMO_OPERATOR_EMAIL || 'operator@opspilot.com',
    metrics: {
      totalMembers: members.length,
      adminsCount,
      operatorsCount,
      auditorsCount,
    },
  };
});
