import { cache } from 'react';
import { createClient } from './server';

export interface VerifiedOperator {
  id: string;
  email: string;
}

/**
 * Fast, once-per-request operator verification.
 * Uses local JWKS JWT verification (`getClaims()`) in ~0ms so button clicks
 * do not make redundant network round-trips to Supabase Auth `/user`.
 */
export const getVerifiedOperator = cache(async (): Promise<VerifiedOperator | null> => {
  const supabase = await createClient();

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    if (claimsData?.claims?.sub) {
      return {
        id: claimsData.claims.sub as string,
        email: (claimsData.claims.email as string | undefined) ?? '',
      };
    }
  } catch {
    // Fallback to getUser if local claims check fails
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email ?? '',
      };
    }
  } catch {
    // Unauthenticated
  }

  return null;
});
