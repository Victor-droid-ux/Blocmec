"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import LuxuryGoodsVerificationResult from "@/components/luxury-goods-verification-result"

function LuxuryGoodsContent() {
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
  return <LuxuryGoodsVerificationResult data={verificationData} />
}

export default function LuxuryGoodsVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
        </div>
      }
    >
      <LuxuryGoodsContent />
    </Suspense>
  )
}
