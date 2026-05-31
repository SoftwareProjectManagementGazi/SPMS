import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get('auth_session')
  if (!cookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  // CRITICAL: list actual URL paths — (shell) route group parentheses are invisible in URLs
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/my-tasks/:path*',
    '/reports/:path*',
    '/teams/:path*',
    '/admin/:path*',  // Phase 14 Plan 14-02 — admin route guard at edge (Pitfall 10)
    // M-A1 (Wave C) — these (shell) routes were previously unguarded: an
    // anonymous deep-link mounted the shell and only fell over on a per-request
    // 401. Adding them closes the edge-auth gap (open-allowlist style preserved).
    '/users/:path*',
    '/tasks/:path*',
    '/notifications/:path*',
    '/workflow-editor/:path*',
    '/search/:path*',  // /search route introduced in M-A2
  ],
}
