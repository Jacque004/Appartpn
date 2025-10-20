"use server"

import { createClient } from "@/lib/supabase/server"

export async function setupDatabase() {
  try {
    const supabase = await createClient()

    // Create profiles table
    const { error: profilesError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT,
          user_type TEXT CHECK (user_type IN ('tenant', 'owner', 'both')),
          phone TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    })

    if (profilesError) {
      console.error("[v0] Profiles table creation error:", profilesError)
    }

    // Create neighborhoods table
    const { error: neighborhoodsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS neighborhoods (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    })

    if (neighborhoodsError) {
      console.error("[v0] Neighborhoods table creation error:", neighborhoodsError)
    }

    // Create properties table
    const { error: propertiesError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS properties (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT CHECK (type IN ('villa', 'apartment', 'studio')),
          price DECIMAL(10, 2) NOT NULL,
          bedrooms INTEGER,
          bathrooms INTEGER,
          surface_area DECIMAL(10, 2),
          neighborhood_id INTEGER REFERENCES neighborhoods(id),
          address TEXT,
          images TEXT[],
          amenities TEXT[],
          available BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    })

    if (propertiesError) {
      console.error("[v0] Properties table creation error:", propertiesError)
    }

    // Create appointments table
    const { error: appointmentsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
          tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          appointment_date TIMESTAMPTZ NOT NULL,
          message TEXT,
          status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    })

    if (appointmentsError) {
      console.error("[v0] Appointments table creation error:", appointmentsError)
    }

    // Insert neighborhoods
    const { error: seedError } = await supabase
      .from("neighborhoods")
      .upsert(
        [
          { name: "Centre-ville" },
          { name: "Mpita" },
          { name: "Tié-Tié" },
          { name: "Loandjili" },
          { name: "Ngoyo" },
          { name: "Mongo-Mpoukou" },
          { name: "Vindoulou" },
          { name: "Tchimbamba" },
        ],
        { onConflict: "name", ignoreDuplicates: true },
      )

    if (seedError) {
      console.error("[v0] Seed data error:", seedError)
    }

    return { success: true, message: "Base de données initialisée avec succès!" }
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return { success: false, message: "Erreur lors de l'initialisation de la base de données." }
  }
}

export async function checkDatabaseSetup() {
  try {
    const supabase = await createClient()

    // Try to query the profiles table
    const { error } = await supabase.from("profiles").select("id").limit(1)

    // If error exists and it's a "table not found" error, return false
    if (error) {
      // PGRST205 is the error code for "table not found"
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        return { isSetup: false }
      }
      // For other errors, log them but still return false
      console.error("[v0] Database check error:", error)
      return { isSetup: false }
    }

    // If no error, tables exist
    return { isSetup: true }
  } catch (error) {
    console.error("[v0] Database check exception:", error)
    return { isSetup: false }
  }
}
