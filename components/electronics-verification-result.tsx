"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Smartphone, Shield, Cpu, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ElectronicsVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    productName: data?.productName || "iPhone 15 Pro Max",
    manufacturer: data?.manufacturer || "Apple Inc.",
    model: data?.model || "A3108",
    serialNumber: data?.serialNumber || "F2K4N7M9P1Q2",
    imei: data?.imei || "356789012345678",
    manufactureDate: data?.manufactureDate || Date.now() - 90 * 24 * 60 * 60 * 1000,
    warrantyExpiry: data?.warrantyExpiry || Date.now() + 365 * 24 * 60 * 60 * 1000,
    status: data?.status || "Genuine",
    productImage: data?.productImage || "/images/electronics-product.jpg",
    verificationHash: data?.verificationHash || "0xElec9f0e1a2b3c4",
    transactionId: data?.transactionId || "0x1234abcd5678efgh",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <Smartphone className="h-10 w-10 md:h-12 md:w-12 text-blue-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{safeData.productName}</h1>
                <p className="text-slate-400 text-sm md:text-base">{safeData.model}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-blue-600/20 text-blue-400 border-blue-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Product Image Section */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.productImage || "/placeholder.svg"}
                alt={safeData.productName}
                className="max-h-72 md:max-h-80 w-auto object-contain"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-400 flex items-center text-sm md:text-base">
                  <Cpu className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.manufacturer}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-400 text-sm md:text-base">Serial Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.serialNumber}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-400 text-sm md:text-base">IMEI</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.imei}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-400 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-400 flex items-center text-sm md:text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  Warranty Expires
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.warrantyExpiry)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-slate-400 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 flex-shrink-0"
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
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Product Features</h3>
            <div className="space-y-2 text-sm md:text-base text-slate-300">
              <p>✓ Officially verified by manufacturer</p>
              <p>✓ Full warranty coverage</p>
              <p>✓ Genuine components guaranteed</p>
              <p>✓ Eligible for official support and updates</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-slate-400">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
