"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, ArrowLeft, Plus, Trash2, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import type { Project, Page, Workflow } from "@/types"
import { fetchProjectById, fetchPagesByProject, fetchWorkflowsByProject, updateProject, deletePage, deleteWorkflow, fetchUserById } from "@/lib/api"
import { auth } from "@/lib/auth"
import { InfiniteCanvas } from "@/components/infinite-canvas"
import { ScreenUpload } from "@/components/screen-upload"
import jsPDF from 'jspdf'

export default function ProjectPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.id as string
  const pmNameFromQuery = searchParams.get('pmName')

  // Core project state
  const [project, setProject] = useState<Project | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [activeTab, setActiveTab] = useState("canvas")
  const [isAddScreensOpen, setIsAddScreensOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pmName, setPmName] = useState<string>("");
  const [pmLoading, setPmLoading] = useState(false);

  // Check authentication and load project data
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/');
      return;
    }
    loadProjectData();
  }, [projectId, router]);

  useEffect(() => {
    if (project && project.CreatedBy) {
      setPmLoading(true);
      fetchUserById(project.CreatedBy)
        .then(user => setPmName(user.Name || user.Email || project.CreatedBy))
        .catch(() => setPmName(project.CreatedBy))
        .finally(() => setPmLoading(false));
    }
  }, [project]);

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const [projectData, pagesData, workflowsData] = await Promise.all([
        fetchProjectById(projectId),
        fetchPagesByProject(projectId),
        fetchWorkflowsByProject(projectId),
      ])

      setProject(projectData)
      setPages(pagesData)
      setWorkflows(workflowsData)
      // No need to fetch PM name from API anymore
    } catch (err: any) {
      console.error('Failed to load project data:', err)
      setError(err.response?.data?.error || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePage = async (updatedPage: Page) => {
    try {
      // This would need an updatePage API call
      // For now, just reload the data
      await loadProjectData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update page');
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (confirm("Are you sure you want to delete this screen?")) {
      try {
        await deletePage(pageId);
        await loadProjectData();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete page');
      }
    }
  }

  const handleScreensUploaded = async (newPages: Page[]) => {
    try {
      // This would need createPage API calls
      // For now, just reload the data
      await loadProjectData();
      setIsAddScreensOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload screens');
    }
  }

  const handleCreateWorkflow = async (workflowData: Omit<Workflow, "WorkflowID" | "CreatedAt">) => {
    try {
      const { createWorkflow } = await import('@/lib/api');
      await createWorkflow({
        fromPageId: workflowData.FromPageID,
        toPageId: workflowData.ToPageID,
        label: workflowData.Label,
      });
      await loadProjectData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create workflow');
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflow(workflowId);
      await loadProjectData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete workflow');
    }
  }

  const handleExportPDF = async () => {
    if (!project) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 15;
    const left = 15;
    const lineHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxImgWidth = pageWidth - 2 * left;
    const maxImgHeight = 60;

    // Project Info
    doc.setFontSize(18);
    doc.text(project.Title, left, y);
    y += lineHeight + 2;
    doc.setFontSize(12);
    doc.text(`PM: ${pmName || project.CreatedBy}`, left, y);
    y += lineHeight;
    doc.text(`Status: ${project.Status}`, left, y);
    y += lineHeight;
    doc.text(`Generated: ${new Date().toLocaleString()}`, left, y);
    y += lineHeight * 2;
    doc.setFontSize(15);
    doc.text('Workflow Overview', left, y);
    y += lineHeight * 1.5;
    doc.setFontSize(13);
    doc.text('Screens:', left, y);
    y += lineHeight;

    // Screens (images, titles, and comments)
    for (const page of pages) {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.text(page.Title || 'Untitled', left, y);
      doc.setFont('helvetica', 'normal');
      y += lineHeight;
      if (page.ScreenshotPath) {
        try {
          // Load image as base64 and preserve aspect ratio
          const imgData = await new Promise<{ dataUrl: string, width: number, height: number }>((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
              // Use naturalWidth/naturalHeight for accurate sizing
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              if (!w || !h) return reject(new Error('Image has invalid dimensions'));
              // Strict aspect ratio preservation
              const widthRatio = maxImgWidth / w;
              const heightRatio = maxImgHeight / h;
              const ratio = Math.min(widthRatio, heightRatio, 1);
              const scaledWidth = w * ratio;
              const scaledHeight = h * ratio;
              const canvas = document.createElement('canvas');
              canvas.width = scaledWidth;
              canvas.height = scaledHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, scaledWidth, scaledHeight);
              resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), width: scaledWidth, height: scaledHeight });
            };
            img.onerror = () => reject(new Error('Failed to load image for PDF export'));
            img.src = page.ScreenshotPath;
          });
          // Center image horizontally
          const xCentered = left + (maxImgWidth - imgData.width) / 2;
          doc.addImage(imgData.dataUrl, 'JPEG', xCentered, y, imgData.width, imgData.height);
          y += imgData.height + 4;
        } catch {
          doc.setFontSize(11);
          doc.text('(Image failed to load)', left, y);
          y += lineHeight;
        }
      } else {
        doc.setFontSize(11);
        doc.text('(No image)', left, y);
        y += lineHeight;
      }
      // Fetch and render comments for this page
      try {
        const { fetchCommentsByPage } = await import('@/lib/api');
        const comments = await fetchCommentsByPage(page.PageID);
        if (comments.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(60, 60, 60);
          doc.text('Comments:', left, y);
          y += lineHeight;
          doc.setFontSize(11);
          for (const c of comments) {
            let commentText = `- ${c.Content}`;
            if (c.UserName) commentText += ` (by ${c.UserName})`;
            if (c.CreatedAt) {
              const dateStr = new Date(c.CreatedAt).toLocaleString();
              commentText += ` [${dateStr}]`;
            }
            doc.text(commentText, left + 4, y);
            y += lineHeight;
            if (y > 270) { doc.addPage(); y = 15; }
          }
          doc.setTextColor(0, 0, 0);
        }
      } catch {}
      y += 2;
    }
    doc.save(`${project.Title.replace(/\s+/g, '_')}_workflow.pdf`);
  }

  const handleUpdateProjectStatus = async (status: Project["Status"]) => {
    if (!project) return;
    try {
      const updatedProject = await updateProject(project.ProjectID, { status });
      setProject(updatedProject);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project status');
    }
  }

  const handleLogout = () => {
    auth.logout();
  }

  if (loading || pmLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Working: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Review: "bg-blue-100 text-blue-800 border-blue-200",
    Ready: "bg-green-100 text-green-800 border-green-200",
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                <Image src="/lda-logo.png" alt="Legacy Data Access" width={200} height={40} className="h-8 w-auto" />
              </Link>
              <div className="h-8 w-px bg-gray-300" />
              <div>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{project.Title}</h1>
                <p className="text-gray-600">
                  PM: {pmName || project.CreatedBy} • {pages.length} screens
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={statusColors[project.Status as keyof typeof statusColors]}>
                {project.Status}
              </Badge>

              {/* Add Screens Modal - Only show when on canvas tab */}
              {activeTab === "canvas" && (
                <Dialog open={isAddScreensOpen} onOpenChange={setIsAddScreensOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Screens
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Add Screens to Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <p className="text-gray-600 mb-6">
                        Upload healthcare screenshots or create blank placeholder screens for your workflow.
                      </p>
                      <ScreenUpload projectId={projectId} onScreensUploaded={handleScreensUploaded} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="outline" onClick={handleExportPDF} disabled={pages.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={project.Status === "Working" ? "default" : "outline"}
                  onClick={() => handleUpdateProjectStatus("Working")}
                >
                  Working
                </Button>
                <Button
                  size="sm"
                  variant={project.Status === "Review" ? "default" : "outline"}
                  onClick={() => handleUpdateProjectStatus("Review")}
                >
                  Review
                </Button>
                <Button
                  size="sm"
                  variant={project.Status === "Ready" ? "default" : "outline"}
                  onClick={() => handleUpdateProjectStatus("Ready")}
                >
                  Ready
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canvas">Workflow Canvas</TabsTrigger>
              <TabsTrigger value="details">Project Details</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="canvas" className="flex-1">
            <InfiniteCanvas
              projectId={projectId}
              pages={pages}
              workflows={workflows}
              onUpdatePage={handleUpdatePage}
              onDeletePage={handleDeletePage}
              onCreateWorkflow={handleCreateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
            />
          </TabsContent>

          <TabsContent value="details" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Title:</span> {project.Title}
                    </div>
                    {project.Description && (
                      <div>
                        <span className="font-medium">Description:</span> {project.Description}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Status:</span> {project.Status}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(project.CreatedAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {new Date(project.UpdatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Workflow Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Total Screens:</span> {pages.length}
                    </div>
                    <div>
                      <span className="font-medium">Total Connections:</span> {workflows.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
