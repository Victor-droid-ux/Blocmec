"use client";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: "dashboard", label: "dashboard", path: ROUTES.DASHBOARD.ROOT },
    { id: "batch-files", label: "batch files", path: ROUTES.DASHBOARD.BATCH_FILES },
    { id: "developer", label: "developer", path: ROUTES.DASHBOARD.DEVELOPER },
  ];

  const getActiveTab = () => {
    if (pathname === ROUTES.DASHBOARD.ROOT) return "dashboard";
    if (pathname === ROUTES.DASHBOARD.BATCH_FILES) return "batch-files";
    if (pathname === ROUTES.DASHBOARD.DEVELOPER) return "developer";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className='mb-6'>
      <div className='flex space-x-1'>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.path}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#231c35]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
