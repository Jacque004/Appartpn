import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/auth"
import { getUserFavorites } from "@/lib/actions/favorites"
import { DashboardNav } from "@/components/dashboard-nav"
import { FavoriteCard } from "@/components/favorite-card"
import { Heart } from "lucide-react"

export default async function FavorisPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  const favorites = await getUserFavorites(user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <DashboardNav />
          </aside>

          <main className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">Mes favoris</h1>
              <p className="text-muted-foreground mt-1">
                {favorites.length} logement{favorites.length > 1 ? "s" : ""} sauvegardé
                {favorites.length > 1 ? "s" : ""}
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucun favori</h3>
                  <p className="text-muted-foreground mb-6">
                    Vous n'avez pas encore ajouté de logement à vos favoris. Parcourez nos annonces et sauvegardez
                    celles qui vous intéressent.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites.map((favorite: any) => (
                  <FavoriteCard key={favorite.favoriteId} favorite={favorite} userId={user.id} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
