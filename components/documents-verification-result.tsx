"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, FileText, Calendar, Building2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentData {
  documentType: string
  documentNumber: string
  issueDate: number
  expiryDate: number
  issuingAuthority: string
  holderName: string
  status: string
  verificationHash: string
  transactionId: string
  blockConfirmations: number
  documentImage?: string
}

export default function DocumentsVerificationResult({ data }: { data?: DocumentData }) {
  const { toast } = useToast()

  const safeData = {
    documentType: data?.documentType || "Certificate of Incorporation",
    documentNumber: data?.documentNumber || "RC1234567",
    issueDate: data?.issueDate || Date.now() - 365 * 24 * 60 * 60 * 1000,
    expiryDate: data?.expiryDate || Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    issuingAuthority: data?.issuingAuthority || "Corporate Affairs Commission",
    holderName: data?.holderName || "Blockmec Technologies Ltd",
    status: data?.status || "Valid",
    verificationHash: data?.verificationHash || "0xDoc7f8e9a1b2c3d4",
    transactionId: data?.transactionId || "0x9876543210abcdef",
    blockConfirmations: data?.blockConfirmations || 2341,
    documentImage: data?.documentImage || "/placeholder.svg?height=400&width=600&text=Document+Image",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <FileText className="h-12 w-12 text-purple-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">{safeData.documentType}</h1>
                <p className="text-slate-400">{safeData.documentNumber}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Document Image */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <img
                src={safeData.documentImage || "/placeholder.svg"}
                alt="Document"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=600&text=Document+Image"
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Registered To
                </span>
                <span className="text-white font-medium">{safeData.holderName}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Issuing Authority
                </span>
                <span className="text-white font-medium">{safeData.issuingAuthority}</span>
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
                <span className="text-white font-medium">{formatDate(safeData.expiryDate)}</span>
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

            <div className="mt-6 flex gap-4">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
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
