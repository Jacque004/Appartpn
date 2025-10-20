import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { checkDatabaseSetup } from "@/lib/actions/setup"
import { Header } from "@/components/header"
import { DashboardNav } from "@/components/dashboard-nav"
import { StatsCards } from "@/components/stats-cards"
import { PropertiesList } from "@/components/properties-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  const { isSetup } = await checkDatabaseSetup()
  if (!isSetup) {
    redirect("/setup")
  }

  const supabase = await createClient()

  let properties = []
  let appointmentsCount = 0

  if (supabase) {
    const { data: propertiesData, error: propertiesError } = await supabase
      .from("properties")
      .select("*, images:property_images(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("[v0] Properties fetch error:", propertiesError.message)
    } else {
      properties = propertiesData || []
    }

    const { count, error: countError } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "pending")

    if (countError) {
      console.error("[v0] Appointments count error:", countError.message)
    } else {
      appointmentsCount = count || 0
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <DashboardNav />
            </aside>

            <main className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
                  <p className="text-muted-foreground mt-1">Bienvenue, {user.profile?.full_name || user.email}</p>
                </div>
                {(user.profile?.user_type === "owner" || user.profile?.user_type === "both") && (
                  <Button asChild>
                    <Link href="/dashboard/publier">
                      <Plus className="h-4 w-4 mr-2" />
                      Publier une annonce
                    </Link>
                  </Button>
                )}
              </div>

              <StatsCards
                propertiesCount={properties?.length || 0}
                appointmentsCount={appointmentsCount || 0}
                viewsCount={0}
              />

              {(user.profile?.user_type === "owner" || user.profile?.user_type === "both") && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Mes annonces</h2>
                  <PropertiesList properties={properties || []} />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
