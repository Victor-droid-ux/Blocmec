"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, QrCode, Clock, AlertTriangle, Factory, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MedicineVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "verified" | "expired">("unverified")
  const [isVerifying, setIsVerifying] = useState(false)

  const safeData = {
    medicineName: data?.medicineName || "Paracetamol 500mg",
    manufacturer: data?.manufacturer || "Pfizer Pharmaceuticals",
    batchNumber: data?.batchNumber || "MED2024-P500-LOT123",
    manufactureDate: data?.manufactureDate || Date.now() - 60 * 24 * 60 * 60 * 1000,
    expiryDate: data?.expiryDate || Date.now() + 2 * 365 * 24 * 60 * 60 * 1000,
    naifdacNumber: data?.naifdacNumber || "A4-1234",
    status: data?.status || "Approved",
    activeIngredient: data?.activeIngredient || "Paracetamol",
    dosage: data?.dosage || "500mg",
    productImage: data?.productImage || "/placeholder.svg?height=400&width=300&text=Medicine+Image",
    verificationHash: data?.verificationHash || "0xMed8f9e0a1b2c3d4",
    transactionId: data?.transactionId || "0xabcd1234efgh5678",
    blockConfirmations: data?.blockConfirmations || 1892,
    scanCount: data?.scanCount || 45,
    maxScans: data?.maxScans || 100,
    currentScans: data?.currentScans || 45,
    origin: data?.origin || "Lagos, Nigeria",
    category: data?.category || "Analgesics",
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

  const formatHash = (hash: string) => {
    if (!hash) return "N/A"
    if (hash.length > 12) {
      return `${hash.slice(0, 6)}...${hash.slice(-6)}`
    }
    return hash
  }

  const handleVerifyNow = async () => {
    setIsVerifying(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const currentTime = Date.now()
      if (currentTime > safeData.expiryDate) {
        setVerificationStatus("expired")
        toast({
          title: "Product Expired",
          description: "This medicine has expired",
          variant: "destructive",
        })
      } else {
        setVerificationStatus("verified")
        toast({
          title: "Medicine Verified!",
          description: "This medicine is authentic and valid",
        })
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify medicine",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return {
          className: "bg-green-600/20 text-green-400 border-green-600/50",
          icon: <CheckCircle className="h-5 w-5 mr-2" />,
          text: "Verified Medicine",
        }
      case "expired":
        return {
          className: "bg-orange-600/20 text-orange-400 border-orange-600/50",
          icon: <Clock className="h-5 w-5 mr-2" />,
          text: "Medicine Expired",
        }
      default:
        return {
          className: "bg-gray-600/20 text-gray-400 border-gray-600/50",
          icon: null,
          text: "",
        }
    }
  }

  const badgeConfig = getVerificationBadge()
  const isExpired = Date.now() > safeData.expiryDate

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
          <CardContent className="p-8">
            <h1 className="text-5xl font-bold text-white mb-6">{safeData.medicineName}</h1>

            {verificationStatus !== "unverified" && (
              <div className="mb-8">
                <Badge
                  className={cn(
                    "px-4 py-2 text-base font-medium rounded-full border-2 transition-all duration-300",
                    badgeConfig.className,
                  )}
                >
                  {badgeConfig.icon}
                  {badgeConfig.text}
                </Badge>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center space-x-3 text-slate-400">
                <span className="text-lg">Hash :</span>
                <code className="text-slate-300 font-mono text-lg">{formatHash(safeData.verificationHash)}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(safeData.verificationHash)}
                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 flex items-center justify-center mb-8">
              <img
                src={safeData.productImage || "/placeholder.svg"}
                alt={safeData.medicineName}
                className="max-h-96 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=300&text=Medicine+Image"
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleVerifyNow}
                disabled={isVerifying}
                className={cn(
                  "flex-1 py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105",
                  verificationStatus === "verified"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : verificationStatus === "expired"
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white",
                )}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5 mr-2" />
                    {verificationStatus === "verified" ? "Verify Again" : "Verify Now"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent py-3 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Factory className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-white font-semibold">Manufacturing Info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Manufacturer:</span>
                  <span className="text-white font-medium">{safeData.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Number:</span>
                  <span className="text-white font-medium">{safeData.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin:</span>
                  <span className="text-white font-medium">{safeData.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manufacture Date:</span>
                  <span className="text-white font-medium">{formatDate(safeData.manufactureDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="text-white font-semibold">Medicine Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white font-medium">{safeData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Ingredient:</span>
                  <span className="text-white font-medium">{safeData.activeIngredient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className={`font-medium ${isExpired ? "text-red-400" : "text-white"}`}>
                    {formatDate(safeData.expiryDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NAFDAC Number:</span>
                  <span className="text-white font-medium">{safeData.naifdacNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <QrCode className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="text-white font-semibold">Blockchain Data</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-white font-medium font-mono">{safeData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confirmations:</span>
                  <span className="text-white font-medium">{safeData.blockConfirmations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Scans:</span>
                  <span className="text-white font-medium">{safeData.scanCount} times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scan Limit:</span>
                  <span className="text-white font-medium">
                    {safeData.currentScans}/{safeData.maxScans}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />
                <h3 className="text-white font-semibold">Safety Information</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p>⚠️ Always check expiry date before use</p>
                <p>💊 Store in cool, dry place</p>
                <p>👨‍⚕️ Consult healthcare professional</p>
                <p>🔒 Keep out of reach of children</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {verificationStatus !== "unverified" && (
          <Card className="bg-slate-700/50 border-slate-600/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="text-white font-semibold">Verification Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={cn(
                      "ml-2 font-medium",
                      verificationStatus === "verified" ? "text-green-400" : "text-orange-400",
                    )}
                  >
                    {verificationStatus === "verified" ? "Authentic" : "Expired"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Verified On:</span>
                  <span className="text-white ml-2">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
