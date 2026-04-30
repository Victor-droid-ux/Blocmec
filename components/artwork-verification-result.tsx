"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Palette, User, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ArtworkVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    artworkTitle: data?.artworkTitle || "Starry Night",
    artistName: data?.artistName || "Vincent van Gogh",
    artistBio: data?.artistBio || "Dutch Post-Impressionist painter (1853-1890)",
    creationYear: data?.creationYear || "1889",
    medium: data?.medium || "Oil on canvas",
    dimensions: data?.dimensions || "73.7 cm × 92.1 cm (29 in × 36¼ in)",
    currentOwner: data?.currentOwner || "Museum of Modern Art, New York",
    certificateNumber: data?.certificateNumber || "CERT-ART-VG-001",
    provenance: data?.provenance || "Private Collection → Auction House → Current Owner",
    exhibitionHistory: data?.exhibitionHistory || "MoMA (2020), Louvre (2018), National Gallery (2015)",
    artworkImage: data?.artworkImage || "/placeholder.svg?height=500&width=400&text=Artwork+Image",
    verificationHash: data?.verificationHash || "0xArt5f6g7h8i9j0k1",
    transactionId: data?.transactionId || "0xdef456ghi789jkl0",
    blockConfirmations: data?.blockConfirmations || 5234,
    status: data?.status || "Authentic",
    estimatedValue: data?.estimatedValue || "$100,000,000+",
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Hash copied to clipboard" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Palette className="h-12 w-12 text-purple-400 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">{safeData.artworkTitle}</h1>
                <p className="text-slate-400">Created in {safeData.creationYear}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Artwork Image */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 flex items-center justify-center mb-8">
              <img
                src={safeData.artworkImage || "/placeholder.svg"}
                alt={safeData.artworkTitle}
                className="max-h-96 w-auto object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=500&width=400&text=Artwork+Image"
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <User className="h-5 w-5 text-purple-400 mr-2" />
                  <h3 className="text-white font-semibold text-lg">Artist Information</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Artist Name:</span>
                    <span className="text-white font-medium">{safeData.artistName}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Biography:</span>
                    <p className="text-white text-sm">{safeData.artistBio}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Medium</span>
                <span className="text-white font-medium">{safeData.medium}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Dimensions</span>
                <span className="text-white font-medium">{safeData.dimensions}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Current Owner
                </span>
                <span className="text-white font-medium">{safeData.currentOwner}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Estimated Value</span>
                <span className="text-white font-medium text-green-400">{safeData.estimatedValue}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Certificate Number</span>
                <span className="text-white font-medium">{safeData.certificateNumber}</span>
              </div>

              <div className="py-3 border-b border-slate-700">
                <span className="text-slate-400 block mb-2">Provenance (Ownership History)</span>
                <p className="text-white text-sm">{safeData.provenance}</p>
              </div>

              <div className="py-3 border-b border-slate-700">
                <span className="text-slate-400 block mb-2">Exhibition History</span>
                <p className="text-white text-sm">{safeData.exhibitionHistory}</p>
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
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Authenticity Verification</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>✓ Verified authentic artwork</p>
              <p>✓ Certificate of authenticity included</p>
              <p>✓ Complete provenance documented</p>
              <p>✓ Exhibition history verified</p>
              <p>✓ Registered on Blockmec Chain</p>
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
