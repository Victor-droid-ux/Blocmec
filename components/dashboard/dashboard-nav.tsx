"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BarChart3, CreditCard, Home, Package, Settings, Users } from "lucide-react";
import { ROUTES } from "@/config/routes";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD.ROOT,
    icon: Home,
  },
  {
    title: "Users",
    href: ROUTES.DASHBOARD.USERS,
    icon: Users,
  },
  {
    title: "Products",
    href: ROUTES.DASHBOARD.PRODUCTS,
    icon: Package,
  },
  {
    title: "Billing",
    href: ROUTES.DASHBOARD.BUILLING,
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: ROUTES.DASHBOARD.ANALYTICS,
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: ROUTES.DASHBOARD.SETTINGS,
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className='grid items-start gap-2 py-4'>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start",
          )}
        >
          <item.icon className='mr-2 h-4 w-4' />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
