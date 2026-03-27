#!/bin/bash

# This is a bash script for Mac/Linux users to quickly setup the project

echo ""
echo "===================================="
echo "Student Marks Dashboard Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/5] Checking Node.js installation..."
node --version
echo ""

# Create sample data
echo "[2/5] Creating sample Excel data..."
cd data
node backend/generateData.js
cd ..
echo ""

# Install backend dependencies
echo "[3/5] Installing backend dependencies..."
cd backend
npm install
cd ..
echo ""

# Install frontend dependencies
echo "[4/5] Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo ""

echo "[5/5] Setup complete!"
echo ""
echo "===================================="
echo "NEXT STEPS:"
echo "===================================="
echo ""
echo "Open TWO terminal windows:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd backend"
echo "  npm start"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "===================================="
echo ""
