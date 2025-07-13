"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, List, ListOrdered, Link, Type, Check, X } from "lucide-react"

interface WysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  placeholder?: string
  className?: string
}

export function WysiwygEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Add comments...",
  className = "",
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isLinkMode, setIsLinkMode] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      onSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  const insertLink = () => {
    if (linkUrl) {
      handleCommand("createLink", linkUrl)
      setIsLinkMode(false)
      setLinkUrl("")
    }
  }

  const formatText = (format: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      handleCommand(format)
    }
  }

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => formatText("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => formatText("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => formatText("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleCommand("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleCommand("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsLinkMode(!isLinkMode)}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleCommand("foreColor", "#3B82F6")}
          title="Blue Text"
        >
          <Type className="w-4 h-4 text-blue-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleCommand("foreColor", "#EF4444")}
          title="Red Text"
        >
          <Type className="w-4 h-4 text-red-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleCommand("foreColor", "#10B981")}
          title="Green Text"
        >
          <Type className="w-4 h-4 text-green-500" />
        </Button>
      </div>

      {/* Link Input */}
      {isLinkMode && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border-b">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border rounded"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                insertLink()
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={insertLink} disabled={!linkUrl}>
            Insert
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsLinkMode(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[100px] p-3 focus:outline-none"
        onInput={updateContent}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: "100px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Action Buttons */}
      <div className="flex justify-between items-center p-2 border-t bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500">Press Ctrl+Enter to save, Escape to cancel</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} className="bg-teal-600 hover:bg-teal-700">
            <Check className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin-left: 20px;
          margin-bottom: 8px;
        }
        [contenteditable] li {
          margin-bottom: 4px;
        }
        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
