"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ApparelVerificationResult from "@/components/apparel-verification-result"

function ApparelContent() {
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
  return <ApparelVerificationResult data={verificationData} />
}

export default function ApparelVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <ApparelContent />
    </Suspense>
  )
}
