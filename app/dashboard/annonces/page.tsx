import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/auth"
import { getUserProperties } from "@/lib/actions/properties"
import { DashboardNav } from "@/components/dashboard-nav"
import { PropertyCard } from "@/components/property-card-dashboard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AnnoncesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  const properties = await getUserProperties(user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <DashboardNav />
          </aside>

          <main className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mes annonces</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos {properties.length} annonce{properties.length > 1 ? "s" : ""} publiée
                  {properties.length > 1 ? "s" : ""}
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/publier">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle annonce
                </Link>
              </Button>
            </div>

            {properties.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucune annonce</h3>
                  <p className="text-muted-foreground mb-6">
                    Vous n'avez pas encore publié d'annonce. Commencez dès maintenant à louer votre bien.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/publier">
                      <Plus className="h-4 w-4 mr-2" />
                      Publier ma première annonce
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
