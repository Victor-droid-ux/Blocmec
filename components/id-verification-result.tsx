"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Share2, Download, Shield, AlertCircle, ExternalLink } from "lucide-react"
import Image from "next/image"

interface IDVerificationData {
  name: string
  position: string
  employeeId: string
  department: string
  email: string
  phone: string
  bloodGroup: string
  emergencyContact: string
  idNumber: string
  issueDate: string
  expiryDate: string
  photo: string
  idCardImage: string
  verified: boolean
  transactionId: string
  blockConfirmations: number
  timestamp: number
}

interface IDVerificationResultProps {
  data?: IDVerificationData
}

export default function IDVerificationResult({ data }: IDVerificationResultProps) {
  const [mounted, setMounted] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Default sample data for CEO
  const defaultData: IDVerificationData = {
    name: "Akachukwu Nwabueze",
    position: "Chief Executive Officer",
    employeeId: "BM-CEO-001",
    department: "Executive Management",
    email: "akachukwu@blockmec.com",
    phone: "+234 803 123 4567",
    bloodGroup: "O+",
    emergencyContact: "+234 805 987 6543",
    idNumber: "BMID-2024-001",
    issueDate: "2024-01-15",
    expiryDate: "2026-01-15",
    photo: "/images/ceo-akachukwu.jpg",
    idCardImage: "/images/ceo-akachukwu.jpg",
    verified: true,
    transactionId: "0x7f8e9a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    blockConfirmations: 1523,
    timestamp: Date.now() - 86400000, // 1 day ago
  }

  const verificationData = data || defaultData

  if (!mounted) {
    return null
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Blockmec ID Card Verification",
          text: `${verificationData.name}'s ID card has been verified on the blockchain`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share failed:", err)
      }
    } else {
      setShowShareOptions(!showShareOptions)
    }
  }

  const handleDownload = () => {
    // Create a download link for the verification report
    const report = `
Blockmec ID Card Verification Report
=====================================

Name: ${verificationData.name}
Position: ${verificationData.position}
Employee ID: ${verificationData.employeeId}
Department: ${verificationData.department}

Status: ${verificationData.verified ? "VERIFIED ✓" : "NOT VERIFIED ✗"}
Transaction ID: ${verificationData.transactionId}
Block Confirmations: ${verificationData.blockConfirmations}
Verification Date: ${new Date(verificationData.timestamp).toLocaleString()}

This ID card has been verified on the Blockmec blockchain.
    `.trim()

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `blockmec-id-verification-${verificationData.employeeId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleViewOnExplorer = () => {
    // Open blockchain explorer in new tab
    const explorerUrl = `https://explorer.blockmec.com/tx/${verificationData.transactionId}`
    window.open(explorerUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image src="/images/blockmec-logo.png" alt="Blockmec Logo" width={60} height={60} className="mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ID Card Verification
            </h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base">Blockchain-verified identification card</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Left Column - ID Card Image */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                Official ID Card
              </CardTitle>
              <CardDescription className="text-purple-100 text-sm">Blockchain-secured identification</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {/* ID Card Image */}
                <div className="relative">
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-4 border-purple-200 shadow-xl">
                    <Image
                      src={verificationData.idCardImage || "/placeholder.svg"}
                      alt="ID Card"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <p className="text-center text-xs md:text-sm text-gray-600 mt-3 font-medium">
                    Official ID Card Photo
                  </p>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center justify-center gap-2 p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-green-900 text-sm md:text-base">Verified on Blockchain</p>
                    <p className="text-xs text-green-700">
                      {verificationData.blockConfirmations.toLocaleString()} confirmations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Personal Information */}
          <div className="space-y-4 md:space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 md:p-6">
                <CardTitle className="text-background text-lg md:text-xl">Personal Information</CardTitle>
                <CardDescription className="text-sm">Employee identification details</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Full Name</span>
                    <span className="font-semibold text-sm md:text-base sm:text-right break-words">
                      {verificationData.name}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Position</span>
                    <span className="font-semibold text-sm md:text-base sm:text-right break-words">
                      {verificationData.position}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Employee ID</span>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {verificationData.employeeId}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Department</span>
                    <span className="font-semibold text-sm md:text-base sm:text-right break-words">
                      {verificationData.department}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Email</span>
                    <span className="text-xs md:text-sm sm:text-right break-all">{verificationData.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Phone</span>
                    <span className="text-xs md:text-sm sm:text-right">{verificationData.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Information */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  Emergency Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Blood Group</span>
                    <Badge variant="destructive" className="text-xs w-fit">
                      {verificationData.bloodGroup}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pb-3 border-b">
                    <span className="text-xs md:text-sm font-medium text-gray-600">Emergency Contact</span>
                    <span className="text-xs md:text-sm sm:text-right">{verificationData.emergencyContact}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-xs md:text-sm font-medium text-gray-600">ID Number</span>
                    <span className="font-mono text-xs md:text-sm break-all">{verificationData.idNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Blockchain Details */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* ID Validity */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                ID Card Validity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-3 border-b">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Issue Date</span>
                  <span className="font-semibold text-sm md:text-base">
                    {new Date(verificationData.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-3 border-b">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Expiry Date</span>
                  <span className="font-semibold text-sm md:text-base">
                    {new Date(verificationData.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Status</span>
                  <Badge className="bg-green-500 w-fit text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Details */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="pb-3 border-b">
                  <span className="text-xs md:text-sm font-medium text-gray-600 block mb-1">Transaction ID</span>
                  <span className="font-mono text-xs break-all text-gray-800">{verificationData.transactionId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-3 border-b">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Confirmations</span>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {verificationData.blockConfirmations.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-3 border-b">
                  <span className="text-xs md:text-sm font-medium text-gray-600">Verified On</span>
                  <span className="text-xs md:text-sm">
                    {new Date(verificationData.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={handleViewOnExplorer}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Blockchain Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-4 md:mb-6">
          
        </Card>

        {/* Security Notice */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1 text-sm md:text-base">Blockchain Security</h3>
              <p className="text-xs md:text-sm text-blue-800">
                This ID card has been verified and recorded on the Blockmec blockchain. The verification is immutable
                and cannot be altered, ensuring the authenticity of this identification card.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
