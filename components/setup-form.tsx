"use client"

import { useState } from "react"
import { setupDatabase } from "@/lib/actions/setup"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function SetupForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const router = useRouter()

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)

    const response = await setupDatabase()
    setResult(response)
    setLoading(false)

    if (response.success) {
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSetup}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg"
      >
        {loading ? "Initialisation en cours..." : "Initialiser la base de données"}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Cette opération est sûre et peut être exécutée plusieurs fois sans problème.
      </p>
    </div>
  )
}
