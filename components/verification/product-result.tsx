"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Scan,
  Package,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductCategory } from "@/lib/product-categories";

export interface VerifiedProductPayload {
  verified: boolean;
  message: string;
  preview?: boolean;
  data?: {
    tokenId?: string;
    productName?: string;
    productType?: string;
    scanCount?: number;
    scanLimit?: number;
    expiresAt?: string | null;
    createdAt?: string;
    metadata?: Record<string, unknown> | null;
    productImage?: string | null;
    issuer?: string | null;
    branding?: {
      companyName?: string | null;
      website?: string | null;
      logoUrl?: string | null;
    } | null;
  } | null;
}

const HIDDEN_METADATA_KEYS = new Set(["index", "total", "productImage"]);

function formatLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProductResult({
  payload,
}: {
  payload: VerifiedProductPayload;
}) {
  const data = payload.data;
  const category = useMemo(
    () => getProductCategory(data?.productType),
    [data?.productType],
  );

  const status = payload.preview
    ? "preview"
    : payload.verified
      ? "verified"
      : "failed";

  const badge =
    status === "verified"
      ? { label: "Verified", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" }
      : status === "preview"
        ? { label: "Preview only", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
        : { label: "Not verified", className: "bg-red-500/15 text-red-300 border-red-500/30" };

  const metadataEntries = Object.entries(data?.metadata ?? {}).filter(
    ([key, value]) => value !== null && value !== "" && !HIDDEN_METADATA_KEYS.has(key),
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5" data-category={category.key}>
      {payload.preview && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Eye className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a preview of the result page. Scanners will only see a
            verification status after the code has been generated.
          </p>
        </div>
      )}

      <Card className="overflow-hidden border-white/10 bg-slate-900/80 text-white shadow-xl">
        <div className="h-1.5 w-full" style={{ backgroundColor: category.accent }} />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {data?.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.branding.logoUrl}
                  alt={data.branding.companyName ?? "Company logo"}
                  className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: category.accentSoft }}
                >
                  {category.icon}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {data?.branding?.companyName ?? data?.issuer ?? "Blockmec"}
                </p>
                {data?.branding?.website && (
                  <a
                    href={data.branding.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    {data.branding.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: category.accentSoft }}
            >
              {status === "verified" ? (
                <CheckCircle className="h-9 w-9 text-emerald-400" />
              ) : status === "preview" ? (
                <Eye className="h-9 w-9" style={{ color: category.accent }} />
              ) : (
                <XCircle className="h-9 w-9 text-red-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">
                {data?.productName ?? "Product"}
              </h1>
              <p className="text-sm text-slate-400">
                {category.icon} {category.label}
              </p>
              <p className="mt-1 text-sm text-slate-300">{payload.message}</p>
            </div>
          </div>

          {data?.tokenId && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Verification code
              </p>
              <p className="break-all font-mono text-sm">{data.tokenId}</p>
            </div>
          )}

          {payload.verified && data && (
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div>
                <Scan className="mx-auto mb-1 h-4 w-4" style={{ color: category.accent }} />
                <p className="text-[11px] text-slate-400">Scans</p>
                <p className="text-sm font-bold">{data.scanCount ?? 1}</p>
              </div>
              <div>
                <Shield className="mx-auto mb-1 h-4 w-4" style={{ color: category.accent }} />
                <p className="text-[11px] text-slate-400">Scan limit</p>
                <p className="text-sm font-bold">
                  {!data.scanLimit ? "Unlimited" : data.scanLimit}
                </p>
              </div>
              <div>
                <Clock className="mx-auto mb-1 h-4 w-4" style={{ color: category.accent }} />
                <p className="text-[11px] text-slate-400">Expires</p>
                <p className="text-sm font-bold">
                  {data.expiresAt ? formatDate(data.expiresAt) : "Never"}
                </p>
              </div>
            </div>
          )}

          {metadataEntries.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Package className="h-4 w-4" style={{ color: category.accent }} />
                Product information
              </p>
              <div className="grid grid-cols-2 gap-3">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/10 p-3">
                    <p className="text-[11px] text-slate-400">{formatLabel(key)}</p>
                    <p className="break-words text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.createdAt && (
            <p className="text-xs text-slate-500">
              Registered {formatDate(data.createdAt)}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500">
        Protected by{" "}
        <Link href="/" className="font-medium text-slate-300 hover:text-white">
          Blockmec
        </Link>
      </p>
    </div>
  );
}
