"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    router.replace(`/verification-results${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500" />
    </div>
  );
}

/**
 * Older per-category result routes are kept as redirects so existing printed
 * links keep working. All of them now render through the unified result page,
 * which themes itself using the product category.
 */
export default function LegacyResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500" />
        </div>
      }
    >
      <Redirect />
    </Suspense>
  );
}
