# 🚀 RapidReach Fly.io Deployment Guide

## 📋 **Prerequisites**

### 1. **Install Fly.io CLI**

**Windows:**
```powershell
winget install flyctl
```

**macOS:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. **Create Fly.io Account & Login**
```bash
flyctl auth signup  # Create account
flyctl auth login   # Login to existing account
```

### 3. **Verify Installation**
```bash
flyctl version
flyctl auth whoami
```

---

## 🚀 **Quick Deployment**

### **Option 1: Automated Script (Recommended)**

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Option 2: Manual Deployment**

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Create Fly.io app (first time only):**
   ```bash
   flyctl apps create rapidreach-test
   ```

3. **Deploy:**
   ```bash
   flyctl deploy --local-only
   ```

---

## 📁 **Deployment Files Created**

- **`fly.toml`** - Fly.io configuration
- **`Dockerfile`** - Multi-stage Docker build
- **`nginx.conf`** - Nginx configuration with security headers
- **`.dockerignore`** - Docker ignore patterns
- **`deploy.ps1`** - Windows deployment script
- **`deploy.sh`** - Linux/macOS deployment script

---

## 🔧 **Configuration Details**

### **Fly.io App Settings**
- **App Name:** `rapidreach-test`
- **Region:** `iad` (US East)
- **Port:** `8080`
- **Memory:** `512MB`
- **CPU:** `1 shared core`
- **Auto-scaling:** Enabled (0 min machines)

### **Security Features**
- **HTTPS:** Forced
- **Security Headers:** CSP, XSS Protection, Frame Options
- **Gzip Compression:** Enabled
- **Static Asset Caching:** 1 year
- **Health Checks:** Configured

### **Supabase Integration**
- **CSP Policy:** Allows Supabase connections
- **WebSocket Support:** Enabled for real-time features
- **CORS:** Configured for Supabase API calls

---

## 📊 **Monitoring & Management**

### **View Logs**
```bash
flyctl logs
flyctl logs -f  # Follow logs in real-time
```

### **Check Status**
```bash
flyctl status
flyctl apps list
```

### **Open Dashboard**
```bash
flyctl dashboard
```

### **Scale Application**
```bash
flyctl scale count 2        # Scale to 2 machines
flyctl scale memory 1024    # Scale to 1GB memory
```

---

## 🧪 **Testing the Deployment**

### **1. Basic Functionality Test**
- ✅ Application loads correctly
- ✅ Local patterns work (no database required)
- ✅ URL generation functions
- ✅ Pattern selection operates offline

### **2. Supabase Integration Test**
- ✅ License validation works
- ✅ User authentication functions
- ✅ Bot detection operates
- ✅ Optional analytics gracefully degrade

### **3. Performance Test**
- ✅ Fast loading times (local patterns)
- ✅ Responsive UI
- ✅ Efficient resource usage

---

## 🔍 **Troubleshooting**

### **Common Issues**

**1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**2. Deployment Errors**
```bash
# Check app status
flyctl status
flyctl logs

# Redeploy
flyctl deploy --local-only
```

**3. Memory Issues**
```bash
# Scale up memory
flyctl scale memory 1024
```

**4. Connection Issues**
```bash
# Check health
flyctl checks list
curl https://rapidreach-test.fly.dev/health
```

### **Debug Commands**
```bash
# SSH into machine
flyctl ssh console

# View machine details
flyctl machine list
flyctl machine status <machine-id>

# Restart application
flyctl machine restart <machine-id>
```

---

## 🌐 **Access Your Deployed App**

**URL:** `https://rapidreach-test.fly.dev`

### **Expected Features**
- ✅ **Pattern Selection:** Works completely offline
- ✅ **URL Generation:** Fast local processing
- ✅ **License Validation:** Connects to Supabase
- ✅ **Analytics:** Optional with graceful degradation
- ✅ **Security:** All headers and protections active

---

## 📈 **Performance Expectations**

### **Load Times**
- **Initial Load:** < 2 seconds
- **Pattern Selection:** < 100ms (local)
- **URL Generation:** < 500ms
- **License Validation:** 1-3 seconds (Supabase)

### **Resource Usage**
- **Memory:** ~200-400MB
- **CPU:** Low usage (efficient local processing)
- **Network:** Minimal (only for license/auth)

---

## 🔄 **Updates & Redeployment**

### **Deploy Updates**
```bash
# Build and deploy
npm run build
flyctl deploy --local-only
```

### **Environment Variables**
```bash
# Set environment variables
flyctl secrets set NODE_ENV=production
flyctl secrets list
```

### **Rollback**
```bash
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback <version>
```

---

## 🎯 **Success Criteria**

✅ **Application deploys successfully**
✅ **All local features work offline**
✅ **Supabase integration functions**
✅ **Performance is optimal**
✅ **Security headers are active**
✅ **Monitoring is operational**

---

## 🆘 **Support**

If you encounter issues:

1. **Check logs:** `flyctl logs`
2. **Verify status:** `flyctl status`
3. **Review configuration:** Check `fly.toml`
4. **Test locally:** `npm run build && npm run preview`

**Fly.io Documentation:** https://fly.io/docs/
**Support:** https://community.fly.io/
