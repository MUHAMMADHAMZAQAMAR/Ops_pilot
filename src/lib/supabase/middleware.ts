import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user: { id: string; email: string } | null = null;

  try {
    // 1. Fast path: verify JWT signature locally via cached JWKS public key (0ms)
    const { data: claimsData } = await supabase.auth.getClaims();
    if (claimsData?.claims?.sub) {
      user = {
        id: claimsData.claims.sub as string,
        email: (claimsData.claims.email as string | undefined) ?? '',
      };
    }
  } catch {
    // ignore and fallback
  }

  // 2. Fallback path: if claims are missing or token needs refresh, call getUser()
  if (!user) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        user = {
          id: userData.user.id,
          email: userData.user.email ?? '',
        };
      }
    } catch {
      // user is unauthenticated
    }
  }

  const isProtectedPath =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/requests') ||
    request.nextUrl.pathname.startsWith('/runs') ||
    request.nextUrl.pathname.startsWith('/approvals') ||
    request.nextUrl.pathname.startsWith('/drafts') ||
    request.nextUrl.pathname.startsWith('/automation') ||
    request.nextUrl.pathname.startsWith('/orders') ||
    request.nextUrl.pathname.startsWith('/inventory') ||
    request.nextUrl.pathname.startsWith('/customers') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/settings');

  // Redirect unauthenticated operators to /login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated operators away from login page to /dashboard
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Pass user info into request headers so server components do not need an extra auth API call
  if (user) {
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    // Preserve any session cookies that were set
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      nextResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return nextResponse;
  }

  return supabaseResponse;
}
