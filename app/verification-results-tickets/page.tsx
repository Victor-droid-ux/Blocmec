"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import TicketsVerificationResult from "@/components/tickets-verification-result"

function TicketsContent() {
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
  return <TicketsVerificationResult data={verificationData} />
}

export default function TicketsVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-orange-900 to-red-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  )
}
