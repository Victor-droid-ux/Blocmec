"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, Settings, ImageIcon } from "lucide-react";

interface ProductLandingPropertiesProps {
  productType: string;
  productData?: any;
}

export function ProductLandingProperties({
  productType,
  productData,
}: ProductLandingPropertiesProps) {
  const typeLabel = productType.replace(/-/g, " ").toUpperCase();

  return (
    <Card className='mt-6 bg-[#231c35] border-[#2a2139]'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Globe className='h-5 w-5 text-purple-400' />
          Landing Page & Properties
        </CardTitle>
        <CardDescription>
          Configure how this product appears online and its properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='landing' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 bg-[#1a1625]'>
            <TabsTrigger value='landing' className='data-[state=active]:bg-purple-600'>
              <Globe className='h-4 w-4 mr-2' />
              Landing
            </TabsTrigger>
            <TabsTrigger value='properties' className='data-[state=active]:bg-purple-600'>
              <Settings className='h-4 w-4 mr-2' />
              Properties
            </TabsTrigger>
          </TabsList>

          <TabsContent value='landing' className='space-y-4 mt-4'>
            <div className='bg-[#1a1625] rounded-lg p-4 space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Landing Page URL
                </label>
                <div className='flex items-center bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm font-mono'>
                  <span className='text-gray-500'>https://blockmec.app/verify/</span>
                  <span className='text-purple-400'>
                    {productData?.id || "product-id"}
                  </span>
                </div>
                <p className='text-xs text-gray-400'>
                  Share this URL for instant product verification
                </p>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Landing Page Title
                </label>
                <input
                  type='text'
                  placeholder={`Verify ${typeLabel}`}
                  defaultValue={`Verify ${typeLabel}`}
                  className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Landing Page Description
                </label>
                <textarea
                  placeholder='Enter a description that appears on the verification landing page...'
                  defaultValue={`Verify the authenticity of this ${typeLabel.toLowerCase()} product using our blockchain-powered verification system.`}
                  className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none'
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Featured Image (Landing Page)
                </label>
                <div className='border-2 border-dashed border-[#2a2139] rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer'>
                  <ImageIcon className='h-8 w-8 mx-auto text-gray-500 mb-2' />
                  <p className='text-sm text-gray-400'>
                    Click to upload or drag and drop
                  </p>
                  <p className='text-xs text-gray-500'>PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Custom Call-to-Action (CTA)
                </label>
                <input
                  type='text'
                  placeholder="e.g., 'Verify Product' or 'Check Authenticity'"
                  defaultValue='Verify Authenticity'
                  className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              <div className='bg-blue-900/20 border border-blue-800/30 rounded p-3'>
                <p className='text-xs text-blue-200'>
                  ℹ️ The landing page will automatically be generated and hosted on
                  Blockmec. Anyone can verify this product by scanning the QR code or
                  visiting the URL above.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='properties' className='space-y-4 mt-4'>
            <div className='bg-[#1a1625] rounded-lg p-4 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-purple-200'>
                    Product Type
                  </label>
                  <div className='bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm flex items-center justify-between'>
                    <span>{typeLabel}</span>
                    <Badge
                      variant='outline'
                      className='bg-purple-600/20 border-purple-600/50'
                    >
                      {typeLabel}
                    </Badge>
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-purple-200'>
                    Verification Requirement
                  </label>
                  <select className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'>
                    <option>Automatic (Always Verified)</option>
                    <option>Manual (Admin Review)</option>
                    <option>Timed (24 hours)</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-purple-200'>
                    Allow Sharing
                  </label>
                  <select className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'>
                    <option>Yes - Allow Users to Share</option>
                    <option>No - Disable Sharing</option>
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-purple-200'>
                    Verification Badge
                  </label>
                  <select className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'>
                    <option>Show Badge (Green checkmark)</option>
                    <option>Hide Badge</option>
                    <option>Custom Badge</option>
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Additional Properties (JSON)
                </label>
                <textarea
                  placeholder={`{
  "warranty": "2 years",
  "color": "blue",
  "rating": "4.5/5"
}`}
                  className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono'
                  rows={4}
                />
                <p className='text-xs text-gray-400'>
                  Define custom properties as JSON for your product
                </p>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-purple-200'>
                  Product Tags
                </label>
                <input
                  type='text'
                  placeholder='e.g., authentic, limited-edition, premium'
                  className='w-full bg-[#0f0a15] border border-[#2a2139] rounded p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
                <p className='text-xs text-gray-400'>
                  Separate tags with commas for better searchability
                </p>
              </div>

              <div className='bg-blue-900/20 border border-blue-800/30 rounded p-3'>
                <p className='text-xs text-blue-200'>
                  ℹ️ Properties are stored on the blockchain and cannot be modified.
                  Choose your properties carefully before finalizing batch creation.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
