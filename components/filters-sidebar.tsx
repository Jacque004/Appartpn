"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"

interface FiltersSidebarProps {
  onClose?: () => void
  neighborhoods?: string[]
}

export function FiltersSidebar({ onClose, neighborhoods = [] }: FiltersSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [selectedType, setSelectedType] = useState<string>(searchParams.get("type") || "all")
  const [priceRange, setPriceRange] = useState<number[]>([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || 2000000,
  ])
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>(searchParams.get("bedrooms") || "")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(searchParams.get("neighborhood") || "all")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (selectedType !== "all") params.set("type", selectedType)
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 2000000) params.set("maxPrice", priceRange[1].toString())
    if (selectedBedrooms) params.set("bedrooms", selectedBedrooms)
    if (selectedNeighborhood !== "all") params.set("neighborhood", selectedNeighborhood)

    startTransition(() => {
      router.push(`/logements?${params.toString()}`)
      onClose?.()
    })
  }

  const resetFilters = () => {
    setSelectedType("all")
    setPriceRange([0, 2000000])
    setSelectedBedrooms("")
    setSelectedNeighborhood("all")
    setSelectedAmenities([])

    startTransition(() => {
      router.push("/logements")
      onClose?.()
    })
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Filtres</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Type de logement */}
        <div>
          <h3 className="font-medium text-foreground mb-3">Type de logement</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="villa"
                checked={selectedType === "villa"}
                onCheckedChange={(checked) => setSelectedType(checked ? "villa" : "all")}
              />
              <Label htmlFor="villa" className="text-sm font-normal cursor-pointer">
                Villa
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="apartment"
                checked={selectedType === "apartment"}
                onCheckedChange={(checked) => setSelectedType(checked ? "apartment" : "all")}
              />
              <Label htmlFor="apartment" className="text-sm font-normal cursor-pointer">
                Appartement
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="studio"
                checked={selectedType === "studio"}
                onCheckedChange={(checked) => setSelectedType(checked ? "studio" : "all")}
              />
              <Label htmlFor="studio" className="text-sm font-normal cursor-pointer">
                Studio
              </Label>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div>
          <h3 className="font-medium text-foreground mb-3">Prix mensuel (FCFA)</h3>
          <div className="space-y-4">
            <Slider value={priceRange} onValueChange={setPriceRange} max={2000000} step={50000} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{priceRange[0].toLocaleString("fr-FR")}</span>
              <span>{priceRange[1].toLocaleString("fr-FR")}</span>
            </div>
          </div>
        </div>

        {/* Chambres */}
        <div>
          <h3 className="font-medium text-foreground mb-3">Nombre de chambres</h3>
          <div className="flex gap-2 flex-wrap">
            {["1", "2", "3", "4", "5"].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="sm"
                className={`w-12 ${selectedBedrooms === num ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                onClick={() => setSelectedBedrooms(selectedBedrooms === num ? "" : num)}
              >
                {num === "5" ? "5+" : num}
              </Button>
            ))}
          </div>
        </div>

        {/* Quartiers */}
        <div>
          <h3 className="font-medium text-foreground mb-3">Quartiers</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {neighborhoods.map((quartier) => (
              <div key={quartier} className="flex items-center space-x-2">
                <Checkbox
                  id={quartier}
                  checked={selectedNeighborhood === quartier}
                  onCheckedChange={(checked) => setSelectedNeighborhood(checked ? quartier : "all")}
                />
                <Label htmlFor={quartier} className="text-sm font-normal cursor-pointer">
                  {quartier}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Équipements */}
        <div>
          <h3 className="font-medium text-foreground mb-3">Équipements</h3>
          <div className="space-y-2">
            {["Climatisation", "Parking", "Jardin", "Piscine", "Sécurité 24h"].map((equipement) => (
              <div key={equipement} className="flex items-center space-x-2">
                <Checkbox
                  id={equipement}
                  checked={selectedAmenities.includes(equipement)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAmenities([...selectedAmenities, equipement])
                    } else {
                      setSelectedAmenities(selectedAmenities.filter((a) => a !== equipement))
                    }
                  }}
                />
                <Label htmlFor={equipement} className="text-sm font-normal cursor-pointer">
                  {equipement}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={applyFilters}
            disabled={isPending}
          >
            {isPending ? "Application..." : "Appliquer"}
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={resetFilters} disabled={isPending}>
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  )
}
