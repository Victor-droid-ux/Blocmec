"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Gem, Calendar, User, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LuxuryGoodsVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    productName: data?.productName || "Rolex Submariner Date",
    brand: data?.brand || "Rolex",
    modelNumber: data?.modelNumber || "126610LN",
    serialNumber: data?.serialNumber || "12345ABC",
    buyerName: data?.buyerName || "Mr. John Akachukwu",
    purchaseDate: data?.purchaseDate || Date.now() - 180 * 24 * 60 * 60 * 1000,
    retailer: data?.retailer || "Official Rolex Boutique",
    certificateNumber: data?.certificateNumber || "CERT-ROL-2024-001",
    productImage: data?.productImage || "/placeholder.svg?height=400&width=400&text=Luxury+Watch",
    verificationHash: data?.verificationHash || "0xLux9a0b1c2d3e4f5",
    transactionId: data?.transactionId || "0x1234abcd5678efgh",
    blockConfirmations: data?.blockConfirmations || 4521,
    status: data?.status || "Authentic",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Gem className="h-12 w-12 text-yellow-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">{safeData.productName}</h1>
                <p className="text-slate-400">{safeData.brand}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Product Image */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 flex items-center justify-center mb-8">
              <img
                src={safeData.productImage || "/placeholder.svg"}
                alt={safeData.productName}
                className="max-h-80 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=400&text=Luxury+Product"
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Product Owner
                </span>
                <span className="text-white font-medium">{safeData.buyerName}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Model Number</span>
                <span className="text-white font-medium">{safeData.modelNumber}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Serial Number</span>
                <span className="text-white font-medium">{safeData.serialNumber}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Authorized Retailer
                </span>
                <span className="text-white font-medium">{safeData.retailer}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Purchase Date
                </span>
                <span className="text-white font-medium">{formatDate(safeData.purchaseDate)}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Certificate of Authenticity</span>
                <span className="text-white font-medium">{safeData.certificateNumber}</span>
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
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Ownership & Authenticity</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>✓ Verified authentic by Blockmec Chain</p>
              <p>✓ Original purchase from authorized retailer</p>
              <p>✓ Certificate of authenticity included</p>
              <p>✓ Registered to: {safeData.buyerName}</p>
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
