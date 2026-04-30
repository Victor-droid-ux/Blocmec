"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import AutomotiveVerificationResult from "@/components/automotive-verification-result"

function AutomotiveContent() {
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
  return <AutomotiveVerificationResult data={verificationData} />
}

export default function AutomotiveVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      }
    >
      <AutomotiveContent />
    </Suspense>
  )
}
