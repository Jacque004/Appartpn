"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Property } from "@/lib/supabase/types"

export async function getProperties(filters?: {
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  neighborhood?: string
  bedrooms?: number
}) {
  const supabase = await createClient()

  if (!supabase) {
    console.warn("[v0] Supabase not configured, returning empty properties list")
    return []
  }

  let query = supabase
    .from("properties")
    .select(`
      *,
      owner:profiles!properties_owner_id_fkey(id, full_name, phone, avatar_url),
      images:property_images(*),
      amenities:property_amenities(*)
    `)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  if (filters?.propertyType && filters.propertyType !== "all") {
    query = query.eq("property_type", filters.propertyType)
  }

  if (filters?.minPrice) {
    query = query.gte("price", filters.minPrice)
  }

  if (filters?.maxPrice) {
    query = query.lte("price", filters.maxPrice)
  }

  if (filters?.neighborhood && filters.neighborhood !== "all") {
    query = query.eq("neighborhood", filters.neighborhood)
  }

  if (filters?.bedrooms) {
    query = query.gte("bedrooms", filters.bedrooms)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching properties:", error)
    throw new Error("Failed to fetch properties")
  }

  return data as Property[]
}

export async function getPropertyById(id: string) {
  const supabase = await createClient()

  if (!supabase) {
    console.warn("[v0] Supabase not configured")
    throw new Error("Database not configured")
  }

  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      owner:profiles!properties_owner_id_fkey(id, full_name, phone, avatar_url),
      images:property_images(*),
      amenities:property_amenities(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching property:", error)
    throw new Error("Failed to fetch property")
  }

  return data as Property
}

export async function getNeighborhoods() {
  const supabase = await createClient()

  if (!supabase) {
    console.warn("[v0] Supabase not configured, returning empty neighborhoods list")
    return []
  }

  const { data, error } = await supabase.from("properties").select("neighborhood").order("neighborhood")

  if (error) {
    console.error("[v0] Error fetching neighborhoods:", error)
    return []
  }

  // Get unique neighborhoods
  const neighborhoods = [...new Set(data.map((item) => item.neighborhood))]
  return neighborhoods
}

export async function publishProperty(formData: FormData) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  const userId = formData.get("userId") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const propertyType = formData.get("propertyType") as string
  const price = Number(formData.get("price"))
  const bedrooms = Number(formData.get("bedrooms"))
  const bathrooms = Number(formData.get("bathrooms"))
  const surfaceArea = Number(formData.get("surfaceArea"))
  const address = formData.get("address") as string
  const neighborhood = formData.get("neighborhood") as string
  const amenities = formData.get("amenities") as string
  const virtualTourUrl = formData.get("virtualTourUrl") as string

  if (!userId || !title || !description || !propertyType || !price || !address || !neighborhood) {
    return { error: "Tous les champs obligatoires doivent être remplis" }
  }

  if (price <= 0 || bedrooms < 0 || bathrooms < 0 || surfaceArea <= 0) {
    return { error: "Les valeurs numériques doivent être positives" }
  }

  try {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        owner_id: userId,
        title,
        description,
        property_type: propertyType,
        price,
        bedrooms,
        bathrooms,
        surface_area: surfaceArea,
        address,
        neighborhood,
        city: "Pointe-Noire",
        virtual_tour_url: virtualTourUrl || null,
      })
      .select()
      .single()

    if (propertyError) {
      console.error("[v0] Property creation error:", propertyError)
      return { error: "Erreur lors de la création de l'annonce" }
    }

    const imageFiles = formData.getAll("images") as File[]
    if (imageFiles.length > 0) {
      const imageUrls: { url: string; isPrimary: boolean; order: number }[] = []
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"]

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        if (file.size === 0) continue

        if (file.size > MAX_FILE_SIZE) {
          console.warn(`[v0] File ${file.name} exceeds size limit`)
          continue
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          console.warn(`[v0] File ${file.name} has invalid type: ${file.type}`)
          continue
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${property.id}/${Date.now()}-${i}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Image upload error:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName)

        imageUrls.push({
          url: publicUrl,
          isPrimary: i === 0,
          order: i,
        })
      }

      if (imageUrls.length > 0) {
        const imagesData = imageUrls.map((img) => ({
          property_id: property.id,
          image_url: img.url,
          is_primary: img.isPrimary,
          display_order: img.order,
        }))

        const { error: imagesError } = await supabase.from("property_images").insert(imagesData)

        if (imagesError) {
          console.error("[v0] Images creation error:", imagesError)
        }
      }
    }

    if (amenities) {
      try {
        const amenitiesList = JSON.parse(amenities) as string[]
        if (amenitiesList.length > 0) {
          const amenitiesData = amenitiesList.map((amenity) => ({
            property_id: property.id,
            amenity,
          }))

          const { error: amenitiesError } = await supabase.from("property_amenities").insert(amenitiesData)

          if (amenitiesError) {
            console.error("[v0] Amenities creation error:", amenitiesError)
          }
        }
      } catch (parseError) {
        console.error("[v0] Error parsing amenities:", parseError)
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/annonces")
    revalidatePath("/logements")
    return { success: true, propertyId: property.id }
  } catch (error) {
    console.error("[v0] Error publishing property:", error)
    return { error: "Une erreur est survenue lors de la publication" }
  }
}

export async function getUserProperties(userId: string) {
  const supabase = await createClient()

  if (!supabase) {
    console.warn("[v0] Supabase not configured, returning empty properties list")
    return []
  }

  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      images:property_images(*),
      amenities:property_amenities(*),
      appointments:appointments(id, status)
    `)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user properties:", error)
    throw new Error("Failed to fetch user properties")
  }

  return data
}

export async function updatePropertyStatus(propertyId: string, isAvailable: boolean) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  if (!propertyId) {
    return { error: "ID de propriété invalide" }
  }

  const { error } = await supabase
    .from("properties")
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq("id", propertyId)

  if (error) {
    console.error("[v0] Error updating property status:", error)
    return { error: "Erreur lors de la mise à jour du statut" }
  }

  revalidatePath("/dashboard/annonces")
  revalidatePath("/logements")
  return { success: true }
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  if (!propertyId) {
    return { error: "ID de propriété invalide" }
  }

  try {
    await supabase.from("property_images").delete().eq("property_id", propertyId)
    await supabase.from("property_amenities").delete().eq("property_id", propertyId)
    await supabase.from("appointments").delete().eq("property_id", propertyId)
    await supabase.from("favorites").delete().eq("property_id", propertyId)

    const { error } = await supabase.from("properties").delete().eq("id", propertyId)

    if (error) {
      console.error("[v0] Error deleting property:", error)
      return { error: "Erreur lors de la suppression de l'annonce" }
    }

    revalidatePath("/dashboard/annonces")
    revalidatePath("/logements")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in delete cascade:", error)
    return { error: "Erreur lors de la suppression de l'annonce" }
  }
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const propertyType = formData.get("propertyType") as string
  const price = Number(formData.get("price"))
  const bedrooms = Number(formData.get("bedrooms"))
  const bathrooms = Number(formData.get("bathrooms"))
  const surfaceArea = Number(formData.get("surfaceArea"))
  const address = formData.get("address") as string
  const neighborhood = formData.get("neighborhood") as string
  const amenities = formData.get("amenities") as string
  const virtualTourUrl = formData.get("virtualTourUrl") as string

  if (!title || !description || !propertyType || !price || !address || !neighborhood) {
    return { error: "Tous les champs obligatoires doivent être remplis" }
  }

  if (price <= 0 || bedrooms < 0 || bathrooms < 0 || surfaceArea <= 0) {
    return { error: "Les valeurs numériques doivent être positives" }
  }

  try {
    const { error: propertyError } = await supabase
      .from("properties")
      .update({
        title,
        description,
        property_type: propertyType,
        price,
        bedrooms,
        bathrooms,
        surface_area: surfaceArea,
        address,
        neighborhood,
        virtual_tour_url: virtualTourUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId)

    if (propertyError) {
      console.error("[v0] Property update error:", propertyError)
      return { error: "Erreur lors de la mise à jour de l'annonce" }
    }

    const imageFiles = formData.getAll("images") as File[]
    if (imageFiles.length > 0) {
      const imageUrls: { url: string; isPrimary: boolean; order: number }[] = []
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"]

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        if (file.size === 0) continue

        if (file.size > MAX_FILE_SIZE) {
          console.warn(`[v0] File ${file.name} exceeds size limit`)
          continue
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          console.warn(`[v0] File ${file.name} has invalid type: ${file.type}`)
          continue
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${propertyId}/${Date.now()}-${i}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Image upload error:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName)

        imageUrls.push({
          url: publicUrl,
          isPrimary: i === 0,
          order: i,
        })
      }

      if (imageUrls.length > 0) {
        const imagesData = imageUrls.map((img) => ({
          property_id: propertyId,
          image_url: img.url,
          is_primary: img.isPrimary,
          display_order: img.order,
        }))

        const { error: imagesError } = await supabase.from("property_images").insert(imagesData)

        if (imagesError) {
          console.error("[v0] Images creation error:", imagesError)
        }
      }
    }

    if (amenities) {
      try {
        const amenitiesList = JSON.parse(amenities) as string[]

        // Supprimer les anciens équipements
        await supabase.from("property_amenities").delete().eq("property_id", propertyId)

        // Ajouter les nouveaux équipements
        if (amenitiesList.length > 0) {
          const amenitiesData = amenitiesList.map((amenity) => ({
            property_id: propertyId,
            amenity,
          }))

          const { error: amenitiesError } = await supabase.from("property_amenities").insert(amenitiesData)

          if (amenitiesError) {
            console.error("[v0] Amenities update error:", amenitiesError)
          }
        }
      } catch (parseError) {
        console.error("[v0] Error parsing amenities:", parseError)
      }
    }

    revalidatePath("/dashboard/annonces")
    revalidatePath(`/logements/${propertyId}`)
    revalidatePath("/logements")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating property:", error)
    return { error: "Une erreur est survenue lors de la mise à jour" }
  }
}

export async function deletePropertyImage(imageId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  const { error } = await supabase.from("property_images").delete().eq("id", imageId)

  if (error) {
    console.error("[v0] Error deleting image:", error)
    return { error: "Erreur lors de la suppression de l'image" }
  }

  return { success: true }
}
