"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import Link from "next/link"

type LoginAction = (
  prevState: { error: string | null; success?: boolean; redirectTo?: string },
  formData: FormData,
) => Promise<{ error: string | null; success?: boolean; redirectTo?: string } | void>

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Connexion..." : "Se connecter"}
    </Button>
  )
}

export function LoginForm({ action }: { action: LoginAction }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, { error: null })

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state?.success, state?.redirectTo, router])

  return (
    <div className="bg-card rounded-lg border border-border p-8">
      <form action={formAction} className="space-y-6">
        {state?.error && (
          <Alert variant="destructive">
            <p className="text-sm">{state.error}</p>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="votre@email.com" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>

        <SubmitButton pending={isPending} />

        <div className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary hover:underline">
            S'inscrire
          </Link>
        </div>
      </form>
    </div>
  )
}
