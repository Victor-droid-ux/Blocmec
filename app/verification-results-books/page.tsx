"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import BooksVerificationResult from "@/components/books-verification-result"

function BooksContent() {
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
  return <BooksVerificationResult data={verificationData} />
}

export default function BooksVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <BooksContent />
    </Suspense>
  )
}
