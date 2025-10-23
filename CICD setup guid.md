NEW_FILE_CODE
# CI/CD Setup Guide

## Required GitHub Secrets

To enable the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

### Vercel Integration

1. **VERCEL_TOKEN**: Your Vercel authentication token
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Add it to GitHub: Settings → Secrets and variables → Actions → New repository secret

2. **VERCEL_ORG_ID**: Your Vercel organization ID
   - Run: `npx vercel login` (if not logged in)
   - Run: `npx vercel link`
   - Find the value in `.vercel/project.json` under `"orgId"`

3. **VERCEL_PROJECT_ID**: Your Vercel project ID
   - Find in `.vercel/project.json` under `"projectId"`
   - Or get from Vercel dashboard → Project Settings

### Database

4. **DATABASE_URL**: Your production database connection string
   - Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
   - Get from your database provider (e.g., Vercel Postgres, Supabase, Railway)

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above
5. Click **Add secret**

## Environment Setup

### Production Environment
- Create environment named `production`
- Add protection rules (optional but recommended):
  - Required reviewers
  - Wait timer
  - Restrict to main branch

### Preview Environment
- Create environment named `preview`
- No special protection needed

## Vercel CLI Setup (Local)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# This creates .vercel/project.json with your IDs