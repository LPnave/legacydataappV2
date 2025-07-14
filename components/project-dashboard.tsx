"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, User, Building2, Monitor, FileText, Settings, Trash2, Hash, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Project, CreateProjectData } from "@/types"
import { fetchProjects, createProject, deleteProject, fetchUserById } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useRouter } from "next/navigation"

const statusColors = {
  Working: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Review: "bg-blue-100 text-blue-800 border-blue-200",
  Ready: "bg-green-100 text-green-800 border-green-200",
}

const sourceSystemIcons = {
  athenahealth: "🏥",
  Epic: "⚡",
  Cerner: "🔷",
  Other: "💻",
}

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pmFilter, setPmFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pmNames, setPmNames] = useState<{ [userId: string]: string }>({})
  const [newProject, setNewProject] = useState<CreateProjectData>({
    title: "",
    createdBy: "",
    status: "Working",
    description: "",
  })
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/');
      return;
    }
    loadProjects();
  }, [router]);

  const loadProjects = async () => {
    
    try {
      setLoading(true);
      const projectsData = await fetchProjects();
      setProjects(projectsData);
      
      // Fetch PM names for all unique CreatedBy IDs
      const ids = Array.from(new Set(projectsData.map((p: Project) => p.CreatedBy)));
      const names: { [userId: string]: string } = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const user = await fetchUserById(id);
          names[id] = user.Name || id;
        } catch {
          names[id] = id;
        }
      }));
      setPmNames(names);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.Title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.Status === statusFilter
    const matchesPM = pmFilter === "all" || project.CreatedBy === pmFilter
    return matchesSearch && matchesStatus && matchesPM
  })

  const handleCreateProject = async () => {
    if (newProject.title && newProject.createdBy) {
      try {
        const project = await createProject(newProject);
        setProjects([...projects, project]);
        setNewProject({ title: "", createdBy: "", status: "Working", description: "" });
        setIsNewProjectOpen(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to create project');
      }
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This will also delete all screens and connections.")) {
      try {
        await deleteProject(projectId);
        setProjects(projects.filter(p => p.ProjectID !== projectId));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete project');
      }
    }
  }

  const handleLogout = () => {
    auth.logout();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <Image src="/lda-logo.png" alt="Legacy Data Access" width={200} height={40} className="h-8 w-auto" />
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ScreenFlow Capture</h1>
                <p className="text-gray-600 text-sm">Healthcare Workflow Mapping</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Workflow Project</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="projectName">Project Name *</Label>
                      <Input
                        id="projectName"
                        placeholder="e.g., Griffin OBGYN athenahealth Migration"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Project description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pmAssigned">Assigned PM *</Label>
                        <Select
                          value={newProject.createdBy}
                          onValueChange={(value) =>
                            setNewProject({ ...newProject, createdBy: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select PM" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MaryNeal">MaryNeal</SelectItem>
                            <SelectItem value="PM2">PM2</SelectItem>
                            <SelectItem value="PM3">PM3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newProject.status}
                          onValueChange={(value) =>
                            setNewProject({ ...newProject, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Working">Working</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Ready">Ready</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject} className="bg-teal-600 hover:bg-teal-700">
                        Create Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Working">Working</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pmFilter">PM</Label>
            <Select value={pmFilter} onValueChange={setPmFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All PMs</SelectItem>
                {Object.entries(pmNames).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={loadProjects} className="w-full">
              Refresh
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.ProjectID} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {project.Title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[project.Status as keyof typeof statusColors]}>
                        {project.Status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project.ProjectID)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{pmNames[project.CreatedBy] || project.CreatedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{project.pagesCount || 0} screens</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.CreatedAt).toLocaleDateString()}</span>
                  </div>
                  {project.Description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.Description}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/project/${project.ProjectID}`}>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">
                      Open Workflow
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Create your first workflow project to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
