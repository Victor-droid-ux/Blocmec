"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ArtworkVerificationResult from "@/components/artwork-verification-result"

function ArtworkContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")
  let verificationData = undefined
  if (dataParam) {
    try {
      verificationData = JSON.parse(decodeURIComponent(dataParam))
    } catch (error) {
      console.error("Failed to parse verification data:", error)
    }
  }
  return <ArtworkVerificationResult data={verificationData} />
}

export default function ArtworkVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <ArtworkContent />
    </Suspense>
  )
}
