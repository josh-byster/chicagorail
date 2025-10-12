# Dokku Setup Guide for DigitalOcean

Complete guide to set up Dokku on your DigitalOcean droplet and deploy the Metra Train Tracker backend.

## Step 1: Install Dokku on DigitalOcean

### Option A: Use DigitalOcean Marketplace (Recommended)

1. Go to DigitalOcean Dashboard
2. Create a new Droplet
3. Choose "Marketplace" tab
4. Search for "Dokku" and select it
5. Choose droplet size (minimum: 2GB RAM recommended)
6. Select region
7. Add your SSH key
8. Create droplet

### Option B: Manual Installation

SSH into your droplet and run:

```bash
wget -NP . https://dokku.com/install/v0.34.3/bootstrap.sh
sudo DOKKU_TAG=v0.34.3 bash bootstrap.sh
```

After installation, visit `http://your-droplet-ip` to complete the web-based setup.

## Step 2: Initial Dokku Configuration

SSH into your droplet:

```bash
ssh root@your-droplet-ip
```

Add your SSH public key to Dokku:

```bash
# If you haven't generated an SSH key yet
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add your public key to Dokku
cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin
```

## Step 3: Run the Setup Script

Transfer the setup script to your droplet:

```bash
# From your local machine
scp scripts/setup-dokku.sh root@your-droplet-ip:/tmp/
```

SSH into your droplet and run the script:

```bash
ssh root@your-droplet-ip
chmod +x /tmp/setup-dokku.sh
/tmp/setup-dokku.sh
```

The script will:
- Create the `metra-backend` app
- Set up persistent storage for the SQLite database
- Configure environment variables
- Optionally set up a domain and SSL

## Step 4: Set Up SSH Key for GitHub Actions

GitHub Actions needs an SSH key to deploy to Dokku. Generate a deployment key:

```bash
# On your LOCAL machine, generate a new SSH key for deployment
ssh-keygen -t ed25519 -f ~/.ssh/dokku_deploy -C "github-actions-deploy"

# Don't set a passphrase (press Enter twice)
```

Add the public key to your Dokku server:

```bash
# Copy the public key to your droplet
cat ~/.ssh/dokku_deploy.pub | ssh root@your-droplet-ip "dokku ssh-keys:add github-actions"
```

## Step 5: Configure GitHub Secrets

1. Go to your GitHub repository: https://github.com/josh-byster/chicagorail
2. Navigate to: Settings > Secrets and variables > Actions
3. Click "New repository secret" and add the following:

### Required Secrets:

**DOKKU_SSH_PRIVATE_KEY**
```bash
# Get the private key content
cat ~/.ssh/dokku_deploy
```
Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

**DOKKU_HOST**
```
your-droplet-ip-or-domain
```
Example: `123.45.67.89` or `droplet.yourdomain.com`

**DOKKU_APP_NAME**
```
metra-backend
```

**METRA_API_USERNAME**
```
your_metra_api_username
```

**METRA_API_PASSWORD**
```
your_metra_api_password
```

## Step 6: Deploy Your App

### Option A: Deploy via GitHub Actions (Recommended)

Simply push to the main branch:

```bash
git push origin main
```

GitHub Actions will automatically deploy to Dokku.

### Option B: Manual Deploy from Local Machine

```bash
# Add Dokku as a git remote
git remote add dokku dokku@your-droplet-ip:metra-backend

# Push to deploy
git push dokku main:master
```

## Step 7: Import GTFS Data

After the first deployment, import the GTFS data:

```bash
ssh dokku@your-droplet-ip run metra-backend "cd packages/backend && npm run gtfs:import"
```

This will take a few minutes to download and import all the Metra schedule data.

## Step 8: Verify Deployment

Check your app status:

```bash
ssh dokku@your-droplet-ip ps:report metra-backend
```

View logs:

```bash
ssh dokku@your-droplet-ip logs metra-backend --tail
```

Test the API:

```bash
curl http://your-droplet-ip:5000/api/health
```

## Optional: Set Up a Domain

If you have a domain:

```bash
# On your droplet
dokku domains:add metra-backend api.yourdomain.com

# Enable SSL with Let's Encrypt
dokku letsencrypt:enable metra-backend
```

Update your DNS records:
- Add an A record pointing `api.yourdomain.com` to your droplet IP

## Troubleshooting

### Port Issues

By default, Dokku assigns random ports. To use port 80/443:

```bash
dokku proxy:ports-set metra-backend http:80:5000
```

### Database Not Persisting

Verify storage is mounted:

```bash
dokku storage:list metra-backend
```

### Build Failures

Check the logs:

```bash
dokku logs metra-backend --tail
```

### Environment Variables Not Set

List current config:

```bash
dokku config metra-backend
```

Update a variable:

```bash
dokku config:set metra-backend VARIABLE_NAME=value
```

### SSH Key Issues

If GitHub Actions can't connect:

1. Verify the key is added to Dokku:
```bash
dokku ssh-keys:list
```

2. Test SSH connection from your local machine:
```bash
ssh -i ~/.ssh/dokku_deploy dokku@your-droplet-ip
```

## Maintenance

### View App Status

```bash
dokku ps:report metra-backend
```

### Restart App

```bash
dokku ps:restart metra-backend
```

### Update Environment Variables

```bash
dokku config:set metra-backend NEW_VAR=value
```

### Scale App

```bash
dokku ps:scale metra-backend web=2
```

### Rollback Deployment

```bash
# View releases
dokku releases metra-backend

# Rollback to previous release
dokku releases:rollback metra-backend
```

### Update GTFS Data

Set up a cron job or run manually:

```bash
ssh dokku@your-droplet-ip run metra-backend "cd packages/backend && npm run gtfs:import"
```

## Security Considerations

1. **Firewall**: Configure UFW to only allow ports 22, 80, and 443
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

2. **SSH Key Only**: Disable password authentication in `/etc/ssh/sshd_config`

3. **Environment Variables**: Never commit secrets to git

4. **SSL**: Always use Let's Encrypt for production domains

5. **Updates**: Keep Dokku and your droplet updated
```bash
apt update && apt upgrade
```

## Additional Resources

- [Dokku Documentation](https://dokku.com/docs/getting-started/installation/)
- [DigitalOcean Dokku Guide](https://www.digitalocean.com/community/tutorials/how-to-use-the-dokku-one-click-install-image)
