import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { FiltersSidebar } from "@/components/filters-sidebar"
import { getProperties, getNeighborhoods } from "@/lib/actions/properties"

export default async function LogementsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const properties = await getProperties({
    propertyType: searchParams.type as string,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    neighborhood: searchParams.neighborhood as string,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
  })

  const neighborhoods = await getNeighborhoods()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Logements disponibles</h1>
            <p className="text-muted-foreground">{properties.length} logements trouvés</p>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar filters - Desktop */}
            <aside className="hidden lg:block">
              <FiltersSidebar neighborhoods={neighborhoods} />
            </aside>

            {/* Properties grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    type={property.property_type}
                    location={property.neighborhood}
                    price={property.price}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    area={property.surface_area}
                    image={property.images?.[0]?.image_url || "/placeholder.svg?height=300&width=400"}
                    available={property.is_available}
                  />
                ))}
              </div>

              {properties.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">Aucun logement trouvé avec ces critères.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
