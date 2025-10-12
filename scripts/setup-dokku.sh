#!/bin/bash
set -e

# Metra Train Tracker - Dokku Setup Script
# Run this script on your DigitalOcean droplet after installing Dokku

APP_NAME="metra-backend"
DOMAIN="" # Optional: set your domain here (e.g., api.yourdomain.com)

echo "🚆 Setting up Metra Train Tracker on Dokku..."
echo "=============================================="

# Create the app
echo "📦 Creating Dokku app: $APP_NAME"
dokku apps:create $APP_NAME || echo "App already exists"

# Create data directory for persistent storage
echo "💾 Setting up persistent storage for SQLite database..."
dokku storage:ensure-directory $APP_NAME || echo "Directory already exists"
dokku storage:mount $APP_NAME /var/lib/dokku/data/storage/$APP_NAME:/app/data || echo "Storage already mounted"

# Set domain if provided
if [ -n "$DOMAIN" ]; then
    echo "🌐 Adding domain: $DOMAIN"
    dokku domains:add $APP_NAME $DOMAIN
fi

# Prompt for Metra API credentials
echo ""
echo "🔑 Please enter your Metra API credentials:"
read -p "METRA_API_USERNAME: " METRA_USERNAME
read -sp "METRA_API_PASSWORD: " METRA_PASSWORD
echo ""

# Set environment variables
echo "⚙️  Setting environment variables..."
dokku config:set $APP_NAME \
  NODE_ENV=production \
  PORT=5000 \
  DATABASE_PATH=/app/data/gtfs.db \
  METRA_API_USERNAME="$METRA_USERNAME" \
  METRA_API_PASSWORD="$METRA_PASSWORD" \
  GTFS_STATIC_BASE_URL="https://gtfsapi.metrarail.com" \
  GTFS_REALTIME_ALERTS_URL="https://gtfsapi.metrarail.com/gtfs/alerts" \
  GTFS_REALTIME_TRIP_UPDATES_URL="https://gtfsapi.metrarail.com/gtfs/tripUpdates" \
  GTFS_REALTIME_POSITIONS_URL="https://gtfsapi.metrarail.com/gtfs/positions" \
  GTFS_REALTIME_POLL_INTERVAL=30000 \
  API_TIMEOUT=5000

# Enable SSL if domain is set
if [ -n "$DOMAIN" ]; then
    echo "🔒 Setting up Let's Encrypt SSL..."
    dokku letsencrypt:enable $APP_NAME || echo "Let's Encrypt setup failed - you can enable it manually later"
fi

echo ""
echo "✅ Dokku setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your SSH public key to Dokku (if not already done):"
echo "   cat ~/.ssh/id_rsa.pub | ssh root@your-droplet-ip dokku ssh-keys:add deploy"
echo ""
echo "2. On your local machine, add the Dokku remote:"
echo "   git remote add dokku dokku@your-droplet-ip:$APP_NAME"
echo ""
echo "3. Deploy your app:"
echo "   git push dokku main:master"
echo ""
echo "4. After first deployment, import GTFS data:"
echo "   ssh dokku@your-droplet-ip run $APP_NAME \"cd packages/backend && npm run gtfs:import\""
echo ""
echo "5. Check your app status:"
echo "   dokku ps:report $APP_NAME"
echo ""
