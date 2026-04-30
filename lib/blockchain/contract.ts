import QRCode from "qrcode";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface BlockchainService {
  verifyProduct: (productId: string) => Promise<VerificationResult>;
  generateQR: (productData: ProductData) => Promise<QRResult>;
  getTransactionDetails: (txHash: string) => Promise<TransactionDetails>;
}

export interface VerificationResult {
  verified: boolean;
  transactionId: string;
  blockConfirmations: number;
  timestamp: number;
  hash: string;
}

export interface ProductData {
  id: string;
  name: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface QRResult {
  qrCode: string;
  hash: string;
  url: string;
}

export interface TransactionDetails {
  hash: string;
  blockNumber: number;
  confirmations: number;
  timestamp: number;
  status: "success" | "pending" | "failed";
}

export interface QRGenerationResult {
  qrCodeDataUrl: string;
  tokenId: string;
  transactionHash: string;
  verificationUrl: string;
  metadata: {
    productName: string;
    batchNumber: string;
    timestamp: number;
    manufacturer: string;
  };
}

// Real blockchain service — delegates to your backend API
export const blockchainService: BlockchainService = {
  async verifyProduct(productId: string): Promise<VerificationResult> {
    const res = await fetch(API_ENDPOINTS.BLOCKCHAIN.VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
    return res.json();
  },

  async generateQR(productData: ProductData): Promise<QRResult> {
    const res = await fetch(API_ENDPOINTS.BLOCKCHAIN.GENERATE_QR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error(`QR generation failed: ${res.statusText}`);
    return res.json();
  },

  async getTransactionDetails(txHash: string): Promise<TransactionDetails> {
    const res = await fetch(
      `${API_ENDPOINTS.BLOCKCHAIN.TRANSACTION}/${encodeURIComponent(txHash)}`,
    );
    if (!res.ok)
      throw new Error(`Transaction lookup failed: ${res.statusText}`);
    return res.json();
  },
};

// Generate QR and mint via backend API
export async function generateAndMintQR(
  productData?: ProductData,
): Promise<QRResult> {
  const res = await fetch(API_ENDPOINTS.BLOCKCHAIN.MINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData ?? {}),
  });
  if (!res.ok) throw new Error(`Minting failed: ${res.statusText}`);
  return res.json();
}

// Generate QR with full metadata via backend API
export async function generateAndMintQRWithDetails(
  productName: string,
  batchNumber: string,
  manufacturer: string,
  quantity = 1,
): Promise<QRGenerationResult> {
  const res = await fetch(API_ENDPOINTS.BLOCKCHAIN.MINT_WITH_DETAILS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName, batchNumber, manufacturer, quantity }),
  });
  if (!res.ok) throw new Error(`Minting failed: ${res.statusText}`);

  const data = await res.json();

  // Generate the QR code image client-side from the verification URL returned by the API
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 512,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return {
    ...data,
    qrCodeDataUrl,
  };
}

// Verify a QR token via backend API
export async function verifyQRCode(
  tokenId: string,
): Promise<VerificationResult> {
  const res = await fetch(
    `${API_ENDPOINTS.BLOCKCHAIN.VERIFY_TOKEN}/${encodeURIComponent(tokenId)}`,
  );
  if (!res.ok) throw new Error(`Token verification failed: ${res.statusText}`);
  return res.json();
}

// Get product details for a token via backend API
export async function getProductDetails(tokenId: string) {
  const res = await fetch(
    `${API_ENDPOINTS.BLOCKCHAIN.PRODUCT}/${encodeURIComponent(tokenId)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

// Safe localStorage wrapper — kept as a utility but no longer used for blockchain data
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined") return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage access failed:", error);
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } catch (error) {
      console.warn("localStorage remove failed:", error);
    }
  },
};
