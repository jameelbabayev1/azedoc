# Railway Deployment Guide — AZEDOC

Complete instructions for deploying AZEDOC to Railway with full AI features enabled.

## Prerequisites

- GitHub account with AZEDOC repository
- Railway account (free tier available at railway.app)
- Anthropic API key (from console.anthropic.com)

## Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Create a new project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the AZEDOC repository
5. Railway will automatically detect the `Dockerfile` and `Procfile`

## Step 2: Configure Environment Variables

In the Railway dashboard, go to **Variables** and set the following:

### Required Variables

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```
- Get your API key from [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
- Keep this secret — never share it

```
JWT_SECRET=your-secure-random-secret-here
```
- Generate a strong random string (minimum 32 characters recommended)
- Example: Use `openssl rand -base64 32` to generate

### Recommended Variables

```
REGION=azerbaijan
PORT=4200
NODE_ENV=production
DEMO_MODE=false
ENABLE_AUDIT_LOGGING=true
LOG_LEVEL=info
ALLOWED_ORIGINS=https://your-railway-url.railway.app
```

## Step 3: Configure Port Binding

Railway will automatically assign a PORT environment variable. The application is already configured to use this.

The server binds to `0.0.0.0:${PORT}` to work with Railway's port routing.

## Step 4: Deploy

Railway will automatically:
1. Build the Docker image using the Dockerfile
2. Start the application using the Procfile
3. Expose the application on a public URL

You'll see deployment status in the Railway dashboard.

## Step 5: Verify Deployment

Once deployed, Railway will show you a public URL. Test the health endpoint:

```bash
curl https://your-railway-url/api/health
```

You should see:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "region": "azerbaijan",
  "timestamp": "2026-03-10T..."
}
```

## Step 6: Access the Application

The public URL will be shown in the Railway dashboard:
```
https://azedoc-production-xxxx.railway.app
```

Open this URL in your browser to access AZEDOC.

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| ANTHROPIC_API_KEY | Claude API authentication | sk-ant-api03-... |
| JWT_SECRET | Signing authentication tokens | random-secure-string |
| REGION | Healthcare region for compliance | azerbaijan |
| PORT | Server port (set by Railway) | 3000 or 5000 |
| DEMO_MODE | Run without API key | false |
| ENABLE_AUDIT_LOGGING | Enable KVKK compliance logging | true |
| LOG_LEVEL | Logging verbosity | info |

## Troubleshooting

### Deployment Failed

1. Check **Build Logs** in Railway dashboard
2. Common issues:
   - Ruby version mismatch (should be 3.2+)
   - Missing Dockerfile
   - Invalid Procfile

### Application Won't Start

Check **Deploy Logs** in Railway dashboard:
- Look for port binding errors
- Check for missing environment variables
- Verify ANTHROPIC_API_KEY is set

### API Key Not Working

1. Verify ANTHROPIC_API_KEY is set in Railway Variables
2. Check it's a valid key from console.anthropic.com
3. Ensure it's not accidentally truncated
4. Restart the application from Railway dashboard

### CORS Errors

Update ALLOWED_ORIGINS variable to include your Railway URL:
```
ALLOWED_ORIGINS=https://your-railway-url.railway.app,http://localhost:4200
```

## Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and rollback

Access via Railway dashboard.

## Security Best Practices

✅ Use Railway's environment variable system (not .env files)
✅ Never commit .env, .env.production, or API keys to GitHub
✅ Rotate JWT_SECRET regularly
✅ Use unique ALLOWED_ORIGINS for each environment
✅ Enable ENABLE_AUDIT_LOGGING for compliance

## Rollback

To rollback to a previous deployment:
1. Go to Railway dashboard
2. Click **Deployments**
3. Select a previous deployment
4. Click **Rollback**

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Docker Documentation](https://docs.docker.com)
- [Anthropic API Documentation](https://docs.anthropic.com)

## Support

If deployment fails:
1. Check all environment variables are set correctly
2. Review build and deploy logs in Railway dashboard
3. Verify the GitHub repository is up to date
4. Ensure Dockerfile and Procfile are in the repository root

---

**Last Updated**: March 10, 2026
**Status**: Production Ready ✅
