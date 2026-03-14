#!/bin/bash

# Setup script for Playwright video recording environment
# Checks for and installs required dependencies

set -e

echo "🎬 Logisphere Video Recording Environment Setup"
echo "================================================\n"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📋 Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found${NC}"
  echo "   Install from https://nodejs.org/"
  exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Check npm
echo "📋 Checking npm..."
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  echo "   npm should be installed with Node.js"
  exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION}${NC}"

# Check FFmpeg
echo "📋 Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
  echo -e "${RED}❌ FFmpeg not found${NC}"
  echo ""
  echo "   Installation instructions:"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "   📱 macOS:"
    echo "      brew install ffmpeg"
    echo ""
    echo "   If homebrew is not installed:"
    echo "      /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""

  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "   🐧 Ubuntu/Debian:"
    echo "      sudo apt-get update"
    echo "      sudo apt-get install ffmpeg"
    echo ""
    echo "   🎯 Fedora:"
    echo "      sudo dnf install ffmpeg"

  elif [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    echo "   🪟 Windows:"
    echo "      choco install ffmpeg"
    echo ""
    echo "      Or download from https://ffmpeg.org/download.html"
  fi

  exit 1
fi
FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
echo -e "${GREEN}✅ ${FFMPEG_VERSION}${NC}"

# Check ffprobe
echo "📋 Checking ffprobe..."
if ! command -v ffprobe &> /dev/null; then
  echo -e "${RED}❌ ffprobe not found${NC}"
  echo "   Usually installed with FFmpeg. Check FFmpeg installation."
  exit 1
fi
echo -e "${GREEN}✅ ffprobe available${NC}"

# Check Node dependencies
echo ""
echo "📦 Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules not found${NC}"
  echo "   Running npm install..."
  npm install
else
  # Check if all required packages are installed
  REQUIRED_PACKAGES=("@playwright/test" "axios" "glob" "dotenv" "ts-node")
  MISSING=()

  for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ ! -d "node_modules/$package" ]; then
      MISSING+=("$package")
    fi
  done

  if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing packages: ${MISSING[*]}${NC}"
    echo "   Running npm install..."
    npm install
  else
    echo -e "${GREEN}✅ All required packages installed${NC}"
  fi
fi

# Check .env file
echo ""
echo "📝 Checking environment configuration..."
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local not found${NC}"
  echo "   Creating from .env.example..."

  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo ""
    echo "   Optional: Add ElevenLabs API key for professional narration:"
    echo "      export ELEVENLABS_API_KEY=\"your_key_here\""
  fi
else
  echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Check recordings directory
echo ""
echo "📁 Creating recordings directory..."
mkdir -p recordings
echo -e "${GREEN}✅ recordings/ directory ready${NC}"

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}✅ Environment Setup Complete!${NC}"
echo "================================================\n"

echo "Next steps:"
echo ""
echo "1️⃣  Start the dev server (in one terminal):"
echo "   npm run dev"
echo ""
echo "2️⃣  Create your video (in another terminal):"
echo "   npm run create:demo"
echo ""
echo "3️⃣  Find your video:"
echo "   open recordings/logisphere-walkthrough-final.mp4"
echo ""
echo "📚 For more options, see: PLAYWRIGHT_QUICKSTART.md"
echo ""
