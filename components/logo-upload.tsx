"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Building2 } from "lucide-react"
import Image from "next/image"

interface LogoUploadProps {
  onLogoChange: (base64Logo: string | null) => void
  defaultLogo?: string | null
  label?: string
  description?: string
}

export function LogoUpload({
  onLogoChange,
  defaultLogo = null,
  label = "Brand Logo",
  description = "Upload your brand logo",
}: LogoUploadProps) {
  const [logo, setLogo] = useState<string | null>(defaultLogo)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)

    if (!file) {
      return
    }

    if (!file.type || !file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Logo file is too large. Please select an image under 3MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Logo = event.target?.result as string
      if (base64Logo) {
        setLogo(base64Logo)
        onLogoChange(base64Logo)
      } else {
        setError("Failed to read the logo file.")
      }
    }
    reader.onerror = () => {
      setError("An error occurred while reading the file.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onLogoChange(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="mt-1">
        {logo ? (
          <div className="relative rounded-lg border border-[#2a2139] overflow-hidden bg-[#1a1625] p-1">
            <div className="relative aspect-square w-full max-w-[120px] rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <Image
                src={logo || "/placeholder.svg"}
                alt="Brand logo"
                fill
                sizes="120px"
                className="object-contain p-2"
                onError={() => {
                  setError("Failed to load the logo.")
                  setLogo(null)
                  onLogoChange(null)
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-600/80 hover:bg-red-700"
              onClick={handleRemoveLogo}
            >
              <X className="h-4 w-4 text-white" />
              <span className="sr-only">Remove logo</span>
            </Button>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a2139] bg-[#1a1625] p-6 cursor-pointer hover:bg-[#1d182a] transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2139]">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{description}</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG or GIF (max. 3MB)</p>
            </div>
            <Button
              variant="outline"
              className="mt-4 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Logo
            </Button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}
