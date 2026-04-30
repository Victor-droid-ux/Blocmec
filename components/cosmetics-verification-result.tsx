"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Sparkles, Shield, Calendar, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CosmeticsVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    productName: data?.productName || "La Mer Crème de la Mer",
    brand: data?.brand || "La Mer",
    batchNumber: data?.batchNumber || "B2024-03456",
    volume: data?.volume || "60ml / 2 fl oz",
    ingredients: data?.ingredients || "Miracle Broth™, Lime Tea, Sea Kelp",
    manufactureDate: data?.manufactureDate || Date.now() - 60 * 24 * 60 * 60 * 1000,
    expiryDate: data?.expiryDate || Date.now() + 730 * 24 * 60 * 60 * 1000,
    certification: data?.certification || "FDA Approved, Cruelty-Free",
    manufacturer: data?.manufacturer || "Estée Lauder Companies",
    origin: data?.origin || "United States",
    status: data?.status || "Authentic",
    productImage: data?.productImage || "/images/cosmetics-product.jpg",
    verificationHash: data?.verificationHash || "0xCosm3v4w5x6y7z8",
    transactionId: data?.transactionId || "0xabc123def456ghi7",
    blockConfirmations: data?.blockConfirmations || 4567,
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
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-pink-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-pink-800/80 border-pink-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-pink-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.productName}</h1>
                <p className="text-pink-300 text-sm md:text-base">{safeData.brand}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Product Image Section */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.productImage || "/placeholder.svg"}
                alt={safeData.productName}
                className="max-h-64 md:max-h-80 w-auto object-contain"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 text-sm md:text-base">Batch Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base break-all">
                  {safeData.batchNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 text-sm md:text-base">Volume</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.volume}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 text-sm md:text-base">Key Ingredients</span>
                <span className="text-white font-medium text-sm md:text-base text-right break-words">
                  {safeData.ingredients}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 flex items-center text-sm md:text-base">
                  <Factory className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.manufacturer}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 text-sm md:text-base">Origin</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.origin}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Expiry Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">{formatDate(safeData.expiryDate)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-pink-700 gap-2">
                <span className="text-pink-300 flex items-center text-sm md:text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  Certification
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.certification}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-pink-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-pink-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-800/80 border-pink-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Product Safety</h3>
            <div className="space-y-2 text-sm md:text-base text-pink-200">
              <p>✓ Dermatologically tested</p>
              <p>✓ Hypoallergenic formula</p>
              <p>✓ No harmful chemicals detected</p>
              <p>✓ Cruelty-free certified</p>
              <p>✓ Sealed and tamper-proof packaging</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-800/80 border-pink-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-pink-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-pink-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-pink-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
