# DNS and Domain Setup for chicagorail.app

This guide shows you how to set up your domain `chicagorail.app` to serve both frontend and backend.

## Architecture

- **Frontend**: `chicagorail.app` (root) → Vercel
- **Backend**: `chicagorail.app/api` → Proxied by Vercel to `api.chicagorail.app`
- **Backend Server**: `api.chicagorail.app` → Dokku on DigitalOcean

## Step 1: Configure DNS Records

Go to your domain registrar's DNS settings and add these records:

### A Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | (Vercel's IP - see below) | 3600 |
| A | api | YOUR_DROPLET_IP | 3600 |
| A | www | (Vercel's IP - see below) | 3600 |

### CNAME Record (Alternative to A records for Vercel)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| A | api | YOUR_DROPLET_IP | 3600 |

**Note**: Some registrars don't allow CNAME for root (@). In that case, use Vercel's A records.

### Get Vercel's DNS Records

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add `chicagorail.app` and `www.chicagorail.app`
4. Vercel will show you the exact DNS records to add

## Step 2: Configure Dokku for api.chicagorail.app

SSH into your Dokku droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Add the domain to your app:

```bash
dokku domains:add metra-backend api.chicagorail.app
```

Enable SSL with Let's Encrypt:

```bash
dokku letsencrypt:set metra-backend email your-email@example.com
dokku letsencrypt:enable metra-backend
```

Set up auto-renewal:

```bash
dokku letsencrypt:cron-job --add
```

## Step 3: Configure Vercel for chicagorail.app

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to Settings > Domains
4. Add domains:
   - `chicagorail.app`
   - `www.chicagorail.app`
5. Vercel will automatically configure SSL

### Option B: Via Vercel CLI

```bash
vercel domains add chicagorail.app
vercel domains add www.chicagorail.app
```

## Step 4: Set Environment Variables

### On Vercel

Add the API URL environment variable:

**Via Dashboard:**
1. Go to Settings > Environment Variables
2. Add: `VITE_API_URL` = `https://chicagorail.app/api`
3. Select all environments (Production, Preview, Development)
4. Save

**Via CLI:**
```bash
vercel env add VITE_API_URL production
# Enter: https://chicagorail.app/api
```

### Update GitHub Secret

Update the `VITE_API_URL` secret in GitHub:

1. Go to: https://github.com/josh-byster/chicagorail/settings/secrets/actions
2. Edit `VITE_API_URL` to: `https://chicagorail.app/api`

## Step 5: Deploy

### Deploy Backend to Dokku

```bash
git push origin main
```

GitHub Actions will deploy to Dokku automatically.

### Deploy Frontend to Vercel

Vercel will automatically deploy when you push to main, or manually:

```bash
vercel --prod
```

## Step 6: Verify Setup

### Test Backend API

```bash
curl https://api.chicagorail.app/api/health
```

### Test Frontend Proxy

```bash
curl https://chicagorail.app/api/health
```

### Test Frontend

Visit: https://chicagorail.app

## How It Works

```
User Request: https://chicagorail.app/
    ↓
Vercel serves frontend (React app)
    ↓
Frontend makes API calls to: https://chicagorail.app/api/*
    ↓
Vercel proxy rewrites to: https://api.chicagorail.app/api/*
    ↓
Dokku backend responds
```

## Troubleshooting

### DNS Not Resolving

Check DNS propagation:
```bash
dig chicagorail.app
dig api.chicagorail.app
```

Or use: https://dnschecker.org/

DNS changes can take up to 48 hours to propagate fully.

### SSL Certificate Issues on Dokku

Verify Let's Encrypt is working:
```bash
dokku letsencrypt:list
```

Renew certificate manually:
```bash
dokku letsencrypt:enable metra-backend
```

### CORS Errors

The backend is configured to allow:
- `https://chicagorail.app`
- `https://www.chicagorail.app`

If you get CORS errors, check the backend logs:
```bash
ssh dokku@YOUR_DROPLET_IP logs metra-backend --tail
```

### Vercel Proxy Not Working

Check `vercel.json` rewrites:
```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://api.chicagorail.app/:path*"
  }
]
```

View Vercel logs in the dashboard to debug proxy issues.

### 502 Bad Gateway

This means Vercel can't reach your backend:

1. Verify backend is running:
```bash
ssh dokku@YOUR_DROPLET_IP ps:report metra-backend
```

2. Test backend directly:
```bash
curl https://api.chicagorail.app/api/health
```

3. Check firewall:
```bash
ufw status
```

Make sure ports 80 and 443 are open.

## Production Checklist

- [ ] DNS records configured for `chicagorail.app`, `www.chicagorail.app`, and `api.chicagorail.app`
- [ ] Vercel domains added and verified
- [ ] Dokku domain configured with SSL
- [ ] `VITE_API_URL` set to `https://chicagorail.app/api` in Vercel
- [ ] Backend CORS configured for production domains
- [ ] Test frontend loads at `https://chicagorail.app`
- [ ] Test API works at `https://chicagorail.app/api/health`
- [ ] Test direct backend access at `https://api.chicagorail.app/api/health`

## Optional: Redirect www to Root

If you want `www.chicagorail.app` to redirect to `chicagorail.app`:

Vercel handles this automatically when you add both domains. The `www` subdomain will redirect to the root domain.

## Security Notes

1. **Always use HTTPS** in production
2. **Keep SSL certificates up to date** (auto-renewed with Let's Encrypt)
3. **Restrict CORS** to only your domains (already configured)
4. **Use environment variables** for secrets (never commit them)
5. **Enable firewall** on Dokku droplet (UFW)

## Monitoring

### Check Backend Status

```bash
ssh dokku@YOUR_DROPLET_IP ps:report metra-backend
```

### View Backend Logs

```bash
ssh dokku@YOUR_DROPLET_IP logs metra-backend --tail
```

### View Vercel Logs

Visit: https://vercel.com/dashboard → Select project → View logs

### Uptime Monitoring

Consider setting up uptime monitoring:
- [UptimeRobot](https://uptimerobot.com/) (Free)
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

Monitor these endpoints:
- `https://chicagorail.app`
- `https://api.chicagorail.app/api/health`
