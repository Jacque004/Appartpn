"use server"

import { revalidatePath } from "next/cache"
import { headers, cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "Supabase is not configured. Please set up the integration first." }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const userType = formData.get("userType") as string

  const headersList = headers()
  const origin = headersList.get("origin") || headersList.get("referer")?.split("/").slice(0, 3).join("/") || ""
  const redirectUrl = `${origin}/dashboard`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        phone,
        user_type: userType,
      },
    },
  })

  if (error) {
    console.error("[v0] Sign up error:", error.message)
    if (error.message.includes("rate_limit")) {
      return { error: "Trop de tentatives. Veuillez attendre quelques secondes avant de réessayer." }
    }
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true, redirectTo: "/dashboard" }
}

export async function signIn(formData: FormData) {
  console.log("[v0] signIn: Starting sign in process")

  const supabase = await createClient()

  if (!supabase) {
    console.log("[v0] signIn: Supabase not configured")
    return { error: "Supabase is not configured. Please set up the integration first." }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[v0] signIn: Attempting to sign in with email:", email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("[v0] signIn: Authentication error:", error.message)
    if (error.message.includes("Email not confirmed")) {
      return { error: "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception." }
    }
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email ou mot de passe incorrect." }
    }
    return { error: "Erreur de connexion. Veuillez réessayer." }
  }

  console.log("[v0] signIn: Authentication successful, user ID:", data.user?.id)

  // Écrire les cookies de session pour que le middleware les détecte
  try {
    const session = data.session
    if (session) {
      const cookieStore = await cookies()
      const isProd = process.env.NODE_ENV === "production"

      // Access token: durée = expires_in (secondes)
      cookieStore.set("sb-access-token", session.access_token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: session.expires_in ?? 60 * 60, // fallback 1h
      })

      // Refresh token: durée plus longue (ex: 60 jours)
      cookieStore.set("sb-refresh-token", session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 60, // 60 jours
      })
    }
  } catch (err) {
    console.error("[v0] signIn: unable to set auth cookies", err)
  }

  revalidatePath("/", "layout")

  const result = { success: true, redirectTo: "/dashboard" }
  console.log("[v0] signIn: Returning result:", result)

  return result
}

export async function signOut() {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "Supabase is not configured." }
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("[v0] Sign out error:", error)
    return { error: error.message }
  }

  // Supprimer les cookies côté serveur
  try {
    const cookieStore = await cookies()
    cookieStore.delete("sb-access-token")
    cookieStore.delete("sb-refresh-token")
  } catch (err) {
    console.error("[v0] signOut: unable to delete auth cookies", err)
  }

  revalidatePath("/", "layout")
  return { success: true, redirectTo: "/" }
}

export async function getCurrentUser() {
  const supabase = await createClient()

  if (!supabase) {
    return null
  }

  let user = null
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    user = authUser
  } catch (err) {
    return null
  }

  if (!user) {
    return null
  }

  let profileData = null
  try {
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

    if (!profileError) {
      profileData = data
    }
  } catch (err) {
    // Silencieusement ignorer les erreurs de profil
  }

  return {
    ...user,
    profile: profileData,
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "Supabase is not configured." }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Vous devez être connecté pour modifier votre profil." }
  }

  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const userType = formData.get("userType") as string
  const avatarUrl = formData.get("avatarUrl") as string

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      user_type: userType,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    console.error("[v0] Profile update error:", error.message)
    return { error: "Erreur lors de la mise à jour du profil." }
  }

  revalidatePath("/dashboard/profil")
  return { success: true }
}
