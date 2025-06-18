# English Learning App

A voice-based English learning application with real-time transcription, translation, and AI-powered conversation features.

## Project Structure

```
english-app-ver2/
├── backend/          # Python Flask API server
├── frontend/         # Next.js React application
└── README.md         # This file
```

## Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download here](https://python.org/)
- **pnpm** (recommended) or npm - Install with `npm install -g pnpm`

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
```

### 3. Activate Virtual Environment

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install Dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_translate_api_key
```

### 6. Run Backend Server
```bash
python app.py
```

The backend server will start on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_translate_api_key
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
NEXT_PUBLIC_LIVEKIT_API_KEY=your_livekit_api_key
```

### 4. Run Frontend Development Server
```bash
pnpm dev
```

The frontend application will start on `http://localhost:3000`

## Running Both Applications

### Option 1: Separate Terminals

**Terminal 1 (Backend):**
```bash
cd backend
.venv\Scripts\activate  # Windows
python app.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
pnpm dev
```

### Option 2: Using Task Runner

If you have a task runner like `concurrently` installed globally:

```bash
# Install concurrently globally
npm install -g concurrently

# Run both from project root
concurrently "cd backend && .venv\\Scripts\\activate && python app.py" "cd frontend && pnpm dev"
```

## Features

### Backend Features
- LiveKit voice assistant integration
- Groq AI conversation processing
- Real-time transcription
- Voice activity detection
- Turn detection

### Frontend Features
- Real-time voice conversation interface
- Live transcription display
- Word definition lookup (double-click words)
- Text translation (select text to translate)
- Modern, responsive UI
- Virtual avatar support


### Backend Development
- The main application file is `backend/app.py`
- API endpoints are defined in the Flask routes
- LiveKit agent configuration is in the assistant setup

### Frontend Development
- Built with Next.js 14 and React 18
- Uses TypeScript for type safety
- Styled with Tailwind CSS
- Main components are in `frontend/components/`

## API Keys Required

1. **LiveKit** - For real-time voice communication
   - Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
   - Get URL, API Key, and API Secret

2. **Groq** - For AI conversation processing
   - Sign up at [Groq](https://console.groq.com/)
   - Get API key

3. **Google Translate** - For text translation
   - Enable Google Translate API in Google Cloud Console
   - Get API key
