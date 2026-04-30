import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Blockmec - Blockchain Data Verification",
  description: "The Chain for data verification and counterfeit elimination",
};

export default async function HomePage() {
  const supabase = await createOptionalServerSupabaseClient();

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // server-side redirect
      redirect(ROUTES.DASHBOARD.ROOT);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-800 to-blue-900 flex-col justify-center items-center p-12">
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

          <h1 className="text-4xl font-bold text-white mb-6">Blockmec Chain</h1>

          <p className="text-blue-200 text-xl mb-8">
            The Chain for data verification and counterfeit elimination. Secure
            your products with blockchain technology.
          </p>

          <div className="space-y-4">
            {[
              "QR Code Generation & Verification",
              "Blockchain-based Authentication",
              "Counterfeit Protection",
              "Real-time Data Verification",
            ].map((feature) => (
              <div key={feature} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-200"
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
                <p className="text-blue-100">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Admin login link */}
          <div className="mb-6 text-right">
            <Link href={ROUTES.ADMIN.LOGIN}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                Admin Login
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

          <LoginForm />

          {/* <div className='mt-6 text-center text-sm text-muted-foreground'>
            <p>Demo credentials: user@blockmec.org / userpass</p>
            <p className='mt-2'>
              Need help?{" "}
              <Link href='/support' className='text-blue-600 hover:underline'>
                Contact Support
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
