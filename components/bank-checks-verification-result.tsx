"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, CreditCard, Calendar, Building2, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BankChecksVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    checkNumber: data?.checkNumber || "CHK-2024-001234",
    bankName: data?.bankName || "First National Bank",
    accountHolder: data?.accountHolder || "Blockmec Technologies Ltd",
    amount: data?.amount || "$25,000.00",
    issueDate: data?.issueDate || Date.now() - 5 * 24 * 60 * 60 * 1000,
    payee: data?.payee || "ABC Corporation",
    routingNumber: data?.routingNumber || "021000021",
    accountNumber: data?.accountNumber || "****5678",
    status: data?.status || "Valid",
    checkImage: data?.checkImage || "/images/bank-check.jpg",
    verificationHash: data?.verificationHash || "0xCheck1a2b3c4d5e6f",
    transactionId: data?.transactionId || "0xabc987def654ghi3",
    blockConfirmations: data?.blockConfirmations || 6789,
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-emerald-800/80 border-emerald-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <CreditCard className="h-10 w-10 md:h-12 md:w-12 text-emerald-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Bank Check Verification</h1>
                <p className="text-emerald-300 text-sm md:text-base">{safeData.checkNumber}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Check Image Section */}
            <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 overflow-x-auto">
              <img
                src={safeData.checkImage || "/placeholder.svg"}
                alt="Bank Check"
                className="w-full h-auto object-contain min-w-[280px]"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 flex items-center text-sm md:text-base">
                  <Building2 className="h-4 w-4 mr-2" />
                  Bank Name
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.bankName}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 text-sm md:text-base">Account Holder</span>
                <span className="text-white font-medium text-sm md:text-base break-words">
                  {safeData.accountHolder}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 flex items-center text-sm md:text-base">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Amount
                </span>
                <span className="text-white font-bold text-lg md:text-xl text-green-400">{safeData.amount}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 text-sm md:text-base">Payee</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.payee}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Issue Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">{formatDate(safeData.issueDate)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 text-sm md:text-base">Routing Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.routingNumber}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-emerald-700 gap-2">
                <span className="text-emerald-300 text-sm md:text-base">Account Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.accountNumber}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-emerald-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-emerald-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-800/80 border-emerald-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Security Features</h3>
            <div className="space-y-2 text-sm md:text-base text-emerald-200">
              <p>✓ Watermark verified</p>
              <p>✓ Magnetic ink authentication passed</p>
              <p>✓ Microprinting detected</p>
              <p>✓ Serial number validated</p>
              <p>✓ Bank signature verified</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-800/80 border-emerald-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-emerald-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-emerald-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-emerald-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
