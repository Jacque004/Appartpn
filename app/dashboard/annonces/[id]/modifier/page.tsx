import { notFound, redirect } from "next/navigation"
import { getPropertyById } from "@/lib/actions/properties"
import { getCurrentUser } from "@/lib/actions/auth"
import { EditPropertyForm } from "@/components/edit-property-form"

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  try {
    const property = await getPropertyById(params.id)

    if (property.owner_id !== user.id) {
      redirect("/dashboard/annonces")
    }

    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Modifier l'annonce</h1>
          <p className="text-muted-foreground mt-2">Mettez à jour les informations de votre logement</p>
        </div>

        <EditPropertyForm property={property} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
