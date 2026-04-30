"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import PassportVerificationResult from "@/components/passport-verification-result"

function PassportContent() {
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

  return <PassportVerificationResult data={verificationData} />
}

export default function PassportVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  )
}
