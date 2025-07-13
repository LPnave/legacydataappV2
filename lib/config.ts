// Configuration - change this for deployment
export const config = {
  // Backend API URL
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // For production deployment, update this to your backend URL:
  // API_BASE_URL: 'https://your-backend-domain.vercel.app/api',
  
  // App settings
  APP_NAME: 'ScreenFlow Capture',
  APP_DESCRIPTION: 'Healthcare Workflow Mapping Tool',
  
  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Canvas settings
  CANVAS_GRID_SIZE: 20,
  SCREEN_WIDTH: 280,
  SCREEN_HEIGHT: 200,
  HORIZONTAL_SPACING: 350,
  VERTICAL_SPACING: 250,
} 