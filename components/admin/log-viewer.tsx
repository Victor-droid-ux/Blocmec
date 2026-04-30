"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { API_ENDPOINTS } from "@/config/endpoints";

interface LogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  username?: string;
  action: string;
  type: "info" | "warning" | "error" | "user_action" | "system";
  message?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.LOGS);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to load system logs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
    toast({
      title: "Success",
      description: "Logs refreshed successfully.",
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Type", "Message", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.username || "N/A",
          log.action,
          log.type,
          log.message || "",
          log.ipAddress || "N/A",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Logs exported successfully.",
    });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "all" || log.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, filterType]);

  const getTypeBadge = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return <Badge variant='destructive'>Error</Badge>;
      case "warning":
        return (
          <Badge variant='default' className='bg-yellow-100 text-yellow-800'>
            Warning
          </Badge>
        );
      case "user_action":
        return (
          <Badge variant='default' className='bg-blue-100 text-blue-800'>
            User Action
          </Badge>
        );
      case "system":
        return (
          <Badge variant='default' className='bg-purple-100 text-purple-800'>
            System
          </Badge>
        );
      case "info":
      default:
        return <Badge variant='outline'>Info</Badge>;
    }
  };

  const getRowClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case "user_action":
        return "bg-blue-50 dark:bg-blue-900/10";
      case "system":
        return "bg-purple-50 dark:bg-purple-900/10";
      case "info":
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto'>
          <div className='relative w-full md:w-80'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search logs...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-full md:w-[180px]'>
              <Filter className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='info'>Info</SelectItem>
              <SelectItem value='warning'>Warning</SelectItem>
              <SelectItem value='error'>Error</SelectItem>
              <SelectItem value='user_action'>User Action</SelectItem>
              <SelectItem value='system'>System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='w-full md:w-auto bg-transparent'
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant='outline'
            onClick={handleExport}
            className='w-full md:w-auto bg-transparent'
          >
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action / Message</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className={getRowClass(log.type)}>
                  <TableCell className='font-medium'>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.username || "System"}</TableCell>
                  <TableCell className='max-w-md'>
                    <div className='truncate' title={log.message || log.action}>
                      {log.message || log.action}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(log.type)}</TableCell>
                  <TableCell className='font-mono text-sm'>
                    {log.ipAddress || "N/A"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <div>
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
