import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";
import { ROUTES } from "@/config/routes";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin Login - Blockmec",
  description: "Administrator access to Blockmec Admin Panel",
};

export default async function AdminLoginPage() {
  const supabase = await createOptionalServerSupabaseClient();
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;

  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { supabase_id: session.user.id },
      });

      // If user exists and is admin -> redirect to admin dashboard
      if (user && user.role === "admin") {
        // adjust ROUTES.ADMIN.DASHBOARD to whatever constant you use
        redirect(ROUTES.ADMIN.ROOT);
      }

      // If user exists but is NOT admin -> redirect to normal dashboard
      if (user) {
        redirect(ROUTES.DASHBOARD.ROOT);
      }
    } catch (err) {
      // log server-side errors (don't reveal to client)
      console.error("AdminLoginPage prisma lookup error:", err);
      // fall through and render login UI
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-800 to-red-900 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <Image
              src="/images/blockmec-logo.png"
              alt="Blockmec Logo"
              width={120}
              height={120}
              className="rounded-full bg-black p-2 mx-auto"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold text-white mb-6">
            Blockmec Admin Panel
          </h1>

          <p className="text-red-200 text-xl mb-8">
            Secure administrative access to manage users, monitor system logs,
            and oversee platform operations.
          </p>

          <div className="space-y-4">
            {[
              "User account management",
              "System monitoring & logs",
              "API credit administration",
              "Security & access control",
            ].map((feature) => (
              <div key={feature} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-100">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Back to main login */}
          <div className="mb-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to User Login
              </Button>
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image
              src="/images/blockmec-logo.png"
              alt="Blockmec Logo"
              width={80}
              height={80}
              className="rounded-full bg-black p-2"
              priority
            />
          </div>

          <AdminLoginForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact system administrator</p>
            <p className="mt-2">Demo: info@blockmec.org / Akachukwu1@1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
