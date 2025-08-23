import { NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/setup',
  '/unauthorized',
  '/guest',
  '/guest/assets',
  '/api/guest'
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/assets',
  '/requests',
  '/dashboard',
  '/api/notifications'
]

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin'
]

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  // Allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/guest')
  ) {
    return response
  }

  // DEBUG: Log all cookies for investigation
  console.log('🔍 MIDDLEWARE DEBUG - All cookies:', Object.fromEntries(
    Array.from(request.cookies.getAll()).map(cookie => [cookie.name, cookie.value.substring(0, 50) + '...'])
  ))

  // Get session cookie (Appwrite session) - check multiple possible cookie names
  // Modern Appwrite uses pattern: a_session_<PROJECT_ID>
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const modernSessionCookie = request.cookies.get(`a_session_${projectId}`)
  const legacySessionCookie = request.cookies.get(`a_session_${projectId}_legacy`)
  
  // Fallback checks for older patterns (for compatibility)
  const legacySession = request.cookies.get('a_session_console_legacy')
  const consoleSession = request.cookies.get('a_session_console')  
  const standardSession = request.cookies.get('a_session')

  // DEBUG: Log each session cookie check
  console.log('🔍 MIDDLEWARE DEBUG - Session cookie checks:', {
    pathname,
    projectId,
    modernSessionCookie: modernSessionCookie?.value ? `Found: ${modernSessionCookie.value.substring(0, 30)}...` : 'Not found',
    legacySessionCookie: legacySessionCookie?.value ? `Found: ${legacySessionCookie.value.substring(0, 30)}...` : 'Not found',
    legacySession: legacySession?.value ? `Found: ${legacySession.value.substring(0, 30)}...` : 'Not found',
    consoleSession: consoleSession?.value ? `Found: ${consoleSession.value.substring(0, 30)}...` : 'Not found',
    standardSession: standardSession?.value ? `Found: ${standardSession.value.substring(0, 30)}...` : 'Not found'
  })

  // Priority order: modern pattern first, then legacy patterns
  const session = modernSessionCookie || legacySessionCookie || legacySession || consoleSession || standardSession

  const isAuthenticated = !!session
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  // DEBUG: Log authentication status and route classification
  console.log('🔍 MIDDLEWARE DEBUG - Authentication check:', {
    pathname,
    isAuthenticated,
    sessionFound: !!session,
    sessionCookieName: session?.name || 'none',
    isPublicRoute,
    isProtectedRoute,
    timestamp: new Date().toISOString()
  })
  
  // Handle root redirect
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('🔍 MIDDLEWARE DEBUG - Redirecting authenticated user from root to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      console.log('🔍 MIDDLEWARE DEBUG - Redirecting unauthenticated user from root to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Prevent authenticated users from accessing login page
  if (pathname === '/login' && isAuthenticated) {
    console.log('🔍 MIDDLEWARE DEBUG - Preventing authenticated user from accessing login, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users from protected routes to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    // Store the intended URL as a callback parameter
    if (pathname !== '/login') {
      loginUrl.searchParams.set('callback', pathname + request.nextUrl.search)
    }
    console.log('🔍 MIDDLEWARE DEBUG - Redirecting unauthenticated user from protected route to login:', {
      from: pathname,
      to: loginUrl.toString(),
      callback: loginUrl.searchParams.get('callback')
    })
    return NextResponse.redirect(loginUrl)
  }

  console.log('🔍 MIDDLEWARE DEBUG - Allowing request to proceed:', {
    pathname,
    isAuthenticated,
    isPublicRoute,
    isProtectedRoute
  })

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}