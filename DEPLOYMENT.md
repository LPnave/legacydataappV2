# FrontendV2 Deployment Guide

## Overview
This is the integrated Next.js frontend application that connects to the Express/Next.js backend API. The application provides a complete healthcare workflow mapping solution with authentication, project management, and PDF export capabilities.

## Features
- ✅ JWT Authentication
- ✅ Project Management (Create, Read, Update, Delete)
- ✅ Screen/Page Upload and Management
- ✅ Workflow Canvas with Drag & Drop
- ✅ PDF Export with Comments
- ✅ Real-time Updates
- ✅ Responsive Design

## Prerequisites
- Node.js 18+ 
- Backend API running (see backend README)
- Supabase account for file storage (optional)

## Configuration

### 1. Environment Variables
Create a `.env.local` file in the `frontendV2` directory:

```env
# Backend API URL - change this for deployment
NEXT_PUBLIC_API_URL=http://localhost:3000/api
# For production: NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app/api
```

### 2. Backend URL Configuration
For production deployment, update the API URL in `lib/config.ts`:

```typescript
export const config = {
  // Change this line for production
  API_BASE_URL: 'https://your-backend-domain.vercel.app/api',
  // ... other config
}
```

## Local Development

### 1. Install Dependencies
```bash
cd frontendV2
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push your code to GitHub
   - Connect the repository to Vercel

2. **Environment Variables**
   - Add `NEXT_PUBLIC_API_URL` in Vercel dashboard
   - Set to your backend API URL

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## API Integration

### Authentication Flow
1. User enters email/password on login page
2. Frontend calls `/api/auth/login` endpoint
3. Backend returns JWT token
4. Frontend stores token in localStorage
5. All subsequent API calls include Bearer token

### Key API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/projects` - Fetch all projects
- `POST /api/projects` - Create new project
- `GET /api/pages?projectId=X` - Fetch project pages
- `POST /api/pages` - Create new page
- `GET /api/workflows?projectId=X` - Fetch project workflows
- `POST /api/workflows` - Create workflow connection

## File Structure

```
frontendV2/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Login page
│   ├── dashboard/         # Dashboard page
│   └── project/[id]/      # Project workflow page
├── components/            # Reusable UI components
│   ├── project-dashboard.tsx
│   ├── infinite-canvas.tsx
│   ├── screen-upload.tsx
│   └── screen-card.tsx
├── lib/                   # Utilities and configuration
│   ├── api.ts            # API client functions
│   ├── auth.ts           # Authentication utilities
│   └── config.ts         # App configuration
├── types/                 # TypeScript interfaces
└── vercel.json           # Vercel deployment config
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend has CORS configured
   - Check API URL in config

2. **Authentication Issues**
   - Verify JWT token is being sent
   - Check token expiration

3. **Build Errors**
   - Use `--legacy-peer-deps` for npm install
   - Check TypeScript errors

4. **API Connection Issues**
   - Verify backend is running
   - Check network connectivity
   - Validate API endpoints

### Development Tips

1. **API Testing**
   - Use browser dev tools to monitor network requests
   - Check console for error messages

2. **State Management**
   - All state is managed locally with React hooks
   - API calls are centralized in `lib/api.ts`

3. **Styling**
   - Uses Tailwind CSS for styling
   - Radix UI components for accessibility

## Security Considerations

1. **JWT Tokens**
   - Tokens are stored in localStorage
   - Implement token refresh mechanism for production

2. **API Security**
   - All API calls include Authorization header
   - Backend validates JWT tokens

3. **File Uploads**
   - Implement file size limits
   - Validate file types
   - Consider virus scanning for production

## Performance Optimization

1. **Image Optimization**
   - Uses Next.js Image component
   - Implements lazy loading

2. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for heavy components

3. **Caching**
   - Implement API response caching
   - Use React Query for data management

## Support

For issues or questions:
1. Check the backend API documentation
2. Review browser console for errors
3. Verify environment configuration
4. Test API endpoints independently 