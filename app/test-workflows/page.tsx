'use client'

import { useState } from 'react'
import { InfiniteCanvas } from '@/components/infinite-canvas'
import { Page, Workflow } from '@/types'

export default function TestWorkflowsPage() {
  const [pages] = useState<Page[]>([
    {
      PageID: '1',
      ProjectID: 'test',
      Title: 'Home Screen',
      ScreenshotPath: '',
      Order: 1,
      PositionX: 100,
      PositionY: 100,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    },
    {
      PageID: '2',
      ProjectID: 'test',
      Title: 'Login Screen',
      ScreenshotPath: '',
      Order: 2,
      PositionX: 400,
      PositionY: 100,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    },
    {
      PageID: '3',
      ProjectID: 'test',
      Title: 'Dashboard',
      ScreenshotPath: '',
      Order: 3,
      PositionX: 700,
      PositionY: 100,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    },
  ])

  const [workflows] = useState<Workflow[]>([
    {
      WorkflowID: '1',
      FromPageID: '1',
      ToPageID: '2',
      Label: 'Login',
      CreatedAt: new Date(),
    },
    {
      WorkflowID: '2',
      FromPageID: '2',
      ToPageID: '3',
      Label: 'Success',
      CreatedAt: new Date(),
    },
  ])

  const handleUpdatePage = async (page: Page) => {
    console.log('Update page:', page)
  }

  const handleDeletePage = async (pageId: string) => {
    console.log('Delete page:', pageId)
  }

  const handleCreateWorkflow = async (workflow: Omit<Workflow, "WorkflowID" | "CreatedAt">) => {
    console.log('Create workflow:', workflow)
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    console.log('Delete workflow:', workflowId)
  }

  return (
    <div className="h-screen">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Test Workflows</h1>
        <p className="text-gray-600">Testing workflow connection rendering</p>
        <div className="mt-2 text-sm">
          <p>Pages: {pages.length}</p>
          <p>Workflows: {workflows.length}</p>
        </div>
      </div>
      <div className="h-[calc(100vh-120px)]">
        <InfiniteCanvas
          projectId="test"
          pages={pages}
          workflows={workflows}
          onUpdatePage={handleUpdatePage}
          onDeletePage={handleDeletePage}
          onCreateWorkflow={handleCreateWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
        />
      </div>
    </div>
  )
} 