"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, Ticket, MapPin, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TicketsVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    eventName: data?.eventName || "Taylor Swift: The Eras Tour",
    venue: data?.venue || "MetLife Stadium",
    eventDate: data?.eventDate || Date.now() + 60 * 24 * 60 * 60 * 1000,
    eventTime: data?.eventTime || "7:00 PM EST",
    section: data?.section || "Floor A",
    row: data?.row || "12",
    seat: data?.seat || "15-16",
    ticketNumber: data?.ticketNumber || "TKT2024-001234",
    purchaseDate: data?.purchaseDate || Date.now() - 30 * 24 * 60 * 60 * 1000,
    status: data?.status || "Valid",
    ticketImage: data?.ticketImage || "/placeholder.svg?height=300&width=500&text=Event+Ticket",
    verificationHash: data?.verificationHash || "0xTkt9j0k1l2m3n4o",
    transactionId: data?.transactionId || "0xtkt678ghi901jkl",
    blockConfirmations: data?.blockConfirmations || 3210,
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
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-red-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-red-800/80 border-red-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <Ticket className="h-10 w-10 md:h-12 md:w-12 text-red-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.eventName}</h1>
                <p className="text-red-300 text-sm md:text-base">{safeData.venue}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Ticket Image Section */}
            <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 overflow-hidden">
              <img
                src={safeData.ticketImage || "/placeholder.svg"}
                alt="Event Ticket"
                className="w-full h-auto object-contain min-w-[280px]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=300&width=500&text=Event+Ticket"
                }}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 flex items-center text-sm md:text-base">
                  <MapPin className="h-4 w-4 mr-2" />
                  Venue
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.venue}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Event Date
                </span>
                <span className="text-white font-medium text-sm md:text-base">{formatDate(safeData.eventDate)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 flex items-center text-sm md:text-base">
                  <Clock className="h-4 w-4 mr-2" />
                  Event Time
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.eventTime}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 text-sm md:text-base">Section</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.section}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 text-sm md:text-base">Row</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.row}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 text-sm md:text-base">Seat</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.seat}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-red-700 gap-2">
                <span className="text-red-300 text-sm md:text-base">Ticket Number</span>
                <span className="text-white font-medium font-mono text-sm md:text-base break-all">
                  {safeData.ticketNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-red-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-red-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-800/80 border-red-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Ticket Authenticity</h3>
            <div className="space-y-2 text-sm md:text-base text-red-200">
              <p>✓ Official ticket verified</p>
              <p>✓ Not a duplicate or counterfeit</p>
              <p>✓ Valid for entry on event date</p>
              <p>✓ Transferable ownership</p>
              <p>✓ Refund policy eligible</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-800/80 border-red-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-red-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-red-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-red-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
