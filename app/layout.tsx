import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/providers/storeProviders";
import { AuthProvider } from "@/providers/useAuthProvider";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blockmec - Blockchain Verification Platform",
  description: "Secure product verification using blockchain technology",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ErrorBoundary>
          <StoreProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
