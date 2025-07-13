"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Check, X, LinkIcon, Edit2 } from "lucide-react"
import Image from "next/image"
import type { Screen } from "@/types"
import { WysiwygEditor } from "./wysiwyg-editor"

interface ScreenCardProps {
  screen: Screen
  onUpdate: (screen: Screen) => void
  onDelete: (screenId: string) => void
  onStartConnection: (screenId: string) => void
  onViewLarge: (screen: Screen) => void
  isConnecting: boolean
  isConnectionSource: boolean
  isConnectionTarget: boolean
  onConnectTargetClick?: () => void
  style?: React.CSSProperties
}

export function ScreenCard({
  screen,
  onUpdate,
  onDelete,
  onStartConnection,
  onViewLarge,
  isConnecting,
  isConnectionSource,
  isConnectionTarget,
  onConnectTargetClick,
  style,
}: ScreenCardProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editName, setEditName] = useState(screen.name)
  const [editComments, setEditComments] = useState(screen.comments)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleNameEdit = () => {
    setIsEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const handleNameSave = () => {
    onUpdate({ ...screen, name: editName })
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setEditName(screen.name)
    setIsEditingName(false)
  }

  const handleCommentsEdit = () => {
    setIsEditingComments(true)
  }

  const handleCommentsSave = () => {
    onUpdate({ ...screen, comments: editComments })
    setIsEditingComments(false)
  }

  const handleCommentsCancel = () => {
    setEditComments(screen.comments)
    setIsEditingComments(false)
  }

  // Strip HTML tags for display in card view
  const getPlainTextComments = (html: string) => {
    const div = document.createElement("div")
    div.innerHTML = html
    return div.textContent || div.innerText || ""
  }

  return (
    <Card
      className={`absolute w-[280px] h-[200px] cursor-move transition-all ${
        isConnectionSource
          ? "ring-2 ring-blue-500 shadow-lg"
          : isConnectionTarget
            ? "ring-2 ring-green-500 shadow-lg"
            : onConnectTargetClick
              ? "ring-2 ring-yellow-400 shadow-lg cursor-pointer"
              : "hover:shadow-md"
      }`}
      style={style}
    >
      {/* Connection Point */}
      {!isConnecting && (
        <Button
          size="sm"
          variant="outline"
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-teal-600 hover:bg-teal-700 border-white z-10"
          onClick={() => onStartConnection(screen.id)}
          title="Connect to another screen"
        >
          <LinkIcon className="w-3 h-3 text-white" />
        </Button>
      )}

      {/* Target indicator when connecting */}
      {isConnecting && !isConnectionSource && (
        <div
          className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white z-10 ${
            isConnectionTarget ? "bg-green-500 animate-pulse" : "bg-gray-400"
          }`}
        />
      )}

      {/* Clickable overlay for connection mode */}
      {onConnectTargetClick && (
        <div
          className="absolute inset-0 bg-transparent z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onConnectTargetClick()
          }}
          title="Click to connect to this screen"
        />
      )}

      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-6 text-sm font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave()
                    if (e.key === "Escape") handleNameCancel()
                  }}
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleNameSave}>
                  <Check className="w-3 h-3 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleNameCancel}>
                  <X className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <div
                className="font-medium text-sm cursor-pointer hover:bg-gray-100 p-1 rounded truncate"
                onClick={handleNameEdit}
                title="Click to edit name"
              >
                {screen.name || "Untitled Screen"}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {screen.isBlankScreen && (
              <Badge variant="outline" className="text-xs">
                Blank
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={() => onDelete(screen.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div
          className="flex-1 bg-gray-100 rounded mb-2 overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => onViewLarge(screen)}
          title="Click to view larger"
        >
          {screen.isBlankScreen ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Blank Screen</div>
          ) : (
            <Image
              src={screen.imageUrl || "/placeholder.svg"}
              alt={screen.name}
              width={280}
              height={120}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Comments */}
        <div className="min-h-[20px]">
          {isEditingComments ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
                <h3 className="text-lg font-semibold mb-4">Edit Comments</h3>
                <WysiwygEditor
                  value={editComments}
                  onChange={setEditComments}
                  onSave={handleCommentsSave}
                  onCancel={handleCommentsCancel}
                  placeholder="Add comments about this screen..."
                />
              </div>
            </div>
          ) : (
            <div
              className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[16px] flex items-center gap-1"
              onClick={handleCommentsEdit}
              title="Click to edit comments"
            >
              <Edit2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {screen.comments ? getPlainTextComments(screen.comments) : "Click to add comments..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
