"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import IDVerificationResult from "@/components/id-verification-result"

function IDVerificationContent() {
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

  return <IDVerificationResult data={verificationData} />
}

export default function IDVerificationResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <IDVerificationContent />
    </Suspense>
  )
}
