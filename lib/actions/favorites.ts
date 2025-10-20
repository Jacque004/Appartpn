"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getUserFavorites(userId: string) {
  try {
    const supabase = await createClient()

    const { data: favorites, error } = await supabase
      .from("favorites")
      .select(
        `
        id,
        created_at,
        property_id,
        properties (
          id,
          title,
          description,
          property_type,
          price,
          bedrooms,
          bathrooms,
          surface_area,
          address,
          neighborhood,
          city,
          is_available,
          property_images (
            image_url,
            is_primary,
            display_order
          )
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching favorites:", error)
      return []
    }

    // Transform the data to flatten the structure
    return (
      favorites?.map((fav: any) => ({
        favoriteId: fav.id,
        createdAt: fav.created_at,
        ...fav.properties,
        images: fav.properties.property_images || [],
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error in getUserFavorites:", error)
    return []
  }
}

export async function addToFavorites(userId: string, propertyId: string) {
  try {
    const supabase = await createClient()

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .single()

    if (existing) {
      return { success: false, error: "Déjà dans vos favoris" }
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      property_id: propertyId,
    })

    if (error) {
      console.error("[v0] Error adding to favorites:", error)
      return { success: false, error: "Erreur lors de l'ajout aux favoris" }
    }

    revalidatePath("/dashboard/favoris")
    revalidatePath("/logements")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addToFavorites:", error)
    return { success: false, error: "Erreur lors de l'ajout aux favoris" }
  }
}

export async function removeFromFavorites(userId: string, favoriteId: string) {
  try {
    const supabase = await createClient()

    // Verify ownership before deleting
    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId).eq("user_id", userId)

    if (error) {
      console.error("[v0] Error removing from favorites:", error)
      return { success: false, error: "Erreur lors de la suppression" }
    }

    revalidatePath("/dashboard/favoris")
    revalidatePath("/logements")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in removeFromFavorites:", error)
    return { success: false, error: "Erreur lors de la suppression" }
  }
}

export async function isFavorite(userId: string, propertyId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error checking favorite:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("[v0] Error in isFavorite:", error)
    return false
  }
}
