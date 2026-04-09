# CrewCall Frontend - Deployment Guide

## Overview
This guide covers deploying the CrewCall frontend to Vercel with your custom credentials, using the ngrok backend URL.

## Current Configuration

### Backend URL
- **Production Backend**: `https://scarlette-slimy-jeffie.ngrok-free.dev/v1`
- **Configured in**: `.env.production` (committed to git)
- **Local development**: `.env.local` (not committed, for local testing)

### Vercel Configuration
- **vercel.json**: Already configured with proper SPA routing
- **Build command**: `npm run build`
- **Output directory**: `dist`

---

## Deploy to Vercel with Your Credentials

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to your Vercel account**:
   ```bash
   vercel login
   ```
   This will open a browser window for you to authenticate with your Vercel credentials.

3. **Deploy to preview**:
   ```bash
   vercel
   ```
   - First time: Follow the prompts to link/create a project
   - Project name: `crewcall-frontend` (or your preference)
   - Directory: `./crewcall-frontend`
   - Framework: Vite (auto-detected)

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Vercel Dashboard (Git Integration)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to** [vercel.com](https://vercel.com) and login with your credentials

3. **Import your repository**:
   - Click "Add New..." → "Project"
   - Select your `crewcall-frontend` repository
   - Vercel will auto-detect Vite configuration

4. **Configure Environment Variables**:
   In the Vercel dashboard, go to **Settings → Environment Variables** and add:
   ```
   VITE_API_URL=https://scarlette-slimy-jeffie.ngrok-free.dev/v1
   ```
   Set it for **Production**, **Preview**, and **Development** environments.

5. **Deploy!**

---

## Important Notes

### ⚠️ Ngrok URL Limitations
- **Ngrok free tier URLs change** every time you restart the tunnel
- If your ngrok URL changes, you must:
  1. Update `.env.production` with the new URL
  2. Update the environment variable in Vercel dashboard
  3. Redeploy the frontend

### 🔒 For Production Backend
When you have a permanent backend URL (e.g., Railway, Render, your own server):
1. Update `.env.production`:
   ```env
   VITE_API_URL=https://your-permanent-backend.com/v1
   ```
2. Update Vercel environment variable
3. Redeploy

---

## Local Development

1. **Ensure ngrok tunnel is running** at the URL specified in `.env.local`

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Access the app**: `http://localhost:5173`

The `vite.config.ts` has a proxy configured for local development:
- API requests to `/v1/*` are proxied to `http://localhost:3000`
- For ngrok, make sure your backend is accessible locally or update the proxy target

---

## Verification

After deployment, verify your frontend is working:

1. **Open your Vercel deployment URL** (e.g., `https://crewcall-frontend.vercel.app`)

2. **Check network tab** in browser DevTools:
   - API calls should go to `https://scarlette-slimy-jeffie.ngrok-free.dev/v1/...`
   - No 404 or CORS errors

3. **Test authentication flow**:
   - Login
   - Check if tokens are properly refreshed

---

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure your backend has CORS enabled for your Vercel domain:
```typescript
// In backend (NestJS main.ts or similar)
app.enableCors({
  origin: ['https://crewcall-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true,
});
```

### 405 Method Not Allowed
- This means the API URL is incorrect
- Verify `VITE_API_URL` is set correctly in Vercel environment variables
- Check that the ngrok URL is active and accessible

### Environment Variables Not Working
- Vercel only injects environment variables at **build time**
- After changing `VITE_API_URL` in Vercel dashboard, you **must redeploy**
- Use `vercel --prod` or trigger a redeploy from the dashboard

---

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to preview URL
vercel

# Deploy to production
vercel --prod

# List all deployments
vercel ls

# Pull environment variables locally
vercel env pull .env.production.local
```

---

## Support

If you encounter issues:
1. Check Vercel build logs in the dashboard
2. Verify ngrok tunnel is active
3. Check browser console for specific error messages
4. Ensure backend CORS is properly configured
