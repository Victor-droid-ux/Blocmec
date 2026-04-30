"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import AdminGuard from "@/components/admin/admin-guard";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Admin Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6'>
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
