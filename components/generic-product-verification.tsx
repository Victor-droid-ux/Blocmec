"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Package, Calendar, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductConfig {
  icon: React.ReactNode
  gradient: string
  accentColor: string
}

const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  apparel: {
    icon: <Package className="h-12 w-12 text-pink-400" />,
    gradient: "from-slate-900 via-pink-900 to-slate-900",
    accentColor: "pink",
  },
  "luxury-goods": {
    icon: <Package className="h-12 w-12 text-yellow-400" />,
    gradient: "from-slate-900 via-yellow-900 to-slate-900",
    accentColor: "yellow",
  },
  "food-beverages": {
    icon: <Package className="h-12 w-12 text-orange-400" />,
    gradient: "from-slate-900 via-orange-900 to-slate-900",
    accentColor: "orange",
  },
  artwork: {
    icon: <Package className="h-12 w-12 text-purple-400" />,
    gradient: "from-slate-900 via-purple-900 to-slate-900",
    accentColor: "purple",
  },
  tickets: {
    icon: <Package className="h-12 w-12 text-red-400" />,
    gradient: "from-slate-900 via-red-900 to-slate-900",
    accentColor: "red",
  },
  cosmetics: {
    icon: <Package className="h-12 w-12 text-pink-400" />,
    gradient: "from-slate-900 via-pink-900 to-slate-900",
    accentColor: "pink",
  },
  automotive: {
    icon: <Package className="h-12 w-12 text-gray-400" />,
    gradient: "from-slate-900 via-gray-900 to-slate-900",
    accentColor: "gray",
  },
  toys: {
    icon: <Package className="h-12 w-12 text-cyan-400" />,
    gradient: "from-slate-900 via-cyan-900 to-slate-900",
    accentColor: "cyan",
  },
  books: {
    icon: <Package className="h-12 w-12 text-indigo-400" />,
    gradient: "from-slate-900 via-indigo-900 to-slate-900",
    accentColor: "indigo",
  },
  "bank-checks": {
    icon: <Package className="h-12 w-12 text-emerald-400" />,
    gradient: "from-slate-900 via-emerald-900 to-slate-900",
    accentColor: "emerald",
  },
}

export default function GenericProductVerification({ productType, data }: { productType: string; data?: any }) {
  const { toast } = useToast()
  const config = PRODUCT_CONFIGS[productType] || PRODUCT_CONFIGS.apparel

  const safeData = {
    productName: data?.productName || "Authentic Product",
    manufacturer: data?.manufacturer || "Verified Manufacturer",
    batchNumber: data?.batchNumber || "BATCH-2024-001",
    manufactureDate: data?.manufactureDate || Date.now() - 60 * 24 * 60 * 60 * 1000,
    status: data?.status || "Verified Authentic",
    verificationHash: data?.verificationHash || "0xProd1a2b3c4d5e6",
    transactionId: data?.transactionId || "0xabcd1234efgh5678",
    blockConfirmations: data?.blockConfirmations || 2156,
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
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient} p-4`}>
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              {config.icon}
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-white">{safeData.productName}</h1>
                <p className="text-slate-400">{productType.replace("-", " ").toUpperCase()}</p>
              </div>
            </div>

            <Badge
              className={`mb-6 bg-${config.accentColor}-600/20 text-${config.accentColor}-400 border-${config.accentColor}-600/50`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manufacturer
                </span>
                <span className="text-white font-medium">{safeData.manufacturer}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Batch Number</span>
                <span className="text-white font-medium">{safeData.batchNumber}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manufacture Date
                </span>
                <span className="text-white font-medium">{formatDate(safeData.manufactureDate)}</span>
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
              <Button className={`w-full bg-${config.accentColor}-600 hover:bg-${config.accentColor}-700`}>
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
