"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, Zap, Globe, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/endpoints";

interface ApiKey {
  id: string;
  key_prefix: string;
  status: string;
}

async function fetchWithRetryOnServiceUnavailable(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 1,
) {
  try {
    const response = await fetch(input, init);

    if (response.status === 503 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fetchWithRetryOnServiceUnavailable(input, init, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fetchWithRetryOnServiceUnavailable(input, init, retries - 1);
    }

    throw error;
  }
}

export default function ScriptIntegration() {
  const { toast } = useToast();
  const [activeApiKeyId, setActiveApiKeyId] = useState("");
  const [domain, setDomain] = useState("nbltd.com/verify");
  const [scriptCode, setScriptCode] = useState(
    "Generate an active API key to enable script integration.",
  );
  const [copied, setCopied] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchApiKeys = async () => {
      try {
        const res = await fetchWithRetryOnServiceUnavailable(
          API_ENDPOINTS.USER.API_KEYS,
        );

        if (res.status === 503) {
          throw new Error("AUTH_SERVICE_UNAVAILABLE");
        }

        if (!res.ok) throw new Error("Failed to load API keys");

        const data = await res.json();
        const activeKey = (data.keys as ApiKey[] | undefined)?.find(
          (key) => key.status === "active",
        );

        if (mounted) {
          setActiveApiKeyId(activeKey?.id ?? "");
        }
      } catch (error) {
        if (mounted) {
          setActiveApiKeyId("");

          const isServiceUnavailable =
            error instanceof Error &&
            error.message === "AUTH_SERVICE_UNAVAILABLE";

          if (isServiceUnavailable) {
            toast({
              title: "API keys temporarily unavailable",
              description:
                "Authentication service is temporarily unavailable. Please try again shortly.",
              variant: "destructive",
            });
          }
        }
      } finally {
        if (mounted) {
          setIsLoadingKey(false);
        }
      }
    };

    fetchApiKeys();

    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    if (!activeApiKeyId) {
      setScriptCode("Generate an active API key to enable script integration.");
      setIsGeneratingScript(false);

      return () => {
        mounted = false;
      };
    }

    if (!domain.trim()) {
      setScriptCode("Enter a valid domain to generate your script.");
      setIsGeneratingScript(false);

      return () => {
        mounted = false;
      };
    }

    setIsGeneratingScript(true);

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(API_ENDPOINTS.USER.SCRIPT_TOKEN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKeyId: activeApiKeyId,
            domain: domain.trim(),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to generate script");
        }

        if (mounted) {
          setScriptCode(data.scriptTag);
        }
      } catch (error) {
        if (mounted) {
          setScriptCode("Unable to generate a secure script for this domain.");
        }
      } finally {
        if (mounted) {
          setIsGeneratingScript(false);
        }
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeApiKeyId, domain]);

  const handleCopy = () => {
    if (!activeApiKeyId || !scriptCode.startsWith("<script")) {
      toast({
        title: "Script unavailable",
        description:
          "Create an active API key and provide a valid domain first.",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Integration script copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Script Integration
        </h1>
        <p className="text-gray-400">
          Integrate Blockmec verification directly into your website with a
          simple script
        </p>
      </div>

      <Card className="bg-[#1a1625] border-[#2a2139]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-400" />
            Integration Script
          </CardTitle>
          <CardDescription>
            Add this script to your website's &lt;head&gt; section to enable QR
            code verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Domain</Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com/verify"
                className="bg-[#2a2139] border-[#3a3149] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Integration Script</Label>
              {isLoadingKey ? (
                <p className="text-sm text-gray-400">Loading your API key...</p>
              ) : !activeApiKeyId ? (
                <p className="text-sm text-yellow-400">
                  No active API key found. Create one from the Developer API
                  page to generate your script.
                </p>
              ) : isGeneratingScript ? (
                <p className="text-sm text-gray-400">
                  Generating a secure domain-bound script...
                </p>
              ) : null}
              <div className="relative">
                <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                  {scriptCode}
                </pre>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  disabled={!scriptCode.startsWith("<script")}
                  className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="features" className="w-full">
            <TabsList className="bg-[#2a2139]">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#2a2139] border-[#3a3149]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-white">
                        Auto-Detection
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Automatically detects QR codes in URL parameters and
                      displays verification results
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a2139] border-[#3a3149]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-white">
                        Customizable Widget
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Fully customizable verification widget that matches your
                      brand
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a2139] border-[#3a3149]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-green-400" />
                      </div>
                      <h3 className="font-semibold text-white">
                        Easy Integration
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Single script tag integration - no complex setup required
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a2139] border-[#3a3149]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                        <Code className="h-5 w-5 text-yellow-400" />
                      </div>
                      <h3 className="font-semibold text-white">
                        JavaScript API
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Programmatic access via JavaScript API for custom
                      integrations
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    1. Add the Script
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Add the integration script to your website's &lt;head&gt;
                    section:
                  </p>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {scriptCode}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">
                    2. QR Code Links
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    When users scan a QR code, redirect them to your domain with
                    the verification code:
                  </p>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {`https://${domain}?qr=ABC123XYZ`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">
                    3. Programmatic Verification
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    You can also trigger verification programmatically:
                  </p>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {`// Trigger verification manually
window.Blockmec.verify('ABC123XYZ');

// Listen for verification events
window.addEventListener('blockmec:verified', function(e) {
  console.log('Product verified:', e.detail);
});`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    HTML Integration
                  </h3>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {`<!DOCTYPE html>
<html>
<head>
  <title>Product Verification</title>
  ${scriptCode}
</head>
<body>
  <h1>Verify Your Product</h1>
   Verification widget will appear automatically 
</body>
</html>`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">
                    React Integration
                  </h3>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {`import { useEffect } from 'react';

function VerificationPage() {
  useEffect(() => {
    // Script will auto-load and handle verification
    const scriptMarkup = ${JSON.stringify(scriptCode)};
    document.head.insertAdjacentHTML('beforeend', scriptMarkup);

    return () => {
      document
        .querySelector('script[src*="/api/script/api.js"]')
        ?.remove();
    };
  }, []);

  return (
    <div>
      <h1>Product Verification</h1>
      {/* Widget will render here */}
    </div>
  );
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">
                    WordPress Integration
                  </h3>
                  <pre className="bg-[#2a2139] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-[#3a3149]">
                    {`// Add to your theme's functions.php
function add_blockmec_script() {
  ?>
  ${scriptCode}
  <?php
}
add_action('wp_head', 'add_blockmec_script');`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t border-[#3a3149] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-green-500/20 text-green-400">
                API Status: Active
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400">
                Version: 2.0
              </Badge>
            </div>
            <p className="text-sm text-gray-400">
              Need help with integration? Check out our{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">
                documentation
              </a>{" "}
              or{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">
                contact support
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1625] border-[#2a2139]">
        <CardHeader>
          <CardTitle>Testing Your Integration</CardTitle>
          <CardDescription>
            Use these test URLs to verify your integration is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">
              Test with QR Parameter:
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://${domain}?qr=TEST123ABC`}
                className="bg-[#2a2139] border-[#3a3149] text-white"
              />
              <Button
                onClick={() =>
                  window.open(`https://${domain}?qr=TEST123ABC`, "_blank")
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                Test
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-400">
              Test with Verify Parameter:
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://${domain}?verify=SAMPLE456DEF`}
                className="bg-[#2a2139] border-[#3a3149] text-white"
              />
              <Button
                onClick={() =>
                  window.open(`https://${domain}?verify=SAMPLE456DEF`, "_blank")
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
