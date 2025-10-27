#!/bin/bash
# AWS Deployment Script for Gabriel's Monster Arena
# This script prepares the production files for AWS deployment

echo "🚀 Preparing Gabriel's Monster Arena for AWS deployment..."

# Create production directory
PROD_DIR="gabriels-game-production"
ZIP_FILE="gabriels-game-aws.zip"

# Clean up any existing production directory
if [ -d "$PROD_DIR" ]; then
    echo "Cleaning up existing production directory..."
    rm -rf "$PROD_DIR"
fi

# Create production directory
mkdir "$PROD_DIR"

echo "📦 Copying production files..."

# Copy essential game files
cp Gabriels_Game.html "$PROD_DIR/"
cp index.html "$PROD_DIR/"
cp -r js/ "$PROD_DIR/"
cp -r config/ "$PROD_DIR/"
cp -r Assets/ "$PROD_DIR/"

# Copy any other HTML files that might be needed
if [ -f "embedded_test.html" ]; then
    cp embedded_test.html "$PROD_DIR/"
fi

if [ -f "test_phase1_fixes.html" ]; then
    cp test_phase1_fixes.html "$PROD_DIR/"
fi

echo "✅ Production files copied successfully!"

# Create deployment zip
echo "📦 Creating deployment package..."
cd "$PROD_DIR"
zip -r "../$ZIP_FILE" *
cd ..

echo "🎉 Deployment package created: $ZIP_FILE"
echo ""
echo "📋 Next steps:"
echo "1. Upload $ZIP_FILE to your EC2 instance"
echo "2. Extract it in your web server directory"
echo "3. Set proper permissions"
echo ""
echo "🔗 Upload command example:"
echo "scp -i your-key.pem $ZIP_FILE ec2-user@your-ec2-ip:/home/ec2-user/"
echo ""
echo "📁 Files included in deployment:"
ls -la "$PROD_DIR"

# Clean up production directory (optional)
read -p "Remove production directory? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$PROD_DIR"
    echo "Production directory removed."
else
    echo "Production directory kept at: $PROD_DIR"
fi

echo "✅ AWS deployment preparation complete!"
