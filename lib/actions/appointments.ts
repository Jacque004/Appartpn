"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./auth"

export async function createAppointment(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Vous devez être connecté pour prendre rendez-vous" }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  const propertyId = formData.get("propertyId") as string
  const appointmentDate = formData.get("appointmentDate") as string
  const message = formData.get("message") as string

  // Get property owner
  const { data: property } = await supabase.from("properties").select("owner_id").eq("id", propertyId).single()

  if (!property) {
    return { error: "Propriété introuvable" }
  }

  const { error } = await supabase.from("appointments").insert({
    property_id: propertyId,
    tenant_id: user.id,
    owner_id: property.owner_id,
    appointment_date: appointmentDate,
    message,
    status: "pending",
  })

  if (error) {
    console.error("[v0] Error creating appointment:", error)
    return { error: "Erreur lors de la création du rendez-vous" }
  }

  revalidatePath("/dashboard/rendez-vous")
  return { success: true }
}

export async function updateAppointmentStatus(appointmentId: string, status: "confirmed" | "cancelled" | "completed") {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Non autorisé" }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { error: "La base de données n'est pas configurée" }
  }

  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId)

  if (error) {
    console.error("[v0] Error updating appointment:", error)
    return { error: "Erreur lors de la mise à jour" }
  }

  revalidatePath("/dashboard/rendez-vous")
  return { success: true }
}

export async function getAppointments() {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const supabase = await createClient()

  if (!supabase) {
    console.warn("[v0] Supabase not configured, returning empty appointments list")
    return []
  }

  const { data } = await supabase
    .from("appointments")
    .select(
      `
      *,
      property:properties(*),
      tenant:profiles!appointments_tenant_id_fkey(*),
      owner:profiles!appointments_owner_id_fkey(*)
    `,
    )
    .or(`tenant_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("appointment_date", { ascending: true })

  return data || []
}
