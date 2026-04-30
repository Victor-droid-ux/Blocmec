"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, ExternalLink, BookOpen, User, Building2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BooksVerificationResult({ data }: { data?: any }) {
  const { toast } = useToast()

  const safeData = {
    bookTitle: data?.bookTitle || "The Great Gatsby",
    author: data?.author || "F. Scott Fitzgerald",
    isbn: data?.isbn || "978-0-7432-7356-5",
    publisher: data?.publisher || "Scribner",
    publicationYear: data?.publicationYear || "1925",
    edition: data?.edition || "First Edition",
    condition: data?.condition || "Mint",
    authenticityGrade: data?.authenticityGrade || "A+",
    status: data?.status || "Authentic",
    bookImage: data?.bookImage || "/images/book-cover.jpg",
    verificationHash: data?.verificationHash || "0xBook6g7h8i9j0k1l",
    transactionId: data?.transactionId || "0xbook789ghi123jkl",
    blockConfirmations: data?.blockConfirmations || 3456,
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Hash copied to clipboard" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-indigo-800/80 border-indigo-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-indigo-400 mr-0 sm:mr-4 mb-3 sm:mb-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{safeData.bookTitle}</h1>
                <p className="text-indigo-300 text-sm md:text-base">by {safeData.author}</p>
              </div>
            </div>

            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-600/50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {safeData.status}
            </Badge>

            {/* Book Cover Image Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 md:p-8 flex items-center justify-center mb-6">
              <img
                src={safeData.bookImage || "/placeholder.svg"}
                alt={safeData.bookTitle}
                className="max-h-80 md:max-h-96 w-auto object-contain shadow-2xl"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 flex items-center text-sm md:text-base">
                  <User className="h-4 w-4 mr-2" />
                  Author
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.author}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 text-sm md:text-base">ISBN</span>
                <span className="text-white font-medium font-mono text-sm md:text-base break-all">{safeData.isbn}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 flex items-center text-sm md:text-base">
                  <Building2 className="h-4 w-4 mr-2" />
                  Publisher
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.publisher}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 flex items-center text-sm md:text-base">
                  <Calendar className="h-4 w-4 mr-2" />
                  Publication Year
                </span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.publicationYear}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 text-sm md:text-base">Edition</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.edition}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 text-sm md:text-base">Condition</span>
                <span className="text-white font-medium text-sm md:text-base">{safeData.condition}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-indigo-700 gap-2">
                <span className="text-indigo-300 text-sm md:text-base">Authenticity Grade</span>
                <span className="text-white font-bold text-lg md:text-xl text-green-400">
                  {safeData.authenticityGrade}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <span className="text-indigo-300 text-sm md:text-base">Verification Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono text-xs md:text-sm break-all">{safeData.verificationHash}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(safeData.verificationHash)}
                    className="h-8 w-8 p-0 hover:bg-indigo-700 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-800/80 border-indigo-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Authentication Details</h3>
            <div className="space-y-2 text-sm md:text-base text-indigo-200">
              <p>✓ First edition verified</p>
              <p>✓ Original dust jacket present</p>
              <p>✓ Publisher's marks authenticated</p>
              <p>✓ Paper quality verified</p>
              <p>✓ Binding examined and certified</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-800/80 border-indigo-700/50 rounded-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Blockchain Verification</h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-indigo-300">Transaction ID:</span>
                <span className="text-white font-mono break-all">{safeData.transactionId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-indigo-300">Block Confirmations:</span>
                <span className="text-white">{safeData.blockConfirmations.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <span className="text-indigo-300">Network:</span>
                <span className="text-white">Blockmec Chain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
