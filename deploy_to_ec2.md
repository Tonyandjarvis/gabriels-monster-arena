# Deploy Gabriel's Monster Arena to EC2

## Prerequisites
- EC2 instance running
- SSH access to your EC2 instance
- Web server (Apache or Nginx) installed

## Step 1: Upload Game Files

### Option A: Using SCP (Secure Copy)
```bash
# Upload the zip file
scp -i your-key.pem gabriels-monster-arena.zip ec2-user@your-ec2-ip:/home/ec2-user/

# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Extract the files
unzip gabriels-monster-arena.zip
```

### Option B: Using Git (Recommended)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone your repository
git clone https://github.com/Tonyandjarvis/gabriels-monster-arena.git
cd gabriels-monster-arena
git checkout gabriels-monster-arena
```

## Step 2: Set Up Web Server

### For Apache:
```bash
# Install Apache
sudo yum update -y
sudo yum install -y httpd

# Start Apache
sudo systemctl start httpd
sudo systemctl enable httpd

# Copy game files to web directory
sudo cp -r * /var/www/html/

# Set permissions
sudo chown -R apache:apache /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### For Nginx:
```bash
# Install Nginx
sudo yum update -y
sudo amazon-linux-extras install nginx1

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Copy game files to web directory
sudo cp -r * /usr/share/nginx/html/

# Set permissions
sudo chown -R nginx:nginx /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html/
```

## Step 3: Configure Security Group

Make sure your EC2 security group allows:
- **HTTP (Port 80)** - for web access
- **HTTPS (Port 443)** - for secure access (optional)
- **SSH (Port 22)** - for your access

## Step 4: Test Your Game

Access your game at:
- `http://your-ec2-public-ip/`
- `http://your-ec2-public-ip/Gabriels_Game.html`
- `http://your-ec2-public-ip/embedded_test.html`

## Step 5: Set Up Custom Domain (Optional)

1. **Point your domain** to your EC2 public IP
2. **Configure virtual hosts** in Apache/Nginx
3. **Set up SSL certificate** for HTTPS

## Files to Upload

Your game includes:
- `Gabriels_Game.html` - Main game
- `index.html` - Alternative entry point
- `embedded_test.html` - Self-contained test
- `test_phase1_fixes.html` - Comprehensive test suite
- `js/` - All game JavaScript files
- `config/` - Game configuration files
- `Assets/` - Game assets

## Quick Commands

```bash
# Check if web server is running
sudo systemctl status httpd  # for Apache
sudo systemctl status nginx  # for Nginx

# Check web server logs
sudo tail -f /var/log/httpd/error_log  # for Apache
sudo tail -f /var/log/nginx/error.log  # for Nginx

# Restart web server
sudo systemctl restart httpd  # for Apache
sudo systemctl restart nginx  # for Nginx
```
