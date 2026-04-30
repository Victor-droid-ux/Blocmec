"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Menu, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/dashboard/user-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store/store";
import { ROUTES } from "@/config/routes";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.current);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const displayName = user?.name;
  const displayEmail = user?.email;

  const handleCreateNewFile = () => {
    router.push(ROUTES.DASHBOARD.CREATE_FILE);
  };

  return (
    <div className='flex min-h-screen bg-[#1a1625] text-white'>
      <Sidebar open={sidebarOpen} />

      <div className='flex flex-1 flex-col'>
        <header className='sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#2a2139] bg-[#1a1625] px-4'>
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Toggle Menu</span>
          </Button>

          <div className='flex items-center gap-2'>
            <div className='h-8 w-8 rounded-full bg-white'></div>
            <div>
              <div className='flex items-center'>
                <h2 className='text-lg font-semibold'>Hello {displayName}</h2>
                <span className='ml-2 rounded-md bg-purple-800 px-2 py-0.5 text-xs text-purple-200'>
                  organization
                </span>
              </div>
              <p className='text-sm text-gray-400'>{displayEmail}</p>
            </div>
          </div>

          <div className='ml-auto flex items-center gap-4'>
            <Button
              className='bg-purple-600 hover:bg-purple-700'
              onClick={handleCreateNewFile}
            >
              <Plus className='mr-2 h-4 w-4' />
              Create New File
            </Button>
            <UserNav />
          </div>
        </header>

        <main className={cn("flex-1 p-4", className)} {...props}>
          {children}
        </main>
      </div>
    </div>
  );
}
