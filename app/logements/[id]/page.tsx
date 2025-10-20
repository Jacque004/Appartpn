import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PropertyGallery } from "@/components/property-gallery"
import { PropertyInfo } from "@/components/property-info"
import { PropertyAmenities } from "@/components/property-amenities"
import { PropertyLocation } from "@/components/property-location"
import { BookingCard } from "@/components/booking-card"
import { OwnerCard } from "@/components/owner-card"
import { notFound } from "next/navigation"
import { getPropertyById } from "@/lib/actions/properties"

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
  let property
  try {
    property = await getPropertyById(params.id)
  } catch (error) {
    notFound()
  }

  if (!property) {
    notFound()
  }

  const images = property.images?.map((img) => img.image_url) || []
  const amenities = property.amenities?.map((a) => a.amenity) || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{property.title}</h1>
            <p className="text-muted-foreground">{property.address}</p>
          </div>

          {/* Gallery */}
          <PropertyGallery images={images} title={property.title} />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left column - Property details */}
            <div className="lg:col-span-2 space-y-8">
              <PropertyInfo
                type={property.property_type}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.surface_area}
                description={property.description || ""}
              />

              <PropertyAmenities amenities={amenities} />

              <PropertyLocation
                address={property.address}
                coordinates={
                  property.latitude && property.longitude
                    ? { lat: property.latitude, lng: property.longitude }
                    : undefined
                }
              />
            </div>

            {/* Right column - Booking and owner */}
            <div className="space-y-6">
              <BookingCard price={property.price} available={property.is_available} propertyId={property.id} />

              <OwnerCard
                owner={{
                  name: property.owner?.full_name || "Propriétaire",
                  phone: property.owner?.phone || "+242 06 XXX XX XX",
                  email: "contact@appartpn.com",
                  memberSince: new Date(property.created_at).getFullYear().toString(),
                  verified: true,
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
