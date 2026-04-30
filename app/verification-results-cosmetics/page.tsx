"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import CosmeticsVerificationResult from "@/components/cosmetics-verification-result"

function CosmeticsContent() {
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
  return <CosmeticsVerificationResult data={verificationData} />
}

export default function CosmeticsVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 via-rose-900 to-pink-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      }
    >
      <CosmeticsContent />
    </Suspense>
  )
}
