"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

const navigation = [
  {
    name: "Dashboard",
    href: ROUTES.ADMIN.ROOT,
    icon: BarChart3,
    tab: "overview",
  },
  {
    name: "User Management",
    href: ROUTES.ADMIN.USERS,
    icon: Users,
    tab: "users",
  },
  {
    name: "System Logs",
    href: ROUTES.ADMIN.LOGS,
    icon: FileText,
    tab: "logs",
  },
  {
    name: "Data Analyst",
    href: ROUTES.ADMIN.ANALYST,
    icon: Database,
    tab: "analyst",
  },
  {
    name: "System Health",
    href: ROUTES.ADMIN.HEALTH,
    icon: Activity,
    tab: "health",
  },
  {
    name: "Settings",
    href: ROUTES.ADMIN.SETTINGS,
    icon: Settings,
    tab: "settings",
  },
];

export function AdminSidebar() {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    signOut();
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-800'>
        {!collapsed && (
          <div className='flex items-center space-x-2'>
            <Shield className='h-8 w-8 text-red-500' />
            <span className='text-xl font-bold'>Admin Panel</span>
          </div>
        )}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setCollapsed(!collapsed)}
          className='text-gray-400 hover:text-white hover:bg-gray-800'
        >
          {collapsed ? (
            <ChevronRight className='h-4 w-4' />
          ) : (
            <ChevronLeft className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1 px-3 py-4'>
        <nav className='space-y-2'>
          {navigation.map((item) => {
            const isActive = item.tab === "overview" ? pathname === item.href : pathname === item.href || pathname.includes(`tab=${item.tab}`);
            const linkHref = item.tab === "overview" ? item.href : `${ROUTES.ADMIN.ROOT}?tab=${item.tab}`;
            return (
              <Link key={item.name} href={linkHref}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    isActive
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-gray-300 hover:text-white hover:bg-gray-800",
                    collapsed && "px-2",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className='p-3 border-t border-gray-800'>
        <Button
          variant='ghost'
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
            collapsed && "px-2",
          )}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
