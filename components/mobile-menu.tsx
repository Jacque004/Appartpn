"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileMenuProps {
  user: any
  showPublishLink: boolean
}

export function MobileMenu({ user, showPublishLink }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMenu} />

          {/* Menu panel */}
          <div className="fixed top-16 left-0 right-0 bg-background border-b border-border z-50 md:hidden">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link
                href="/logements"
                className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={closeMenu}
              >
                Logements
              </Link>
              <Link
                href="/a-propos"
                className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={closeMenu}
              >
                À propos
              </Link>
              <Link
                href="/comment-ca-marche"
                className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={closeMenu}
              >
                Comment ça marche
              </Link>
              {showPublishLink && (
                <Link
                  href="/dashboard/publier"
                  className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  onClick={closeMenu}
                >
                  Publier une annonce
                </Link>
              )}

              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={closeMenu}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Mon Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard/profil" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full">
                        Mon Profil
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/connexion" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/inscription" onClick={closeMenu}>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Inscription
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
