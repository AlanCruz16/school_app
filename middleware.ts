// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    request.cookies.delete({
                        name,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.delete({
                        name,
                        ...options,
                    })
                },
            },
        }
    )

    // Use getUser() instead of getSession() for better security
    const { data: { user }, error } = await supabase.auth.getUser()

    // Check if the route is protected
    const isAuthRoute = request.nextUrl.pathname.startsWith('/(auth)') ||
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/students') ||
        request.nextUrl.pathname.startsWith('/tutors') ||
        request.nextUrl.pathname.startsWith('/payments') ||
        request.nextUrl.pathname.startsWith('/calendar') ||
        request.nextUrl.pathname.startsWith('/grades') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname === '/'

    const isLoginPage = request.nextUrl.pathname === '/login'

    // If user is not authenticated and the route requires authentication, redirect to /login
    if (!user && isAuthRoute && !isLoginPage) {
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and they're accessing the login page, redirect to /dashboard
    if (user && isLoginPage) {
        const redirectUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}