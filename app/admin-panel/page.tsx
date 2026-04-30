"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserManagement } from "@/components/admin/user-management";
import { LogViewer } from "@/components/admin/log-viewer";
import { AiDataAnalyst } from "@/components/dashboard/ai-data-analyst";
import {
  Users,
  Database,
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalQrCodes: number;
  totalBatches: number;
  totalTransactions: number;
}

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  time: string;
  status: "success" | "warning";
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalQrCodes: 0,
    totalBatches: 0,
    totalTransactions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, monitor system health, and oversee platform operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalUsers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              QR Codes Generated
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalQrCodes.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalBatches.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalTransactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="analyst">Data Analyst</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system events and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          {activity.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(activity.time)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Key numbers at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {loading ? "..." : stats.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Users
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {loading ? "..." : stats.totalQrCodes.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      QR Codes
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {loading ? "..." : stats.totalBatches.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Batches</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {loading
                        ? "..."
                        : stats.totalTransactions.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Transactions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts, roles, and API credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Logs</span>
              </CardTitle>
              <CardDescription>
                Monitor system events, errors, and user activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyst">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>1BASE Data Analyst</span>
              </CardTitle>
              <CardDescription>
                Advanced analytics and insights powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AiDataAnalyst />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
