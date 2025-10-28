# Gabriel's Monster Arena - AWS Deployment Guide

## 🎯 **What Goes to AWS vs What Stays Local**

### **✅ GOES TO AWS (Production Files)**
```
Gabriels_Game.html          # Main game file
index.html                  # Alternative entry point
js/                         # All JavaScript game files
config/                     # Game configuration JSON files
Assets/                     # Images, sounds, etc.
```

### **❌ STAYS LOCAL (Development Only)**
```
node_modules/               # All npm dependencies
tests/                      # Test files
package.json                # Development dependencies
jest.config.js              # Test configuration
coverage/                   # Test coverage reports
```

## 🚀 **AWS Deployment Process**

### **Step 1: Prepare Production Files**
```bash
# Create production deployment package
mkdir gabriels-game-production
cp Gabriels_Game.html gabriels-game-production/
cp index.html gabriels-game-production/
cp -r js/ gabriels-game-production/
cp -r config/ gabriels-game-production/
cp -r Assets/ gabriels-game-production/

# Create deployment zip
cd gabriels-game-production
zip -r ../gabriels-game-aws.zip *
```

### **Step 2: Deploy to EC2**
```bash
# Upload to EC2
scp -i your-key.pem gabriels-game-aws.zip ec2-user@your-ec2-ip:/home/ec2-user/

# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Extract and deploy
unzip gabriels-game-aws.zip
sudo cp -r * /var/www/html/  # For Apache
# OR
sudo cp -r * /usr/share/nginx/html/  # For Nginx

# Set permissions
sudo chown -R apache:apache /var/www/html/
sudo chmod -R 755 /var/www/html/
```

## 🔧 **AWS Server Requirements**

### **Minimum EC2 Instance**
- **Instance Type**: t2.micro (free tier eligible)
- **OS**: Amazon Linux 2 or Ubuntu 20.04+
- **Storage**: 8GB minimum
- **RAM**: 1GB minimum

### **Required Software on EC2**
```bash
# Install web server (choose one)
sudo yum update -y
sudo yum install -y httpd    # Apache
sudo systemctl start httpd
sudo systemctl enable httpd

# OR
sudo amazon-linux-extras install nginx1  # Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **Security Group Settings**
- **Port 80** (HTTP) - Allow from anywhere (0.0.0.0/0)
- **Port 443** (HTTPS) - Allow from anywhere (0.0.0.0/0) - Optional
- **Port 22** (SSH) - Allow from your IP only

## 📦 **Dependencies Breakdown**

### **No Node.js Required on AWS!**
Your game is a **client-side HTML5 game** that runs entirely in the browser. AWS only needs to serve static files.

### **What Each Dependency Does**
- **Jest/jsdom**: Testing framework (local development only)
- **ESLint/Prettier**: Code quality tools (local development only)
- **Webpack/Babel**: Build tools (local development only)
- **@testing-library**: Test utilities (local development only)

### **Production Dependencies: NONE**
- No npm install needed on AWS
- No package.json needed on AWS
- No node_modules needed on AWS

## 🌐 **Alternative AWS Services**

### **Option 1: EC2 (Current Plan)**
- Full control over server
- Can run custom scripts
- More complex setup

### **Option 2: S3 + CloudFront (Recommended)**
```bash
# Upload to S3 bucket
aws s3 sync . s3://your-bucket-name --exclude "node_modules/*" --exclude "tests/*" --exclude "coverage/*"

# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html

# Optional: Set up CloudFront CDN for better performance
```

### **Option 3: AWS Amplify**
- Automatic deployments from Git
- Built-in CI/CD
- Automatic HTTPS

## 🔍 **Testing Before Deployment**

### **Local Production Test**
```bash
# Test with simple HTTP server (no Node.js dependencies)
python -m http.server 8000
# OR
php -S localhost:8000
# OR
npx serve .

# Visit: http://localhost:8000/Gabriels_Game.html
```

### **Verify Files**
- ✅ Game loads without errors
- ✅ All assets load correctly
- ✅ No console errors
- ✅ Mobile responsiveness works

## 📋 **Pre-Deployment Checklist**

### **Files to Include**
- [ ] `Gabriels_Game.html`
- [ ] `index.html`
- [ ] `js/` directory (all files)
- [ ] `config/` directory (all JSON files)
- [ ] `Assets/` directory (all media files)

### **Files to Exclude**
- [ ] `node_modules/`
- [ ] `tests/`
- [ ] `coverage/`
- [ ] `package.json`
- [ ] `jest.config.js`
- [ ] `.git/`
- [ ] `*.log`

### **AWS Configuration**
- [ ] Security group allows HTTP (port 80)
- [ ] Web server installed and running
- [ ] Files copied to web directory
- [ ] Permissions set correctly
- [ ] Game accessible via public IP

## 🚨 **Common Issues & Solutions**

### **Issue: Game doesn't load**
- Check browser console for errors
- Verify all JS files are uploaded
- Check file permissions (755 for directories, 644 for files)

### **Issue: Assets not loading**
- Verify Assets/ directory is uploaded
- Check file paths in code
- Ensure MIME types are correct

### **Issue: Configuration errors**
- Verify config/ directory is uploaded
- Check JSON file syntax
- Ensure files are readable

## 💡 **Performance Optimizations**

### **Enable Gzip Compression**
```bash
# Apache
sudo nano /etc/httpd/conf/httpd.conf
# Add: LoadModule deflate_module modules/mod_deflate.so

# Nginx
sudo nano /etc/nginx/nginx.conf
# Add gzip settings
```

### **Set Cache Headers**
```bash
# Cache static assets for 1 year
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

## 🎯 **Bottom Line**

**For AWS deployment, you only need:**
1. **Static files** (HTML, JS, CSS, assets)
2. **Web server** (Apache or Nginx)
3. **No Node.js, no npm, no dependencies!**

The game runs entirely in the browser, so AWS just needs to serve the files. All the npm dependencies are for development and testing only.



