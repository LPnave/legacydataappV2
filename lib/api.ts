import axios from 'axios';
import { config } from './config';

// Add interceptor to include Bearer token in all requests
axios.interceptors.request.use((axiosConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    axiosConfig.headers = axiosConfig.headers || {};
    axiosConfig.headers['Authorization'] = `Bearer ${token}`;
  }
  return axiosConfig;
});

// Authentication
export async function login({ email, password }: { email: string; password: string }) {
  const res = await axios.post(`${config.API_BASE_URL}/auth/login`, { email, password });
  return res.data; // { user, token }
}

export async function register({ name, email, password, role }: { name?: string; email: string; password: string; role: string }) {
  const res = await axios.post(`${config.API_BASE_URL}/auth/register`, { name, email, password, role });
  return res.data; // { user, token }
}

export async function fetchUserById(userId: string) {
  const res = await axios.get(`${config.API_BASE_URL}/auth/users?id=${userId}`);
  return res.data.user;
}

// Projects
export async function fetchProjects() {
  const res = await axios.get(`${config.API_BASE_URL}/projects`);
  return res.data.projects;
}

export async function fetchProjectById(id: string) {
  const res = await axios.get(`${config.API_BASE_URL}/projects/${id}`);
  return res.data.project;
}

export async function createProject({ title, createdBy, status, description }: { 
  title: string; 
  createdBy: string; 
  status: string; 
  description?: string;
}) {
  const res = await axios.post(`${config.API_BASE_URL}/projects`, {
    title,
    createdBy,
    status,
    description,
  });
  return res.data.project;
}

export async function updateProject(projectId: string, data: { status?: string; title?: string; description?: string }) {
  const res = await axios.put(`${config.API_BASE_URL}/projects/${projectId}`, data);
  return res.data.project;
}

export async function deleteProject(projectId: string) {
  await axios.delete(`${config.API_BASE_URL}/projects/${projectId}`);
}

// Pages/Screens
export async function fetchPagesByProject(projectId: string) {
  const res = await axios.get(`${config.API_BASE_URL}/pages?projectId=${projectId}`);
  return res.data.pages;
}

export async function createPage({ projectId, title, screenshotPath, order }: { 
  projectId: string; 
  title: string; 
  screenshotPath: string; 
  order: number;
}) {
  const res = await axios.post(`${config.API_BASE_URL}/pages`, {
    projectId,
    title,
    screenshotPath,
    order,
  });
  return res.data.page;
}

export async function updatePage(pageId: string, data: { title?: string; screenshotPath?: string; order?: number; PositionX?: number; PositionY?: number }) {
  const res = await axios.put(`${config.API_BASE_URL}/pages/${pageId}`, data);
  return res.data.page;
}

export async function deletePage(pageId: string) {
  await axios.delete(`${config.API_BASE_URL}/pages/${pageId}`);
}

// Workflows/Connections
export async function fetchWorkflowsByProject(projectId: string) {
  const res = await axios.get(`${config.API_BASE_URL}/workflows?projectId=${projectId}`);
  const workflows = res.data.workflows.map((w: any) => ({
    WorkflowID: String(w.WorkflowID ?? ''),
    FromPageID: String(w.FromPageID ?? ''),
    ToPageID: String(w.ToPageID ?? ''),
    Label: w.Label,
    CreatedAt: new Date(w.CreatedAt || Date.now()),
  }));
  return workflows;
}

export async function createWorkflow({ fromPageId, toPageId, label }: { 
  fromPageId: string; 
  toPageId: string; 
  label?: string;
}) {
  const res = await axios.post(`${config.API_BASE_URL}/workflows`, {
    fromPageId,
    toPageId,
    label,
  });
  const w = res.data.workflow;
  return {
    WorkflowID: String(w.WorkflowID ?? ''),
    FromPageID: String(w.FromPageID ?? ''),
    ToPageID: String(w.ToPageID ?? ''),
    Label: w.Label,
    CreatedAt: new Date(w.CreatedAt || Date.now()),
  };
}

export async function deleteWorkflow(id: string) {
  await axios.delete(`${config.API_BASE_URL}/workflows/${id}`);
}

// Comments
export async function fetchCommentsByPage(pageId: string) {
  const res = await axios.get(`${config.API_BASE_URL}/comments?pageId=${pageId}`);
  return res.data.comments;
}

export async function addComment({ pageId, content }: { pageId: string; content: string }) {
  const res = await axios.post(`${config.API_BASE_URL}/comments`, { pageId, content });
  return res.data.comment;
}

// PDF Reports
export async function generatePDFReport(projectId: string) {
  const res = await axios.post(`${config.API_BASE_URL}/reports`, { projectId });
  return res.data.report;
}

export async function fetchReportsByProject(projectId: string) {
  const res = await axios.get(`${config.API_BASE_URL}/reports?projectId=${projectId}`);
  return res.data.reports;
} 