"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  onImageChange: (base64Image: string | null) => void
  defaultImage?: string | null
  label?: string
  description?: string
}

export function ImageUpload({
  onImageChange,
  defaultImage = null,
  label = "Product Image",
  description = "Upload an image for this item",
}: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(defaultImage)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)

    if (!file) {
      // User canceled file selection or cleared the input
      return
    }

    // Validate file type
    if (!file.type || !file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large. Please select an image under 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Image = event.target?.result as string
      if (base64Image) {
        setImage(base64Image)
        onImageChange(base64Image)
      } else {
        setError("Failed to read the image file.")
      }
    }
    reader.onerror = () => {
      setError("An error occurred while reading the file.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageChange(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="mt-1">
        {image ? (
          <div className="relative rounded-lg border border-[#2a2139] overflow-hidden bg-[#1a1625] p-1">
            <div className="relative aspect-square w-full max-w-[200px] rounded-lg overflow-hidden">
              <Image
                src={image || "/placeholder.svg"}
                alt="Uploaded image"
                fill
                sizes="(max-width: 768px) 100vw, 200px"
                className="object-cover"
                onError={() => {
                  setError("Failed to load the image.")
                  setImage(null)
                  onImageChange(null)
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a2139] bg-[#1a1625] p-6 cursor-pointer hover:bg-[#1d182a] transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2139]">
              <ImageIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{description}</p>
              <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
            <Button
              variant="outline"
              className="mt-4 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Image
            </Button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}
