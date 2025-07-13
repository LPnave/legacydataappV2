"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RotateCcw, ZoomIn, ZoomOut, Edit2, Check, X, GitBranch, Shuffle } from "lucide-react"
import type { Page, Workflow } from "@/types"
import { ScreenCard } from "./screen-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { WysiwygEditor } from "./wysiwyg-editor"
import Image from "next/image"

interface InfiniteCanvasProps {
  projectId: string
  pages: Page[]
  workflows: Workflow[]
  onUpdatePage: (page: Page) => Promise<void>
  onDeletePage: (pageId: string) => Promise<void>
  onCreateWorkflow: (workflow: Omit<Workflow, "WorkflowID" | "CreatedAt">) => Promise<void>
  onDeleteWorkflow: (workflowId: string) => Promise<void>
}

const SCREEN_WIDTH = 280
const SCREEN_HEIGHT = 200
const HORIZONTAL_SPACING = 350 // Space between connected screens horizontally
const VERTICAL_SPACING = 250 // Space between screens vertically
const BRANCH_OFFSET = 120 // Reduced from 150 - offset for branching paths

export function InfiniteCanvas({
  projectId,
  pages,
  workflows,
  onUpdatePage,
  onDeletePage,
  onCreateWorkflow,
  onDeleteWorkflow,
}: InfiniteCanvasProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedScreen, setDraggedScreen] = useState<string | null>(null)
  const [dragScreenOffset, setDragScreenOffset] = useState({ x: 0, y: 0 })
  const [autoLayoutEnabled, setAutoLayoutEnabled] = useState(false)

  // Connection state
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionSource, setConnectionSource] = useState<string | null>(null)
  const [connectionTarget, setConnectionTarget] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)

  // Modal state
  const [viewLargeScreen, setViewLargeScreen] = useState<Page | null>(null)
  const [isEditingModalName, setIsEditingModalName] = useState(false)
  const [isEditingModalComments, setIsEditingModalComments] = useState(false)
  const [modalEditName, setModalEditName] = useState("")
  const [modalEditComments, setModalEditComments] = useState("")

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const modalNameInputRef = useRef<HTMLInputElement>(null)

  // Add a local state for screen positions
  const [localPositions, setLocalPositions] = useState<{ [id: string]: { x: number; y: number } }>({})

  // Add state for panning
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [panOffsetStart, setPanOffsetStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Build workflow graph from connections
  const buildWorkflowGraph = () => {
    const graph = new Map<string, { children: string[]; parents: string[]; level?: number; branch?: number }>()

    pages.forEach((page) => {
      graph.set(page.PageID, { children: [], parents: [] })
    })

    workflows.forEach((workflow) => {
      const from = graph.get(workflow.FromPageID)
      const to = graph.get(workflow.ToPageID)

      if (from && to) {
        from.children.push(workflow.ToPageID)
        to.parents.push(workflow.FromPageID)
      }
    })

    return graph
  }

  const calculateWorkflowLayout = () => {
    if (pages.length === 0) return new Map()

    const graph = buildWorkflowGraph()
    const positioned = new Set<string>()
    const newPositions = new Map<string, { x: number; y: number }>()

    // Find root nodes (screens with no parents)
    const rootNodes = Array.from(graph.entries())
      .filter(([_, data]) => data.parents.length === 0)
      .map(([id]) => id)

    // If no root nodes, find the screen with the most connections
    if (rootNodes.length === 0 && pages.length > 0) {
      const mostConnected = Array.from(graph.entries()).sort(
        (a, b) => b[1].children.length + b[1].parents.length - (a[1].children.length + a[1].parents.length),
      )[0]
      if (mostConnected) {
        rootNodes.push(mostConnected[0])
      }
    }

    // If still no roots, just use the first screen
    if (rootNodes.length === 0 && pages.length > 0) {
      rootNodes.push(pages[0].PageID)
    }

    // Position root nodes vertically with reasonable spacing
    let currentY = 100
    const rootSpacing = 300 // Reduced from previous calculation

    rootNodes.forEach((rootId, index) => {
      const startX = 100
      const startY = currentY + index * rootSpacing
      newPositions.set(rootId, { x: startX, y: startY })
      positioned.add(rootId)

      // Layout this workflow branch
      layoutBranch(rootId, startX, startY, graph, positioned, newPositions, 0)

      // Move to next root position
      currentY += rootSpacing
    })

    // Position any remaining unconnected screens in a compact grid
    const unconnected = pages.filter((page) => !positioned.has(page.PageID))
    if (unconnected.length > 0) {
      // Find the rightmost positioned screen to place unconnected screens
      let maxX = 100
      for (const pos of newPositions.values()) {
        maxX = Math.max(maxX, pos.x)
      }

      // Place unconnected screens in a grid to the right
      const gridStartX = maxX + HORIZONTAL_SPACING
      const gridStartY = 100

      unconnected.forEach((page, index) => {
        const col = index % 3 // 3 columns max
        const row = Math.floor(index / 3)
        const x = gridStartX + col * (SCREEN_WIDTH + 50)
        const y = gridStartY + row * (SCREEN_HEIGHT + 50)

        newPositions.set(page.PageID, { x, y })
      })
    }

    return newPositions
  }

  const hasPositionConflict = (x: number, y: number, positions: Map<string, { x: number; y: number }>) => {
    for (const pos of positions.values()) {
      if (Math.abs(pos.x - x) < SCREEN_WIDTH + 50 && Math.abs(pos.y - y) < SCREEN_HEIGHT + 50) {
        return true
      }
    }
    return false
  }

  const layoutBranch = (
    nodeId: string,
    baseX: number,
    baseY: number,
    graph: Map<string, { children: string[]; parents: string[] }>,
    positioned: Set<string>,
    positions: Map<string, { x: number; y: number }>,
    level: number,
  ) => {
    const node = graph.get(nodeId)
    if (!node) return

    const children = node.children.filter((childId) => !positioned.has(childId))

    if (children.length === 0) return

    if (children.length === 1) {
      // Single child - place directly to the right with consistent spacing
      const childX = baseX + HORIZONTAL_SPACING
      const childY = baseY
      positions.set(children[0], { x: childX, y: childY })
      positioned.add(children[0])

      // Continue with this child
      layoutBranch(children[0], childX, childY, graph, positioned, positions, level + 1)
    } else {
      // Multiple children - create compact branches
      const branchSpacing = Math.min(BRANCH_OFFSET, 120) // Limit branch spacing
      const totalHeight = (children.length - 1) * branchSpacing
      const startY = baseY - totalHeight / 2

      children.forEach((childId, index) => {
        const childX = baseX + HORIZONTAL_SPACING
        const childY = startY + index * branchSpacing
        positions.set(childId, { x: childX, y: childY })
        positioned.add(childId)

        // Continue with this child
        layoutBranch(childId, childX, childY, graph, positioned, positions, level + 1)
      })
    }
  }

  const calculateBranchHeight = (
    nodeId: string,
    graph: Map<string, { children: string[]; parents: string[] }>,
    visited = new Set<string>(),
  ): number => {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)

    const node = graph.get(nodeId)
    if (!node || node.children.length === 0) return SCREEN_HEIGHT

    const childHeights = node.children.map((childId) => calculateBranchHeight(childId, graph, visited))
    return Math.max(SCREEN_HEIGHT, ...childHeights)
  }

  const applyWorkflowLayout = () => {
    const newPositions = calculateWorkflowLayout()
    const updatedPages = pages.map((page) => {
      const position = newPositions.get(page.PageID)
      if (position) {
        return { ...page, PositionX: position.x, PositionY: position.y }
      }
      return page
    })

    // Update all pages with new positions
    updatedPages.forEach((page) => {
      onUpdatePage(page)
    })
  }

  // Update handleCanvasMouseDown to start panning if not dragging a card
  function handleCanvasMouseDown(e: React.MouseEvent) {
    // Only start panning if not dragging a card
    if (!draggingId) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setPanOffsetStart(offset)
    }
  }

  // Update mouse move handler to pan if isPanning
  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setOffset({ x: panOffsetStart.x + dx, y: panOffsetStart.y + dy })
    } else {
      handleScreenDrag(e)
    }
  }

  // Update mouse up/leave to stop panning
  function handleCanvasMouseUp() {
    setIsPanning(false)
    handleScreenDragEnd()
  }

  // Add custom drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Mouse handlers for drag
  function handleScreenDragStart(screenId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDraggingId(screenId)
    setDragStart({ x: e.clientX, y: e.clientY })
    const screen = screens.find(s => s.id === screenId)
    setDragStartPos({ x: screen?.position.x ?? 0, y: screen?.position.y ?? 0 })
  }
  function handleScreenDrag(e: React.MouseEvent) {
    if (!draggingId) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setDragOffset({ x: dx, y: dy })
  }
  async function handleScreenDragEnd() {
    if (!draggingId) return
    const screen = screens.find(s => s.id === draggingId)
    if (screen) {
      const newX = dragStartPos.x + dragOffset.x
      const newY = dragStartPos.y + dragOffset.y
      setLocalPositions((prev) => ({ ...prev, [screen.id]: { x: newX, y: newY } }))
      // Update backend in background
      const page = pages.find(p => p.PageID === screen.id)
      if (page) {
        import('@/lib/api').then(({ updatePage }) => {
          updatePage(page.PageID, { PositionX: newX, PositionY: newY })
        })
      }
    }
    setDraggingId(null)
    setDragOffset({ x: 0, y: 0 })
  }

  function handleScreenClick(pageId: string) {
    if (isConnecting && connectionSource && connectionSource !== pageId) {
      setConnectionTarget(pageId)
      // Create the workflow
      onCreateWorkflow({
        FromPageID: connectionSource,
        ToPageID: pageId,
        Label: "Navigation",
      })
      setIsConnecting(false)
      setConnectionSource(null)
      setConnectionTarget(null)
      setTempConnection(null)
    }
  }

  const handleStartConnection = (pageId: string) => {
    setIsConnecting(true)
    setConnectionSource(pageId)
  }

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.3))
  const handleResetView = () => {
    setScale(1)
    const screens = pages.map(convertPageToScreen)
    if (screens.length === 0) {
      setOffset({ x: 0, y: 0 })
      return
    }
    const { minX, minY, maxX, maxY } = getScreensBoundingBox(screens)
    const canvasWidth = window.innerWidth
    const canvasHeight = window.innerHeight - 200
    const screensWidth = maxX - minX
    const screensHeight = maxY - minY
    const centerX = (canvasWidth - screensWidth) / 2 - minX
    const centerY = (canvasHeight - screensHeight) / 2 - minY
    setOffset({ x: centerX, y: centerY })
  }

  const handleConnectionClick = (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this connection?")) {
      onDeleteWorkflow(workflowId)
    }
  }

  const handleViewLarge = (page: Page) => {
    setViewLargeScreen(page)
    setModalEditName(page.Title || "")
    setModalEditComments("") // Comments would need to be fetched separately
  }

  const handleModalNameEdit = () => {
    setIsEditingModalName(true)
    setTimeout(() => modalNameInputRef.current?.focus(), 0)
  }

  const handleModalNameSave = async () => {
    if (viewLargeScreen) {
      const updatedPage = { ...viewLargeScreen, Title: modalEditName }
      await onUpdatePage(updatedPage)
      setIsEditingModalName(false)
    }
  }

  const handleModalNameCancel = () => {
    setModalEditName(viewLargeScreen?.Title || "")
    setIsEditingModalName(false)
  }

  const handleModalCommentsEdit = () => {
    setIsEditingModalComments(true)
  }

  const handleModalCommentsSave = async () => {
    if (viewLargeScreen) {
      // Comments would need to be saved via API
      // For now, just close the editor
      setIsEditingModalComments(false)
    }
  }

  const handleModalCommentsCancel = () => {
    setModalEditComments("")
    setIsEditingModalComments(false)
  }

  // Convert Page to Screen format for ScreenCard component
  const convertPageToScreen = (page: Page) => ({
    id: page.PageID,
    projectId: page.ProjectID,
    name: page.Title || "Untitled",
    comments: "", // Comments would need to be fetched separately
    imageUrl: page.ScreenshotPath,
    position: { x: page.PositionX || 0, y: page.PositionY || 0 },
    isBlankScreen: !page.ScreenshotPath,
  })

  // Convert Workflow to Connection format for rendering
  const convertWorkflowToConnection = (workflow: Workflow) => ({
    id: workflow.WorkflowID,
    projectId,
    fromScreenId: workflow.FromPageID,
    toScreenId: workflow.ToPageID,
    type: "navigation" as const,
    label: workflow.Label,
  })

  const screens = pages.map(convertPageToScreen)
  const connections = workflows.map(convertWorkflowToConnection)

  // Debug logging
  console.log('InfiniteCanvas render:', {
    pagesCount: pages.length,
    workflowsCount: workflows.length,
    connectionsCount: connections.length,
  })

  // Helper to compute bounding box of all screens
  function getScreensBoundingBox(screens: any[]) {
    if (screens.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const s of screens) {
      minX = Math.min(minX, s.position.x)
      minY = Math.min(minY, s.position.y)
      maxX = Math.max(maxX, s.position.x + SCREEN_WIDTH)
      maxY = Math.max(maxY, s.position.y + SCREEN_HEIGHT)
    }
    return { minX, minY, maxX, maxY }
  }

  // Auto-center screens on initial render or when pages change
  useEffect(() => {
    const screens = pages.map(convertPageToScreen)
    if (screens.length === 0) return
    const { minX, minY, maxX, maxY } = getScreensBoundingBox(screens)
    // Center the bounding box in the viewport
    const canvasWidth = window.innerWidth
    const canvasHeight = window.innerHeight - 200 // header, tabs, etc.
    const screensWidth = maxX - minX
    const screensHeight = maxY - minY
    const centerX = (canvasWidth - screensWidth) / 2 - minX
    const centerY = (canvasHeight - screensHeight) / 2 - minY
    setOffset({ x: centerX, y: centerY })
  }, [pages.length])

  // When pages change (e.g., after reload), reset localPositions
  useEffect(() => {
    setLocalPositions({})
  }, [pages.map(p => p.PageID).join(",")])

  return (
    <div className="relative h-full overflow-hidden bg-gray-50" style={{ minHeight: '600px', minWidth: '100vw' }}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleResetView}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={applyWorkflowLayout}>
          <Shuffle className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Messages */}
      {isConnecting && (
        <div className="absolute top-4 right-4 z-10 bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm">
          Click on a target screen to create connection
        </div>
      )}

      {!isConnecting && connections.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm">
          Click connection lines to delete them
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{ minHeight: '600px', minWidth: '100vw' }}
      >
        <div
          className="relative"
          style={{
            minHeight: '600px',
            minWidth: '100vw',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Screens */}
          {screens.map((screen) => {
            const isDragging = draggedScreen === screen.id
            const pos = localPositions[screen.id] || screen.position
            const style = {
              left: isDragging ? dragStart.x + dragScreenOffset.x : pos.x,
              top: isDragging ? dragStart.y + dragScreenOffset.y : pos.y,
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              zIndex: isDragging ? 100 : 1,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'box-shadow 0.2s',
            }
            // Determine if this card is a valid connection target
            const isTargetCandidate = isConnecting && connectionSource && connectionSource !== screen.id
            return (
              <div
                key={screen.id}
                className="absolute"
                style={style}
                onMouseDown={(e) => handleScreenDragStart(screen.id, e)}
                onMouseMove={handleScreenDrag}
                onMouseUp={handleScreenDragEnd}
              >
                <ScreenCard
                  screen={screen}
                  onUpdate={(updatedScreen) => {
                    const page = pages.find(p => p.PageID === screen.id)
                    if (page) {
                      const updatedPage = {
                        ...page,
                        Title: updatedScreen.name,
                        Comments: updatedScreen.comments,
                      }
                      onUpdatePage(updatedPage)
                    }
                  }}
                  onDelete={() => onDeletePage(screen.id)}
                  onViewLarge={() => handleViewLarge(pages.find(p => p.PageID === screen.id)!)}
                  onStartConnection={() => handleStartConnection(screen.id)}
                  isConnecting={isConnecting}
                  isConnectionSource={connectionSource === screen.id}
                  isConnectionTarget={connectionTarget === screen.id}
                  onConnectTargetClick={isTargetCandidate ? () => handleScreenClick(screen.id) : undefined}
                />
              </div>
            )
          })}

          {/* Connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0"
            style={{ width: "100%", height: "100%" }}
          >
            {connections.map((connection) => {
              const fromScreen = screens.find((s) => s.id === connection.fromScreenId)
              const toScreen = screens.find((s) => s.id === connection.toScreenId)
              if (!fromScreen || !toScreen) return null
              const fromX = fromScreen.position.x + SCREEN_WIDTH / 2
              const fromY = fromScreen.position.y + SCREEN_HEIGHT / 2
              const toX = toScreen.position.x + SCREEN_WIDTH / 2
              const toY = toScreen.position.y + SCREEN_HEIGHT / 2
              // Bezier control points for a smooth curve
              const dx = Math.abs(toX - fromX) * 0.5
              const path = `M${fromX},${fromY} C${fromX + dx},${fromY} ${toX - dx},${toY} ${toX},${toY}`
              return (
                <g key={connection.id} className="pointer-events-auto">
                  <path
                    d={path}
                    stroke="#6b7280"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="cursor-pointer"
                    onClick={(e) => handleConnectionClick(connection.id, e)}
                  />
                  {connection.label && (
                    <text
                      x={(fromX + toX) / 2}
                      y={(fromY + toY) / 2 - 10}
                      textAnchor="middle"
                      className="text-xs fill-gray-600 pointer-events-none"
                    >
                      {connection.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Temporary connection line while connecting */}
            {isConnecting && connectionSource && tempConnection && (
              <g className="pointer-events-none">
                <line
                  x1={screens.find(s => s.id === connectionSource)?.position.x! + SCREEN_WIDTH / 2}
                  y1={screens.find(s => s.id === connectionSource)?.position.y! + SCREEN_HEIGHT / 2}
                  x2={tempConnection.x}
                  y2={tempConnection.y}
                  stroke={connectionTarget ? "#10B981" : "#3B82F6"}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </g>
            )}

            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
              >
                <polygon points="0 2, 10 6, 0 10" fill="#6b7280" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* Large Screen Modal */}
      <Dialog open={!!viewLargeScreen} onOpenChange={() => setViewLargeScreen(null)}>
        <DialogContent className="max-w-2xl w-full mx-auto mt-10" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditingModalName ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={modalNameInputRef}
                    value={modalEditName}
                    onChange={(e) => setModalEditName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleModalNameSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleModalNameCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{viewLargeScreen?.Title || "Untitled"}</span>
                  <Button size="sm" variant="ghost" onClick={handleModalNameEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewLargeScreen?.ScreenshotPath ? (
              <div className="relative">
                <Image
                  src={viewLargeScreen.ScreenshotPath}
                  alt={viewLargeScreen.Title || "Screen"}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Comments</h3>
                {isEditingModalComments ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleModalCommentsSave}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleModalCommentsCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={handleModalCommentsEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {isEditingModalComments ? (
                <WysiwygEditor
                  value={modalEditComments}
                  onChange={setModalEditComments}
                  onSave={handleModalCommentsSave}
                  onCancel={handleModalCommentsCancel}
                  placeholder="Add comments about this screen..."
                />
              ) : (
                <div className="prose max-w-none">
                  {modalEditComments || <span className="text-gray-500">No comments</span>}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
