import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only run auth middleware where it matters (protected pages + login redirect).
  // The landing page, static assets and API health skip it entirely.
  matcher: [
    '/dashboard/:path*',
    '/requests/:path*',
    '/runs/:path*',
    '/approvals/:path*',
    '/drafts/:path*',
    '/orders/:path*',
    '/inventory/:path*',
    '/customers/:path*',
    '/analytics/:path*',
    '/login',
  ],
};

