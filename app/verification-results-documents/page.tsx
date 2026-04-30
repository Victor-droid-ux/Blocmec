"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import DocumentsVerificationResult from "@/components/documents-verification-result"

function DocumentsContent() {
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

  return <DocumentsVerificationResult data={verificationData} />
}

export default function DocumentsVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  )
}
