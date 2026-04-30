//app/dashboard/batch-files/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Table,
  Edit,
  Trash2,
  Plus,
  FileDown,
  AlertCircle,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { generateQRCodeDataUrl } from "@/lib/qr-generator";
import { API_ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import AuthGuard from "@/components/dashboard/auth-guard";

interface Batch {
  id: string;
  name: string;
  productType: string;
  batchNumber: string | null;
  status: string;
  totalCount: number;
  generatedCount: number;
  qrCodeCount: number;
  createdAt: string;
  metadata: any;
}

interface QrCode {
  id: string;
  tokenId: string;
  productName: string;
  qrData: string;
  qrImageUrl: string;
}

export default function BatchFilesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isGeneratingQRCodes, setIsGeneratingQRCodes] = useState(false);
  const limit = 20;

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.USER.BATCHES}?page=${page}&limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch batches");
      const data = await res.json();
      setBatches(data.batches);
      setTotal(data.total);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load batch files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [page]);

  // Fetch QR codes for a batch from the DB
  const fetchBatchQrCodes = async (batchId: string): Promise<QrCode[]> => {
    const res = await fetch(`${API_ENDPOINTS.USER.BATCHES}/${batchId}/qrcodes`);
    if (!res.ok) throw new Error("Failed to fetch QR codes");
    const data = await res.json();
    return data.qrCodes;
  };

  const handleDownloadBatch = async (batch: Batch) => {
    try {
      setIsGeneratingQRCodes(true);
      toast({
        title: "Generating QR codes",
        description:
          "Please wait while we prepare your QR codes for download...",
      });

      const qrCodes = await fetchBatchQrCodes(batch.id);
      const zip = new JSZip();
      const qrFolder = zip.folder("qr-codes");

      let csvContent = "Token ID,Product Name,QR Data,Image File\n";

      const qrPromises = qrCodes.map(async (qr) => {
        try {
          // Use stored image URL if available, else regenerate
          const qrImageDataUrl = await generateQRCodeDataUrl(qr.qrData, {
            width: 300,
            margin: 1,
          });

          const imageData = qrImageDataUrl.split(",")[1];
          const imageBuffer = Buffer.from(imageData, "base64");
          const imageName = `qrcode_${qr.tokenId}.png`;
          qrFolder?.file(imageName, imageBuffer);
          csvContent += `${qr.tokenId},"${qr.productName}",${qr.qrData},${imageName}\n`;
        } catch (err) {
          console.error(`Error generating QR for ${qr.tokenId}:`, err);
        }
      });

      await Promise.all(qrPromises);
      zip.file("qr_codes_data.csv", csvContent);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batch.name.replace(/\s+/g, "_")}_QR_Codes.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "QR codes downloaded",
        description: `${qrCodes.length} QR codes downloaded successfully.`,
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "An error occurred while generating QR codes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQRCodes(false);
    }
  };

  const handlePrintBatch = async (batch: Batch) => {
    try {
      setIsGeneratingQRCodes(true);
      toast({
        title: "Preparing print layout",
        description:
          "Please wait while we prepare your QR codes for printing...",
      });

      const qrCodes = await fetchBatchQrCodes(batch.id);

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error(
          "Could not open print window. Check popup blocker settings.",
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR Codes - ${batch.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .qr-container { display: flex; flex-wrap: wrap; justify-content: center; }
            .qr-item {
              width: 200px; margin: 10px; text-align: center;
              border: 1px solid #eee; padding: 10px; page-break-inside: avoid;
            }
            .qr-code { width: 180px; height: 180px; }
            .qr-item p { margin: 5px 0; font-size: 12px; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:20px;">
            <h1>QR Codes for ${batch.name}</h1>
            <p>Total QR Codes: ${qrCodes.length}</p>
            <button onclick="window.print()">Print QR Codes</button>
            <button onclick="window.close()">Close</button>
          </div>
          <div class="header"><h2>Blockmec QR Codes - ${batch.name}</h2></div>
          <div class="qr-container">
      `);

      for (const qr of qrCodes) {
        const qrImageDataUrl = await generateQRCodeDataUrl(qr.qrData, {
          width: 300,
          margin: 1,
        });

        printWindow.document.write(`
          <div class="qr-item">
            <img class="qr-code" src="${qrImageDataUrl}" alt="QR Code ${qr.tokenId}">
            <p><strong>ID:</strong> ${qr.tokenId}</p>
            <p><strong>Product:</strong> ${qr.productName}</p>
          </div>
        `);
      }

      printWindow.document.write(`</div></body></html>`);
      printWindow.document.close();

      toast({
        title: "Print layout ready",
        description: "Use the print button in the new window.",
      });
    } catch (err) {
      toast({
        title: "Preparation failed",
        description: "An error occurred while preparing QR codes for printing.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQRCodes(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this batch? This cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`${API_ENDPOINTS.USER.BATCHES}?id=${batchId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete batch");
      toast({
        title: "Batch deleted",
        description: "Batch deleted successfully.",
      });
      fetchBatches();
    } catch (err) {
      toast({
        title: "Deletion failed",
        description: "An error occurred while deleting the batch.",
        variant: "destructive",
      });
    }
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.batchNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1a1625]">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-purple-500" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardShell>
        <DashboardHeader />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search batch files..."
              className="pl-10 bg-[#231c35] border-0 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchBatches}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push(ROUTES.DASHBOARD.CREATE_FILE)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Batch
            </Button>
          </div>
        </div>

        {filteredBatches.length > 0 ? (
          <>
            <div className="rounded-md overflow-hidden">
              <div className="bg-[#231c35] px-6 py-4 grid grid-cols-12 gap-4 text-gray-400 font-medium">
                <div className="col-span-4">Batch Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Date Created</div>
                <div className="col-span-2">QR Codes</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-[#2a2139]">
                {filteredBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-[#231c35] px-6 py-4 grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#3a2d5d] flex items-center justify-center rounded-md text-purple-400 text-xs font-bold uppercase">
                        {batch.productType.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {batch.name}
                        </div>
                        <div className="text-gray-400 text-sm capitalize">
                          {batch.productType}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          batch.status === "completed"
                            ? "text-green-500"
                            : batch.status === "failed"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span className="capitalize">{batch.status}</span>
                      </span>
                    </div>

                    <div className="col-span-2 text-gray-300">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </div>

                    <div className="col-span-2 text-gray-300">
                      {batch.qrCodeCount.toLocaleString()}
                    </div>

                    <div className="col-span-2 flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2139]"
                        title="Download QR Codes"
                        onClick={() => handleDownloadBatch(batch)}
                        disabled={isGeneratingQRCodes}
                      >
                        <FileDown className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2139]"
                        title="Print QR Codes"
                        onClick={() => handlePrintBatch(batch)}
                        disabled={isGeneratingQRCodes}
                      >
                        <Printer className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2139]"
                        title="Delete Batch"
                        onClick={() => handleDeleteBatch(batch.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-gray-400 text-sm">
              <span>
                Showing {filteredBatches.length} of {total} batch files
              </span>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-[#231c35] rounded-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2a2139] mb-4">
              <AlertCircle className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No batch files found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm
                ? `No batch files match "${searchTerm}"`
                : "You haven't created any batch files yet."}
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push(ROUTES.DASHBOARD.CREATE_FILE)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Batch
            </Button>
          </div>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
