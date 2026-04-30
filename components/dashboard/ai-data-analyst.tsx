"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Play,
  Save,
  Activity,
  Database,
  Code,
  Brain,
  Zap,
  Loader2,
  TableIcon,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/endpoints";
import Image from "next/image";

interface QueryResult {
  id: string;
  query: string;
  data: Record<string, any>[];
  executionTime: number;
  timestamp: Date;
  rowCount: number;
  type: "sql" | "analytics" | "security";
}

interface AnalyticsSummary {
  totalVerifications: number;
  successRate: number;
  activeQrCodes: number;
  avgResponseTimeMs: number | null;
}

interface AnalyticsInsight {
  id: string;
  severity: "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

const SAMPLE_QUERIES = [
  "SELECT product_type, COUNT(*) as count FROM verifications GROUP BY product_type ORDER BY count DESC LIMIT 10",
  "SELECT DATE(created_at) as date, COUNT(*) as verifications FROM verifications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date",
  "SELECT region, COUNT(*) as total, AVG(response_time) as avg_time FROM verifications GROUP BY region ORDER BY total DESC",
  "SELECT status, COUNT(*) as count FROM verifications GROUP BY status",
  "SELECT manufacturer, COUNT(*) as products FROM products GROUP BY manufacturer ORDER BY products DESC LIMIT 10",
  "SELECT DATE(created_at) as date, COUNT(*) as scans, SUM(CASE WHEN status='verified' THEN 1 ELSE 0 END) as verified FROM qr_scans GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30",
];

export function AiDataAnalyst() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [savedQueries, setSavedQueries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("query");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [viewModes, setViewModes] = useState<
    Record<string, "table" | "bar" | "line" | "pie" | "area">
  >({});

  useEffect(() => {
    if (activeTab !== "insights") {
      return;
    }

    let mounted = true;

    const fetchInsightsData = async () => {
      setIsInsightsLoading(true);

      try {
        const [summaryRes, insightsRes] = await Promise.all([
          fetch(API_ENDPOINTS.ADMIN.ANALYTICS_SUMMARY),
          fetch(API_ENDPOINTS.ADMIN.ANALYTICS_INSIGHTS),
        ]);

        if (!summaryRes.ok || !insightsRes.ok) {
          throw new Error("Failed to load analytics insights");
        }

        const [summaryData, insightsData] = await Promise.all([
          summaryRes.json(),
          insightsRes.json(),
        ]);

        if (!mounted) {
          return;
        }

        setSummary(summaryData);
        setInsights(insightsData.insights ?? []);
      } catch {
        if (!mounted) {
          return;
        }

        toast({
          title: "Analytics unavailable",
          description: "Could not load summary and insights data.",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setIsInsightsLoading(false);
        }
      }
    };

    fetchInsightsData();

    return () => {
      mounted = false;
    };
  }, [activeTab, toast]);

  const executeQuery = async () => {
    if (!query.trim()) return;
    setIsExecuting(true);

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.ANALYTICS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error("Query failed");
      const result = await res.json();

      const newResult: QueryResult = {
        id: Date.now().toString(),
        query: query.trim(),
        data: result.data,
        executionTime: result.executionTime,
        timestamp: new Date(),
        rowCount: result.data.length,
        type: "sql",
      };

      setResults((prev) => [newResult, ...prev]);
      setViewModes((prev) => ({ ...prev, [newResult.id]: "table" }));
      toast({
        title: "Query executed",
        description: `${newResult.rowCount} rows in ${newResult.executionTime.toFixed(0)}ms`,
      });
    } catch (err) {
      toast({
        title: "Query failed",
        description: "Could not execute query.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveQuery = () => {
    if (!query.trim()) return;
    setSavedQueries((prev) => [...prev, query.trim()]);
    toast({
      title: "Query saved",
      description: "Query has been added to your saved queries",
    });
  };

  const exportToCSV = (result: QueryResult) => {
    if (result.data.length === 0) return;
    const headers = Object.keys(result.data[0]);
    const csvContent = [
      headers.join(","),
      ...result.data.map((row) =>
        headers.map((header) => row[header]).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-result-${result.id}.csv`;
    a.click();
  };

  const exportToJSON = (result: QueryResult) => {
    const jsonContent = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-result-${result.id}.json`;
    a.click();
  };

  const setViewMode = (
    resultId: string,
    mode: "table" | "bar" | "line" | "pie" | "area",
  ) => {
    setViewModes((prev) => ({ ...prev, [resultId]: mode }));
  };

  const renderTable = (data: Record<string, any>[]) => {
    if (data.length === 0)
      return <p className="text-gray-400">No data to display</p>;
    const headers = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto rounded-lg border border-purple-800/30">
        <table className="w-full">
          <thead className="bg-purple-900/20">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-semibold text-purple-200 capitalize"
                >
                  {header.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-purple-800/30 hover:bg-purple-900/10 transition-colors"
              >
                {headers.map((header) => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-300">
                    {typeof row[header] === "number" &&
                    !Number.isInteger(row[header])
                      ? row[header].toFixed(2)
                      : row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBarChart = (data: Record<string, any>[]) => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]);
    const labelKey = keys[0];
    const valueKey =
      keys.find((k) => typeof data[0][k] === "number") || keys[1];
    const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0));
    return (
      <div className="space-y-3">
        {data.map((item, idx) => {
          const value = Number(item[valueKey]) || 0;
          const percentage = (value / maxValue) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{item[labelKey]}</span>
                <span className="text-purple-400 font-semibold">
                  {value.toLocaleString()}
                </span>
              </div>
              <div className="h-8 bg-purple-900/20 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-all duration-1000 ease-out flex items-center justify-end px-3"
                  style={{ width: `${percentage}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = (data: Record<string, any>[]) => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]);
    const valueKey =
      keys.find((k) => typeof data[0][k] === "number" && k !== "id") || keys[1];
    const values = data.map((d) => Number(d[valueKey]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const width = 600;
    const height = 300;
    const padding = 40;
    const xStep = (width - 2 * padding) / (data.length - 1 || 1);
    const yScale = (height - 2 * padding) / (maxValue - minValue || 1);
    const points = data
      .map((item, idx) => {
        const x = padding + idx * xStep;
        const y =
          height - padding - (Number(item[valueKey]) - minValue) * yScale;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <div className="flex justify-center overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="bg-purple-900/10 rounded-lg"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + (i * (height - 2 * padding)) / 4}
              x2={width - padding}
              y2={padding + (i * (height - 2 * padding)) / 4}
              stroke="rgba(168, 85, 247, 0.1)"
              strokeWidth="1"
            />
          ))}
          <polyline
            points={points}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
          />
          {data.map((item, idx) => {
            const x = padding + idx * xStep;
            const y =
              height - padding - (Number(item[valueKey]) - minValue) * yScale;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="5" fill="#a855f7" />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fill="#d8b4fe"
                  fontSize="12"
                >
                  {item[valueKey]}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  const renderPieChart = (data: Record<string, any>[]) => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]);
    const labelKey = keys[0];
    const valueKey =
      keys.find((k) => typeof data[0][k] === "number") || keys[1];
    const total = data.reduce(
      (sum, item) => sum + (Number(item[valueKey]) || 0),
      0,
    );
    let currentAngle = 0;
    const colors = [
      "#a855f7",
      "#ec4899",
      "#f97316",
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
    ];
    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 40;
    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <svg width={size} height={size}>
          {data.map((item, idx) => {
            const value = Number(item[valueKey]) || 0;
            const angle = (value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            const x1 =
              centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 =
              centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            const largeArc = angle > 180 ? 1 : 0;
            const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            currentAngle += angle;
            return (
              <path
                key={idx}
                d={path}
                fill={colors[idx % colors.length]}
                opacity="0.8"
                stroke="#1a1625"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="space-y-2">
          {data.map((item, idx) => {
            const value = Number(item[valueKey]) || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-sm text-gray-300">
                  {item[labelKey]}:{" "}
                  <span className="font-semibold text-purple-400">
                    {value.toLocaleString()} ({percentage}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAreaChart = (data: Record<string, any>[]) => {
    if (data.length === 0) return null;
    const keys = Object.keys(data[0]);
    const valueKey =
      keys.find((k) => typeof data[0][k] === "number" && k !== "id") || keys[1];
    const values = data.map((d) => Number(d[valueKey]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const width = 600;
    const height = 300;
    const padding = 40;
    const xStep = (width - 2 * padding) / (data.length - 1 || 1);
    const yScale = (height - 2 * padding) / (maxValue - minValue || 1);
    const points = data
      .map((item, idx) => {
        const x = padding + idx * xStep;
        const y =
          height - padding - (Number(item[valueKey]) - minValue) * yScale;
        return `${x},${y}`;
      })
      .join(" ");
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
    return (
      <div className="flex justify-center overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="bg-purple-900/10 rounded-lg"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + (i * (height - 2 * padding)) / 4}
              x2={width - padding}
              y2={padding + (i * (height - 2 * padding)) / 4}
              stroke="rgba(168, 85, 247, 0.1)"
              strokeWidth="1"
            />
          ))}
          <polygon
            points={areaPoints}
            fill="url(#areaGradient)"
            opacity="0.5"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
          />
          {data.map((item, idx) => {
            const x = padding + idx * xStep;
            const y =
              height - padding - (Number(item[valueKey]) - minValue) * yScale;
            return <circle key={idx} cx={x} cy={y} r="4" fill="#ec4899" />;
          })}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-[#1a1625] to-[#231c35] border-[#2a2139] text-white shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-24">
              <Image
                src="/images/1base-logo.png"
                alt="1BASE"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                1BASE Data Analyst
              </CardTitle>
              <CardDescription className="text-gray-400">
                Advanced SQL analytics with multi-view visualizations
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-green-400 border-green-400/50"
          >
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#2a2139]/50 p-1 mb-6">
            <TabsTrigger
              value="query"
              className="data-[state=active]:bg-purple-600"
            >
              <Code className="h-4 w-4 mr-2" />
              Query Editor
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-purple-600"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-[#1a1625] rounded-lg border border-[#2a2139] p-4">
                  <Textarea
                    placeholder="SELECT * FROM qr_verifications WHERE created_at >= '2024-01-01' ORDER BY created_at DESC LIMIT 100"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-transparent border-none text-white font-mono min-h-[120px] resize-none focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2139]">
                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={executeQuery}
                        disabled={isExecuting || !query.trim()}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute Query
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#2a2139] bg-[#2a2139]/30"
                        onClick={saveQuery}
                        disabled={!query.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <span className="text-xs text-gray-400">
                      Ctrl+Enter to execute
                    </span>
                  </div>
                </div>

                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="bg-[#1a1625] border-[#2a2139]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400">
                            Success
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {result.timestamp.toLocaleTimeString()} •{" "}
                            {result.executionTime.toFixed(0)}ms •{" "}
                            {result.rowCount} rows
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToCSV(result)}
                            className="border-purple-800/30 text-purple-400"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToJSON(result)}
                            className="border-purple-800/30 text-purple-400"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            JSON
                          </Button>
                        </div>
                      </div>
                      <pre className="text-xs text-gray-400 font-mono bg-[#2a2139]/30 p-2 rounded overflow-x-auto">
                        {result.query}
                      </pre>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#2a2139]">
                        <span className="text-sm text-gray-400 mr-2">
                          View:
                        </span>
                        {(["table", "bar", "line", "pie", "area"] as const).map(
                          (mode) => {
                            const icons = {
                              table: TableIcon,
                              bar: BarChart3,
                              line: LineChart,
                              pie: PieChart,
                              area: TrendingUp,
                            };
                            const Icon = icons[mode];
                            return (
                              <Button
                                key={mode}
                                size="sm"
                                variant={
                                  viewModes[result.id] === mode
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => setViewMode(result.id, mode)}
                                className={
                                  viewModes[result.id] === mode
                                    ? "bg-purple-600"
                                    : "border-[#2a2139]"
                                }
                              >
                                <Icon className="h-4 w-4 mr-1" />
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                              </Button>
                            );
                          },
                        )}
                      </div>
                      <div className="bg-[#2a2139]/20 p-4 rounded-lg">
                        {viewModes[result.id] === "table" &&
                          renderTable(result.data)}
                        {viewModes[result.id] === "bar" &&
                          renderBarChart(result.data)}
                        {viewModes[result.id] === "line" &&
                          renderLineChart(result.data)}
                        {viewModes[result.id] === "pie" &&
                          renderPieChart(result.data)}
                        {viewModes[result.id] === "area" &&
                          renderAreaChart(result.data)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-[#2a2139]/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {result.rowCount}
                          </div>
                          <div className="text-xs text-gray-400">Rows</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {Object.keys(result.data[0] || {}).length}
                          </div>
                          <div className="text-xs text-gray-400">Columns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {result.executionTime.toFixed(0)}ms
                          </div>
                          <div className="text-xs text-gray-400">Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">
                      No queries executed yet
                    </p>
                    <p className="text-sm">
                      Write a SQL query and click Execute to see results
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Card className="bg-[#1a1625] border-[#2a2139]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Sample Queries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {SAMPLE_QUERIES.map((sampleQuery, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className="w-full text-left justify-start h-auto p-2 text-xs text-gray-400 hover:text-white hover:bg-[#2a2139]"
                        onClick={() => setQuery(sampleQuery)}
                      >
                        <Code className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {sampleQuery.substring(0, 40)}...
                        </span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1625] border-[#2a2139]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Saved Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedQueries.length > 0 ? (
                      <div className="space-y-2">
                        {savedQueries.map((savedQuery, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="w-full text-left justify-start h-auto p-2 text-xs text-gray-400 hover:text-white hover:bg-[#2a2139]"
                            onClick={() => setQuery(savedQuery)}
                          >
                            <Save className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {savedQuery.substring(0, 35)}...
                            </span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">
                        No saved queries yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1625] border-[#2a2139]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Queries:</span>
                      <span className="text-white font-medium">
                        {results.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Saved:</span>
                      <span className="text-white font-medium">
                        {savedQueries.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg Time:</span>
                      <span className="text-green-400 font-medium">
                        {results.length > 0
                          ? (
                              results.reduce(
                                (sum, r) => sum + r.executionTime,
                                0,
                              ) / results.length
                            ).toFixed(0)
                          : 0}
                        ms
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1a1625] border-[#2a2139]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    Real-time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#2a2139]/30 p-3 rounded">
                      <div className="text-xs text-gray-400">
                        Total Verifications
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {isInsightsLoading
                          ? "..."
                          : (summary?.totalVerifications ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#2a2139]/30 p-3 rounded">
                      <div className="text-xs text-gray-400">Success Rate</div>
                      <div className="text-lg font-semibold text-white">
                        {isInsightsLoading
                          ? "..."
                          : `${summary?.successRate ?? 0}%`}
                      </div>
                    </div>
                    <div className="bg-[#2a2139]/30 p-3 rounded">
                      <div className="text-xs text-gray-400">
                        Active QR Codes
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {isInsightsLoading
                          ? "..."
                          : (summary?.activeQrCodes ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#2a2139]/30 p-3 rounded">
                      <div className="text-xs text-gray-400">
                        Avg Response Time
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {isInsightsLoading
                          ? "..."
                          : summary?.avgResponseTimeMs != null
                            ? `${summary.avgResponseTimeMs} ms`
                            : "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1625] border-[#2a2139]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isInsightsLoading ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Loading insights...
                    </p>
                  ) : insights.length > 0 ? (
                    <div className="space-y-3">
                      {insights.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-[#2a2139] bg-[#2a2139]/30 p-3"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                                item.severity === "positive"
                                  ? "bg-green-400"
                                  : item.severity === "warning"
                                    ? "bg-yellow-400"
                                    : "bg-blue-400"
                              }`}
                            />
                            <h4 className="text-sm font-medium text-white">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No insights available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
