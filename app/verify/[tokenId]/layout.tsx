// app/verify/[tokenId]/layout.tsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

export default function VerifyLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const tokenId = params.tokenId as string;
  const productType = searchParams?.get("type") || "default";

  // Add category-based styling or metadata here
  const categoryStyles: Record<string, string> = {
    "luxury": "bg-gradient-to-br from-amber-900 to-slate-900",
    "luxury-goods": "bg-gradient-to-br from-amber-900 to-slate-900",
    "jewelry": "bg-gradient-to-br from-emerald-900 to-slate-900",
    "food": "bg-gradient-to-br from-orange-900 to-slate-900",
    "food-beverages": "bg-gradient-to-br from-orange-900 to-slate-900",
    "pharmaceuticals": "bg-gradient-to-br from-blue-900 to-slate-900",
    "medicine": "bg-gradient-to-br from-blue-900 to-slate-900",
    "technology": "bg-gradient-to-br from-cyan-900 to-slate-900",
    "electronics": "bg-gradient-to-br from-cyan-900 to-slate-900",
    "textiles": "bg-gradient-to-br from-purple-900 to-slate-900",
    "fashion": "bg-gradient-to-br from-purple-900 to-slate-900",
    "default": "bg-slate-900",
  };

  const bgClass = categoryStyles[productType.toLowerCase()] || categoryStyles["default"];

  return (
    <div className={bgClass}>
      {children}
    </div>
  );
}
