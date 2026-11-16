'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { OperatorRoleType } from '../services/team.service';

export async function inviteTeamMember(formData: FormData) {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { error: 'Authentication required.' };
  }

  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = ((formData.get('role') as string) || 'operator') as OperatorRoleType;
  const department = (formData.get('department') as string)?.trim() || 'Operations';

  if (!fullName || !email || !email.includes('@')) {
    return { error: 'Please provide a valid name and email address.' };
  }

  const approvalLimitCents =
    role === 'admin' ? 1000000 : role === 'operator' ? 50000 : 0;

  const supabase = createAdminClient();
  const { error } = await (supabase.from('operator_roles' as any) as any).insert({
    full_name: fullName,
    email,
    role,
    department,
    approval_limit_cents: approvalLimitCents,
    is_active: true,
  });

  if (error) {
    return {
      error:
        'Team RBAC table not initialized yet. Run supabase/migrations/004_team_rbac.sql in Supabase SQL Editor.',
    };
  }

  revalidatePath('/team');
  return { success: true };
}

export async function updateMemberRole(memberId: string, role: OperatorRoleType) {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { error: 'Authentication required.' };
  }

  if (memberId.startsWith('team-default-')) {
    return {
      error: 'Default preview roster cannot be modified until 004_team_rbac.sql is applied.',
    };
  }

  const approvalLimitCents =
    role === 'admin' ? 1000000 : role === 'operator' ? 50000 : 0;

  const supabase = createAdminClient();
  const { error } = await (supabase.from('operator_roles' as any) as any)
    .update({ role, approval_limit_cents: approvalLimitCents })
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}

export async function toggleMemberStatus(memberId: string, nextActive: boolean) {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { error: 'Authentication required.' };
  }

  if (memberId.startsWith('team-default-')) {
    return {
      error: 'Default preview roster cannot be modified until 004_team_rbac.sql is applied.',
    };
  }

  const supabase = createAdminClient();
  const { error } = await (supabase.from('operator_roles' as any) as any)
    .update({ is_active: nextActive })
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}
