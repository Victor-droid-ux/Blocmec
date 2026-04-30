"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Gamepad2, Shield, Calendar, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ToysVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    toyName: data?.toyName || "LEGO Star Wars Millennium Falcon",
    brand: data?.brand || "LEGO",
    modelNumber: data?.modelNumber || "75192",
    ageRange: data?.ageRange || "16+",
    manufacturer: data?.manufacturer || "LEGO Group",
    safetyStandard: data?.safetyStandard || "ASTM F963, EN71, CE",
    manufactureDate: data?.manufactureDate || Date.now() - 90 * 24 * 60 * 60 * 1000,
    batchNumber: data?.batchNumber || "TOY2024-001234",
    pieceCount: data?.pieceCount || "7,541 pieces",
    status: data?.status || "Authentic",
    toyImage: data?.toyImage || "/placeholder.svg?height=400&width=400&text=Toy+Product",
    verificationHash: data?.verificationHash || "0xToy7h8i9j0k1l2m",
    transactionId: data?.transactionId || "0xtoy456def789ghi",
    blockConfirmations: data?.blockConfirmations || 5432,
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-cyan-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-cyan-800/80 border-cyan-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <Gamepad2 className="h-10 w-10 md:h-12 md:w-12 text-cyan-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.toyName}</h1>
                <p className="text-cyan-300 text-sm md:text-base">{safeData.brand}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Toy Image Section */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.toyImage || "/placeholder.svg"}
                alt={safeData.toyName}
                className="max-h-72 md:max-h-80 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=400&text=Toy+Product"
                }}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 text-sm md:text-base">Model Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base">{safeData.modelNumber}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 text-sm md:text-base">Age Range</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.ageRange}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 text-sm md:text-base">Piece Count</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.pieceCount}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 flex items-center text-sm md:text-base">
                  <Factory className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.manufacturer}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 text-sm md:text-base">Batch Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base break-all">
                  {safeData.batchNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-cyan-700 gap-2">
                <span className="text-cyan-300 flex items-center text-sm md:text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  Safety Standards
                </span>
                <span className="text-white font-medium text-sm md:text-base text-right break-words">
                  {safeData.safetyStandard}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-cyan-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-cyan-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cyan-800/80 border-cyan-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Safety Certification</h3>
            <div className="space-y-2 text-sm md:text-base text-cyan-200">
              <p>✓ No small parts for choking hazards</p>
              <p>✓ Non-toxic materials certified</p>
              <p>✓ Lead-free paint verified</p>
              <p>✓ Quality control passed</p>
              <p>✓ Age-appropriate tested</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cyan-800/80 border-cyan-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-cyan-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-cyan-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-cyan-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
