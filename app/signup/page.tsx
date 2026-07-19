import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";
import { ROUTES } from "@/config/routes";

export const metadata: Metadata = {
  title: "Create Account - Blockmec",
  description:
    "Create your Blockmec company account to generate and verify secure product QR codes.",
};

export default async function SignupPage() {
  const supabase = await createOptionalServerSupabaseClient();

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      redirect(ROUTES.DASHBOARD.ROOT);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-800 to-blue-900 flex-col justify-center items-center p-12">
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
            Start With Blockmec
          </h1>

          <p className="text-cyan-100 text-lg mb-8">
            Launch your anti-counterfeit verification workspace in minutes.
          </p>

          <div className="space-y-3 text-left text-cyan-50">
            <p>1. Create your company account</p>
            <p>2. Generate secure product QR batches</p>
            <p>3. Track verification activity in your dashboard</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
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

          <LoginForm defaultTab="signup" />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={ROUTES.LOGIN} className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
