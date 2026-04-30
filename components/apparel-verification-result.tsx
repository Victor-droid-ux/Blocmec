"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, ShoppingBag, Calendar, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ApparelVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    productName: data?.productName || "Nike Air Jordan 1 Retro High",
    brand: data?.brand || "Nike / Jordan Brand",
    styleCode: data?.styleCode || "555088-134",
    size: data?.size || "US 10 / EU 44",
    color: data?.color || "White/University Blue",
    manufacturer: data?.manufacturer || "Nike Inc.",
    manufactureDate: data?.manufactureDate || Date.now() - 120 * 24 * 60 * 60 * 1000,
    origin: data?.origin || "Vietnam",
    materialComposition: data?.materialComposition || "Leather upper, Rubber sole",
    status: data?.status || "Authentic",
    apparelImage: data?.apparelImage || "/placeholder.svg?height=400&width=400&text=Apparel+Product",
    verificationHash: data?.verificationHash || "0xApp0k1l2m3n4o5p",
    transactionId: data?.transactionId || "0xapp789hij012klm",
    blockConfirmations: data?.blockConfirmations || 2109,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-purple-800/80 border-purple-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-purple-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.productName}</h1>
                <p className="text-purple-300 text-sm md:text-base">{safeData.brand}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Apparel Image Section */}
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.apparelImage || "/placeholder.svg"}
                alt={safeData.productName}
                className="max-h-72 md:max-h-80 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=400&text=Apparel+Product"
                }}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Style Code</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.styleCode}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Size</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.size}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Color</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.color}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 flex items-center text-sm md:text-base">
                  <Factory className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.manufacturer}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Origin</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.origin}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Material Composition</span>
                <span className="text-white font-medium text-sm md:text-base text-right break-words">
                  {safeData.materialComposition}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-purple-700 gap-2">
                <span className="text-purple-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-purple-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-purple-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-800/80 border-purple-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Authentication Details</h3>
            <div className="space-y-2 text-sm md:text-base text-purple-200">
              <p>✓ Brand tags verified</p>
              <p>✓ Stitching quality authenticated</p>
              <p>✓ Material composition confirmed</p>
              <p>✓ Serial numbers validated</p>
              <p>✓ Original packaging verified</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-800/80 border-purple-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-purple-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-purple-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-purple-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
