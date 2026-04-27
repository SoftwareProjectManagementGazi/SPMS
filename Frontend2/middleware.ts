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
  ],
}
