import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next()

  // Get auth tokens from cookies
  const accessToken = request.cookies.get("sb-access-token")?.value
  const refreshToken = request.cookies.get("sb-refresh-token")?.value

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      },
    },
  )

  let user = null

  try {
    // Try to get the current user
    if (accessToken) {
      const { data } = await supabase.auth.getUser(accessToken)
      user = data.user
    } else if (refreshToken) {
      // Try to refresh the session
      const { data } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
      user = data.user

      // Update cookies with new tokens
      if (data.session) {
        response.cookies.set("sb-access-token", data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
        })
        response.cookies.set("sb-refresh-token", data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      }
    }
  } catch (error) {
    // Clear invalid cookies
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")
  }

  const { pathname } = request.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/connexion"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/connexion" || pathname === "/inscription") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return response
}
