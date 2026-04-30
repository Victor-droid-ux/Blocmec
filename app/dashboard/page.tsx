"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiDataAnalyst } from "@/components/dashboard/ai-data-analyst";
import AuthGuard from "@/components/dashboard/auth-guard";
import { API_ENDPOINTS } from "@/config/endpoints";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface DashboardStats {
  totalQrCodes: number;
  expiredQrCodes: number;
  apiCredits: number;
  totalBatches: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQrCodes: 0,
    expiredQrCodes: 0,
    apiCredits: 0,
    totalBatches: 0,
  });
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.user.current);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.USER.STATS);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AuthGuard>
      <DashboardShell>
        <DashboardHeader />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#231c35] border-0 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold">
                {loading ? "..." : stats.totalQrCodes.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400">Total Files</p>
            </CardContent>
          </Card>
          <Card className="bg-[#231c35] border-0 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold">
                {loading ? "..." : stats.expiredQrCodes.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400">Expired QR Codes</p>
            </CardContent>
          </Card>
          <Card className="bg-[#231c35] border-0 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold">
                {loading ? "..." : stats.apiCredits.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400">API Credits</p>
            </CardContent>
          </Card>
          <Card className="bg-[#231c35] border-0 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold">
                {loading ? "..." : stats.totalBatches.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400">Batch Created</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6">
          <AiDataAnalyst />
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
