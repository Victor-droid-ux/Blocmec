"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Plane, Calendar, Globe2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PassportData {
  passportNumber: string
  holderName: string
  nationality: string
  dateOfBirth: number
  issueDate: number
  expiryDate: number
  issuingCountry: string
  status: string
  passportImage?: string
  verificationHash: string
  transactionId: string
  blockConfirmations: number
}

export default function PassportVerificationResult({ data }: { data?: PassportData }) {
  const { toast } = useToast()

  const safeData = {
    passportNumber: data?.passportNumber || "A12345678",
    holderName: data?.holderName || "John Akachukwu Doe",
    nationality: data?.nationality || "Nigerian",
    dateOfBirth: data?.dateOfBirth || Date.now() - 30 * 365 * 24 * 60 * 60 * 1000,
    issueDate: data?.issueDate || Date.now() - 2 * 365 * 24 * 60 * 60 * 1000,
    expiryDate: data?.expiryDate || Date.now() + 8 * 365 * 24 * 60 * 60 * 1000,
    issuingCountry: data?.issuingCountry || "Nigeria",
    status: data?.status || "Valid",
    passportImage: data?.passportImage || "/images/ceo-akachukwu.jpg",
    verificationHash: data?.verificationHash || "0xPass1a2b3c4d5e6f",
    transactionId: data?.transactionId || "0xabcd9876efgh5432",
    blockConfirmations: data?.blockConfirmations || 3456,
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Hash copied to clipboard" })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isExpired = Date.now() > safeData.expiryDate

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Plane className="h-12 w-12 text-blue-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">International Passport</h1>
                <p className="text-slate-400">{safeData.passportNumber}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                <CheckCircle className="h-4 w-4 mr-2" />
                {safeData.status}
              </Badge>
              {isExpired && <Badge className="bg-red-600/20 text-red-400 border-red-600/50">Expired</Badge>}
            </div>

            {/* Passport Photo */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 mb-6 flex justify-center">
              <img
                src={safeData.passportImage || "/placeholder.svg"}
                alt="Passport Photo"
                className="h-48 w-48 rounded-lg object-cover border-4 border-white shadow-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=400&text=Passport+Photo"
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </span>
                <span className="text-white font-medium">{safeData.holderName}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Globe2 className="h-4 w-4 mr-2" />
                  Nationality
                </span>
                <span className="text-white font-medium">{safeData.nationality}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Globe2 className="h-4 w-4 mr-2" />
                  Issuing Country
                </span>
                <span className="text-white font-medium">{safeData.issuingCountry}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date of Birth
                </span>
                <span className="text-white font-medium">{formatDate(safeData.dateOfBirth)}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Issue Date
                </span>
                <span className="text-white font-medium">{formatDate(safeData.issueDate)}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Expiry Date
                </span>
                <span className={`font-medium ${isExpired ? "text-red-400" : "text-white"}`}>
                  {formatDate(safeData.expiryDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Verification Hash</span>
                <div className="flex items-center">
                  <code className="text-white font-mono text-sm mr-2">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Blockchain Verification</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-white font-mono">{safeData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
