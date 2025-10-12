# Deployment Guide

This guide covers deploying the Metra Train Tracker backend to Dokku (DigitalOcean) and frontend to Vercel.

## Prerequisites

- DigitalOcean droplet with Dokku installed
- GitHub repository with deployment workflows enabled
- Vercel account

## Backend Deployment (Dokku on DigitalOcean)

### 1. Initial Dokku Setup on Your Droplet

SSH into your DigitalOcean droplet and run:

```bash
# Create the app
dokku apps:create metra-backend

# Create persistent storage for SQLite database
dokku storage:ensure-directory metra-backend
dokku storage:mount metra-backend /var/lib/dokku/data/storage/metra-backend:/app/data

# Set environment variables
dokku config:set metra-backend \
  NODE_ENV=production \
  PORT=5000 \
  DATABASE_PATH=/app/data/gtfs.db \
  METRA_API_USERNAME="your_username" \
  METRA_API_PASSWORD="your_password" \
  GTFS_STATIC_BASE_URL="https://gtfsapi.metrarail.com" \
  GTFS_REALTIME_ALERTS_URL="https://gtfsapi.metrarail.com/gtfs/alerts" \
  GTFS_REALTIME_TRIP_UPDATES_URL="https://gtfsapi.metrarail.com/gtfs/tripUpdates" \
  GTFS_REALTIME_POSITIONS_URL="https://gtfsapi.metrarail.com/gtfs/positions" \
  GTFS_REALTIME_POLL_INTERVAL=30000 \
  API_TIMEOUT=5000

# Set up domain (optional)
dokku domains:add metra-backend api.yourdomain.com

# Enable Let's Encrypt (optional, if using domain)
dokku letsencrypt:enable metra-backend
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `DOKKU_SSH_PRIVATE_KEY`: Your SSH private key for Dokku deployment
- `DOKKU_HOST`: Your droplet IP or domain (e.g., `123.45.67.89`)
- `DOKKU_APP_NAME`: `metra-backend`
- `METRA_API_USERNAME`: Your Metra API username
- `METRA_API_PASSWORD`: Your Metra API password

### 3. Deploy

Push to main branch and the GitHub Action will automatically deploy:

```bash
git push origin main
```

Or manually deploy from your local machine:

```bash
git remote add dokku dokku@your-droplet-ip:metra-backend
git push dokku main:master
```

### 4. Import GTFS Data

After first deployment, import the GTFS data:

```bash
ssh dokku@your-droplet-ip run metra-backend "cd packages/backend && npm run gtfs:import"
```

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Your Project

```bash
vercel login
vercel link
```

Follow the prompts to link your GitHub repository.

### 3. Configure Environment Variables

In the Vercel dashboard or via CLI:

```bash
vercel env add VITE_API_URL
# Enter your backend API URL: https://api.yourdomain.com/api
# or http://your-droplet-ip:5000/api
```

Also add these secrets to GitHub (for CI/CD):

- `VERCEL_TOKEN`: Get from Vercel dashboard (Settings > Tokens)
- `VERCEL_ORG_ID`: Found in `.vercel/project.json` after linking
- `VERCEL_PROJECT_ID`: Found in `.vercel/project.json` after linking
- `VITE_API_URL`: Your backend API URL

### 4. Deploy

Push to main branch and the GitHub Action will automatically deploy:

```bash
git push origin main
```

Or manually deploy:

```bash
pnpm deploy:frontend
```

## Monitoring Deployments

### Check Dokku Logs

```bash
ssh dokku@your-droplet-ip logs metra-backend --tail
```

### Check Vercel Logs

Visit: https://vercel.com/dashboard and select your project

### GitHub Actions

Check workflow runs at: https://github.com/josh-byster/chicagorail/actions

## Troubleshooting

### Backend Issues

**Database not persisting:**
```bash
# Verify storage is mounted
ssh dokku@your-droplet-ip storage:list metra-backend
```

**Build failures:**
```bash
# Check build logs
ssh dokku@your-droplet-ip logs metra-backend --tail
```

**Environment variables not set:**
```bash
# List current config
ssh dokku@your-droplet-ip config metra-backend
```

### Frontend Issues

**API connection errors:**
- Verify `VITE_API_URL` is set correctly in Vercel
- Check CORS settings in backend (`packages/backend/src/middleware/cors.ts`)

**Build failures:**
- Check GitHub Actions logs
- Ensure shared package builds successfully

## Updating Deployments

### Backend Updates

Push to main branch, or manually:

```bash
git push dokku main:master
```

### Frontend Updates

Push to main branch, or manually:

```bash
pnpm deploy:frontend
```

### Update GTFS Data

Schedule via cron or run manually:

```bash
ssh dokku@your-droplet-ip run metra-backend "cd packages/backend && npm run gtfs:import"
```

## Scaling

### Dokku

```bash
# Scale web processes
ssh dokku@your-droplet-ip ps:scale metra-backend web=2
```

### Vercel

Vercel automatically scales based on traffic.

## Rollback

### Dokku

```bash
# View releases
ssh dokku@your-droplet-ip releases metra-backend

# Rollback to previous release
ssh dokku@your-droplet-ip releases:rollback metra-backend
```

### Vercel

Use the Vercel dashboard to rollback to a previous deployment.
