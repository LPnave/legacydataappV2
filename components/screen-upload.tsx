"use client"

import type React from "react"

import { useRef, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Plus, Loader2 } from "lucide-react"
import type { Page } from "@/types"
import { createPage } from "@/lib/api"

interface ScreenUploadProps {
  projectId: string
  onScreensUploaded: (pages: Page[]) => void
}

export function ScreenUpload({ projectId, onScreensUploaded }: ScreenUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      setUploading(true)
      const newPages: Page[] = []

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.startsWith("image/")) {
            // For now, we'll use a placeholder URL
            // In a real implementation, you'd upload to Supabase or similar
            const imageUrl = URL.createObjectURL(file)

            // Calculate position in grid (5 per row)
            const row = Math.floor(i / 5)
            const col = i % 5
            const x = 100 + col * 320 // 320px spacing (280px card width + 40px gap)
            const y = 100 + row * 240 // 240px spacing (200px card height + 40px gap)

            try {
              const page = await createPage({
                projectId,
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                screenshotPath: imageUrl, // This should be the uploaded URL
                order: i + 1,
              })
              newPages.push(page)
            } catch (error) {
              console.error('Failed to create page:', error)
              // Create a local page object as fallback
              const fallbackPage: Page = {
                PageID: Date.now().toString() + i,
                ProjectID: projectId,
                Title: file.name.replace(/\.[^/.]+$/, ""),
                ScreenshotPath: imageUrl,
                Order: i + 1,
                PositionX: x,
                PositionY: y,
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
              }
              newPages.push(fallbackPage)
            }
          }
        }

        if (newPages.length > 0) {
          onScreensUploaded(newPages)
        }
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setUploading(false)
      }
    },
    [projectId, onScreensUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleAddBlankScreen = async () => {
    setUploading(true)
    try {
      const page = await createPage({
        projectId,
        title: "New Screen",
        screenshotPath: "", // Empty for blank screen
        order: 1,
      })
      onScreensUploaded([page])
    } catch (error) {
      console.error('Failed to create blank page:', error)
      // Create a local page object as fallback
      const fallbackPage: Page = {
        PageID: Date.now().toString(),
        ProjectID: projectId,
        Title: "New Screen",
        ScreenshotPath: "",
        Order: 1,
        PositionX: 100,
        PositionY: 100,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      }
      onScreensUploaded([fallbackPage])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            )}
            <p className="text-lg text-gray-600 mb-2">
              {uploading ? 'Uploading...' : 'Drop screenshots here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB each • Supports batch upload</p>
            <p className="text-xs text-gray-400 mt-2">Screenshots will be arranged in rows of 5 on the canvas</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </CardContent>
      </Card>

      {/* Add Blank Screen */}
      <Button 
        variant="outline" 
        onClick={handleAddBlankScreen} 
        className="w-full border-dashed bg-transparent"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        Add Blank Screen
      </Button>
    </div>
  )
}
