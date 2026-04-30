"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import BankChecksVerificationResult from "@/components/bank-checks-verification-result"

function BankChecksContent() {
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
  return <BankChecksVerificationResult data={verificationData} />
}

export default function BankChecksVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <BankChecksContent />
    </Suspense>
  )
}
