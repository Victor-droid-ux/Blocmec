import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Card className="bg-slate-800/50 border-slate-700 p-8">
        <CardContent className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-white text-lg">Loading verification results...</span>
        </CardContent>
      </Card>
    </div>
  )
}
