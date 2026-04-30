"use client";

import { cn } from "@/lib/utils";
import { BarChart2, FileText, Settings, User } from "lucide-react"; // Removed Shield icon
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ROUTES } from "@/config/routes";
// Removed useEffect and useState for isAdmin as it's no longer part of this sidebar

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: User, path: ROUTES.DASHBOARD.PROFILE, label: "Profile" },
    { icon: FileText, path: ROUTES.DASHBOARD.BATCH_FILES, label: "Batch Files" },
    { icon: BarChart2, path: ROUTES.DASHBOARD.ROOT, label: "Dashboard" },
    { icon: Settings, path: ROUTES.DASHBOARD.SETTINGS, label: "Settings" },
    // Admin link removed from here
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-16 flex-col border-r border-[#2a2139] bg-[#1a1625] transition-all duration-300 md:relative",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className='flex h-16 items-center justify-center border-b border-[#2a2139]'>
        <div className='flex h-10 w-10 items-center justify-center'>
          <Image
            src='/images/blockmec-logo.png'
            alt='Blockmec Logo'
            width={40}
            height={40}
            className='rounded-full'
          />
        </div>
      </div>
      <nav className='flex flex-1 flex-col gap-2 p-2'>
        {navItems.map((item, index) => (
          <button
            key={index}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors group",
              pathname.startsWith(item.path)
                ? "bg-[#231c35] text-purple-400"
                : "hover:bg-[#231c35] text-white",
            )}
            onClick={() => handleNavigation(item.path)}
            aria-label={item.label}
          >
            <item.icon className='h-5 w-5' />
            <span className='sr-only'>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
