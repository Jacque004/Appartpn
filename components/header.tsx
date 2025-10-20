import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { getCurrentUser } from "@/lib/actions/auth"
import { UserMenu } from "@/components/user-menu"
import { MobileMenu } from "@/components/mobile-menu"

export async function Header() {
  let user = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error("[v0] Header: Failed to get current user:", error)
    // Continue without user - show login/signup buttons
  }

  const showPublishLink = user && (user.profile?.user_type === "owner" || user.profile?.user_type === "both")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">AppartPN</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/logements" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Logements
          </Link>
          <Link href="/a-propos" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            À propos
          </Link>
          <Link
            href="/comment-ca-marche"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Comment ça marche
          </Link>
          {showPublishLink && (
            <Link
              href="/dashboard/publier"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Publier une annonce
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-foreground" asChild>
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/inscription">Inscription</Link>
              </Button>
            </>
          )}
        </div>

        <MobileMenu user={user} showPublishLink={!!showPublishLink} />
      </div>
    </header>
  )
}
