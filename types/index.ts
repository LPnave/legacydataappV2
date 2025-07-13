// Backend-aligned interfaces
export interface User {
  UserID: string
  Email: string
  Name?: string
  Role: 'PM' | 'Developer'
  CreatedAt: Date
  UpdatedAt: Date
}

export interface Project {
  ProjectID: string
  Title: string
  Description?: string
  Status: 'Working' | 'Review' | 'Ready'
  CreatedBy: string
  CreatedByName?: string
  CreatedAt: Date
  UpdatedAt: Date
  pagesCount?: number
}

// Frontend convenience interface for project creation
export interface CreateProjectData {
  title: string
  createdBy: string
  status: string
  description?: string
}

export interface Page {
  PageID: string
  ProjectID: string
  Title?: string
  ScreenshotPath: string
  Order: number
  PositionX?: number
  PositionY?: number
  CreatedAt: Date
  UpdatedAt: Date
}

// Frontend convenience interface for page creation
export interface CreatePageData {
  projectId: string
  title: string
  screenshotPath: string
  order: number
}

export interface Workflow {
  WorkflowID: string
  FromPageID: string
  ToPageID: string
  Label?: string
  CreatedAt: Date
}

// Frontend convenience interface for workflow creation
export interface CreateWorkflowData {
  fromPageId: string
  toPageId: string
  label?: string
}

export interface Comment {
  CommentID: string
  PageID: string
  UserID: string
  UserName?: string
  Content: string
  CreatedAt: Date
}

// Frontend convenience interface for comment creation
export interface CreateCommentData {
  pageId: string
  content: string
}

export interface PDFReport {
  ReportID: string
  ProjectID: string
  GeneratedAt: Date
  FilePath: string
}

// Legacy interfaces for backward compatibility (will be removed)
export interface Screen {
  id: string
  projectId: string
  name: string
  comments: string
  imageUrl: string
  position: { x: number; y: number }
  isBlankScreen: boolean
}

export interface Connection {
  id: string
  projectId: string
  fromScreenId: string
  toScreenId: string
  type: "navigation" | "modal" | "conditional"
  label?: string
}
