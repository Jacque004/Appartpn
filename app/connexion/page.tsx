import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login-form"
import { signIn } from "@/lib/actions/auth"

export default function ConnexionPage() {
  const handleSignIn = async (_prevState: unknown, formData: FormData) => {
    return await signIn(formData)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Connexion</h1>
            <p className="text-muted-foreground">Connectez-vous à votre compte AppartPN</p>
          </div>

          <LoginForm action={handleSignIn} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
