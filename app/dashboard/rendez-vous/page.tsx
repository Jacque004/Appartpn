import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/auth"
import { getAppointments } from "@/lib/actions/appointments"
import { Header } from "@/components/header"
import { DashboardNav } from "@/components/dashboard-nav"
import { AppointmentsList } from "@/components/appointments-list"

export default async function RendezVousPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  const appointments = await getAppointments()

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <DashboardNav />
            </aside>

            <main className="lg:col-span-3">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Mes rendez-vous</h1>
                <p className="text-muted-foreground mt-1">Gérez vos rendez-vous de visite</p>
              </div>

              <AppointmentsList appointments={appointments} currentUserId={user.id} />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
