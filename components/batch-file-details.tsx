"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, QrCode, Printer } from "lucide-react"
import Image from "next/image"
import { generateQRCodeWithBanner } from "@/lib/qr-generator"

interface BatchFileDetailsProps {
  batchId: string
  batchName: string
  isOpen: boolean
  onClose: () => void
}

export function BatchFileDetails({ batchId, batchName, isOpen, onClose }: BatchFileDetailsProps) {
  const [qrCodes, setQrCodes] = useState<string[]>([])
  const [qrCodeImages, setQrCodeImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load QR codes when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      try {
        const storedQrCodes = localStorage.getItem(`batch_${batchId}_qrcodes`)
        if (storedQrCodes) {
          const parsedQrCodes = JSON.parse(storedQrCodes)
          setQrCodes(parsedQrCodes)
          generateQrCodeImages(parsedQrCodes)
        } else {
          // Generate dummy QR codes if none exist
          const dummyQrCodes = []
          for (let i = 0; i < 10; i++) {
            dummyQrCodes.push(
              JSON.stringify({
                id: `${batchId}-${i + 1}`,
                type: "product",
                batchNo: batchId,
                timestamp: Date.now(),
                index: i + 1,
              }),
            )
          }
          setQrCodes(dummyQrCodes)
          generateQrCodeImages(dummyQrCodes)
        }
      } catch (error) {
        console.error("Error loading QR codes:", error)
        // Set empty array on error
        setQrCodes([])
        setQrCodeImages([])
        setIsLoading(false)
      }
    }
  }, [isOpen, batchId])

  const generateQrCodeImages = async (codes: string[]) => {
    try {
      const images = await Promise.all(
        codes.slice(0, 10).map(async (code) => {
          try {
            return await generateQRCodeWithBanner(code, {
              width: 100,
              margin: 1,
            })
          } catch (err) {
            console.error("Error generating QR code:", err)
            return ""
          }
        }),
      )
      setQrCodeImages(images)
    } catch (error) {
      console.error("Error generating QR code images:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadQrCodes = () => {
    try {
      // Create CSV content
      let csvContent = "QR Code ID,QR Code Data,Created Date\n"

      qrCodes.forEach((qrCode, index) => {
        const qrId = `${batchId}-${index + 1}`
        const createdDate = new Date(Date.now() - index * 86400000).toISOString()
        csvContent += `${qrId},${qrCode.replace(/,/g, ";")},${createdDate}\n`
      })

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${batchName.replace(/\s+/g, "_")}_qrcodes.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading QR codes:", error)
    }
  }

  const handlePrintQrCode = async (qrCode: string, qrId: string) => {
    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Could not open print window. Please check your popup blocker settings.")
      }

      // Generate QR code with banner
      const qrImageDataUrl = await generateQRCodeWithBanner(qrCode, {
        width: 300,
        margin: 4,
      })

      // Write HTML content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR Code - ${qrId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
            .header { text-align: center; margin-bottom: 20px; }
            .header img { height: 60px; }
            .qr-container { margin: 20px auto; max-width: 400px; }
            .qr-image { width: 300px; margin: 0 auto; }
            .qr-details { margin-top: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/images/blockmec-logo.png" alt="Blockmec Logo">
            <h1>Blockmec QR Code</h1>
          </div>
          <div class="no-print">
            <button onclick="window.print()">Print QR Code</button>
            <button onclick="window.close()">Close</button>
          </div>
          <div class="qr-container">
            <img src="${qrImageDataUrl}" alt="QR Code ${qrId}" class="qr-image">
            <div class="qr-details">
              <p><strong>ID:</strong> ${qrId}</p>
              <p><strong>Batch:</strong> ${batchName}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `)

      printWindow.document.close()
    } catch (error) {
      console.error("Error printing QR code:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#231c35] border-[#2a2139] text-white max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Image
              src="/images/blockmec-logo.png"
              alt="Blockmec Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <DialogTitle>Batch File Details: {batchName}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">View and manage QR codes in this batch file.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">QR Codes</h3>
              <p className="text-sm text-gray-400">
                Showing {Math.min(10, qrCodes.length)} of {qrCodes.length} QR codes
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleDownloadQrCodes}>
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>

          <div className="rounded-md border border-[#2a2139] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1a1625]">
                <TableRow className="border-[#2a2139] hover:bg-transparent">
                  <TableHead className="text-gray-400">QR Code</TableHead>
                  <TableHead className="text-gray-400">QR Code ID</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                  <TableHead className="text-gray-400">Scans</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
                      </div>
                      <p className="mt-2 text-gray-400">Loading QR codes...</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  qrCodes.slice(0, 10).map((qrCode, index) => (
                    <TableRow key={index} className="border-[#2a2139] hover:bg-[#2a2139]">
                      <TableCell>
                        {qrCodeImages[index] && (
                          <div className="w-20 h-24 bg-white rounded-md overflow-hidden">
                            <img
                              src={qrCodeImages[index] || "/placeholder.svg"}
                              alt={`QR Code ${batchId}-${index + 1}`}
                              className="w-full h-full"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{`${batchId}-${index + 1}`}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            index % 5 === 0 ? "text-yellow-500" : "text-green-500"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          {index % 5 === 0 ? "Pending" : "Active"}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(Date.now() - index * 86400000).toLocaleDateString()}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 10)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            title="View QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            title="Print QR Code"
                            onClick={() => handlePrintQrCode(qrCode, `${batchId}-${index + 1}`)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
