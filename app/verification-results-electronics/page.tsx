"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ElectronicsVerificationResult from "@/components/electronics-verification-result"

function ElectronicsContent() {
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

  return <ElectronicsVerificationResult data={verificationData} />
}

export default function ElectronicsVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ElectronicsContent />
    </Suspense>
  )
}
