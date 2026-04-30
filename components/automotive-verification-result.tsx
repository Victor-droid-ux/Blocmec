"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Car, Shield, Calendar, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AutomotiveVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    partName: data?.partName || "Genuine BMW Engine Oil Filter",
    partNumber: data?.partNumber || "11427848321",
    manufacturer: data?.manufacturer || "BMW AG",
    vehicleCompatibility: data?.vehicleCompatibility || "BMW 3/5/7 Series (2010-2023)",
    oemCertified: data?.oemCertified || "Yes",
    warranty: data?.warranty || "2 years / 24,000 miles",
    manufactureDate: data?.manufactureDate || Date.now() - 45 * 24 * 60 * 60 * 1000,
    batchNumber: data?.batchNumber || "AUTO2024-BMW-001",
    status: data?.status || "Genuine OEM",
    partImage: data?.partImage || "/placeholder.svg?height=400&width=400&text=Auto+Part",
    verificationHash: data?.verificationHash || "0xAuto8i9j0k1l2m3",
    transactionId: data?.transactionId || "0xauto567efg890hij",
    blockConfirmations: data?.blockConfirmations || 4321,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <Car className="h-10 w-10 md:h-12 md:w-12 text-slate-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.partName}</h1>
                <p className="text-slate-300 text-sm md:text-base">{safeData.partNumber}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Auto Part Image Section */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.partImage || "/placeholder.svg"}
                alt={safeData.partName}
                className="max-h-72 md:max-h-80 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=400&text=Auto+Part"
                }}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 flex items-center text-sm md:text-base">
                  <Factory className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.manufacturer}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 text-sm md:text-base">Vehicle Compatibility</span>
                <span className="text-white font-medium text-sm md:text-base text-right break-words">
                  {safeData.vehicleCompatibility}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 flex items-center text-sm md:text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  OEM Certified
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.oemCertified}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 text-sm md:text-base">Warranty</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.warranty}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 text-sm md:text-base">Batch Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base break-all">
                  {safeData.batchNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-700 gap-2">
                <span className="text-slate-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">
                  {formatDate(safeData.manufactureDate)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-slate-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-slate-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-slate-600 hover:bg-slate-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Quality Assurance</h3>
            <div className="space-y-2 text-sm md:text-base text-slate-300">
              <p>✓ Original Equipment Manufacturer (OEM) certified</p>
              <p>✓ ISO 9001 quality standards met</p>
              <p>✓ Factory specifications matched</p>
              <p>✓ Performance tested and verified</p>
              <p>✓ Counterfeit protection included</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-slate-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-slate-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-slate-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
