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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced error suppression and localStorage safety
              (function() {
                // Store original console methods
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                // Disable problematic console methods initially
                console.error = function(...args) {
                  const message = args.join(' ').toLowerCase();
                  if (message.includes('metamask') || 
                      message.includes('ethereum') || 
                      message.includes('web3') ||
                      message.includes('wallet') ||
                      message.includes('failed to connect') ||
                      message.includes('unhandled promise rejection')) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args.join(' ').toLowerCase();
                  if (message.includes('metamask') || 
                      message.includes('ethereum') || 
                      message.includes('web3') ||
                      message.includes('wallet')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
                
                // Disable Web3 objects immediately
                if (typeof window !== 'undefined') {
                  try {
                    Object.defineProperty(window, 'ethereum', {
                      value: undefined,
                      writable: false,
                      configurable: false
                    });
                    
                    Object.defineProperty(window, 'web3', {
                      value: undefined,
                      writable: false,
                      configurable: false
                    });
                    
                    Object.defineProperty(window, 'Web3', {
                      value: undefined,
                      writable: false,
                      configurable: false
                    });
                  } catch (e) {
                    // Ignore errors when setting these properties
                  }
                }
                
                // Handle unhandled promise rejections
                window.addEventListener('unhandledrejection', function(event) {
                  const message = event.reason?.message || event.reason || '';
                  if (typeof message === 'string' && 
                      (message.toLowerCase().includes('metamask') ||
                       message.toLowerCase().includes('ethereum') ||
                       message.toLowerCase().includes('web3') ||
                       message.toLowerCase().includes('wallet') ||
                       message.toLowerCase().includes('failed to connect'))) {
                    event.preventDefault();
                    return false;
                  }
                });
                
                // Handle errors
                window.addEventListener('error', function(event) {
                  const message = event.message || '';
                  if (message.toLowerCase().includes('metamask') ||
                      message.toLowerCase().includes('ethereum') ||
                      message.toLowerCase().includes('web3') ||
                      message.toLowerCase().includes('wallet')) {
                    event.preventDefault();
                    return false;
                  }
                });
                
                // Enhanced localStorage safety
                try {
                  if (typeof Storage !== 'undefined' && window.localStorage) {
                    // Test localStorage availability
                    const testKey = '__test__';
                    localStorage.setItem(testKey, 'test');
                    localStorage.removeItem(testKey);
                    
                    // localStorage is working, enhance it with error handling
                    const originalSetItem = localStorage.setItem;
                    const originalGetItem = localStorage.getItem;
                    const originalRemoveItem = localStorage.removeItem;
                    
                    localStorage.setItem = function(key, value) {
                      try {
                        return originalSetItem.call(this, key, value);
                      } catch (e) {
                        console.warn('localStorage.setItem failed:', e);
                        return null;
                      }
                    };
                    
                    localStorage.getItem = function(key) {
                      try {
                        return originalGetItem.call(this, key);
                      } catch (e) {
                        console.warn('localStorage.getItem failed:', e);
                        return null;
                      }
                    };
                    
                    localStorage.removeItem = function(key) {
                      try {
                        return originalRemoveItem.call(this, key);
                      } catch (e) {
                        console.warn('localStorage.removeItem failed:', e);
                        return null;
                      }
                    };
                  }
                } catch (e) {
                  console.warn('localStorage enhancement failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <StoreProvider>
            <AuthProvider>
              <ThemeProvider
                attribute='class'
                defaultTheme='dark'
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
