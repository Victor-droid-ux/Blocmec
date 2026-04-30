"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ToysVerificationResult from "@/components/toys-verification-result"

function ToysContent() {
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
  return <ToysVerificationResult data={verificationData} />
}

export default function ToysVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-cyan-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      }
    >
      <ToysContent />
    </Suspense>
  )
}
