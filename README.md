# HealthCards - AI-Powered Healthcare Priority System

A simple, clean healthcare priority system that uses AI to rank patients based on their medical information. Built with React frontend and Python Flask backend, integrated with Ollama for AI-powered priority scoring.

## Features

- **Patient Cards**: Display patient information with medical data
- **AI Priority Scoring**: Automatic ranking using Ollama AI
- **Real-time Updates**: Priority scores update when patient data changes
- **Clean UI**: Modern, responsive design with color-coded priority levels
- **Simple Setup**: Minimal dependencies and easy configuration

## Tech Stack

- **Frontend**: React (Vite) with vanilla CSS
- **Backend**: Python Flask
- **AI**: Ollama (local LLM)
- **Storage**: JSON file (for prototyping)

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** installed
3. **Ollama** installed and running locally

### Installing Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

## Setup Instructions

### 1. Clone and Navigate

```bash
cd HealthCards
```

### 2. Quick Start (Recommended)

The easiest way to get started is using the provided start script:

```bash
./start.sh
```

This script will:
- ✅ Check prerequisites (Python, Node.js, npm)
- ✅ Set up Python virtual environment if needed
- ✅ Install frontend dependencies if needed
- ✅ Start both backend and frontend services
- 🍎 On macOS: Opens services in separate terminal windows
- 🐧 On Linux: Runs services in background
- 🪟 On Windows: Runs services sequentially

### 3. Manual Setup (Alternative)

If you prefer to set up manually:

#### Setup Python Backend with Virtual Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

#### Setup React Frontend

```bash
cd ../frontend
npm install
```

### 4. Start Ollama

Make sure Ollama is running and you have a model installed:

```bash
# Start Ollama service
ollama serve

# In another terminal, pull a model (llama3:8b is used by default)
ollama pull llama3:8b
```

### 5. Run the Application

**Option A: Using the start script (Recommended)**
```bash
./start.sh
```

**Option B: Manual startup**

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### 6. Stopping the Application

**Option A: Using the stop script**
```bash
./stop.sh
```

**Option B: Manual stop**
- Press `Ctrl+C` in each terminal window
- Or close the terminal windows

### Alternative: Use the Run Script

You can also use the provided run script for the backend:

```bash
cd backend
./run.sh
```

## Usage

### Adding Patients

1. Click "Add New Patient" button
2. Fill in patient information:
   - **Name** (required)
   - **Age** and **Gender**
   - **Symptoms** (required) - This is crucial for AI priority scoring
   - **Vital Signs** (optional) - Blood pressure, heart rate, temperature, oxygen saturation
   - **Medical History** (optional)
3. Click "Add Patient" - AI will automatically calculate priority score

### Priority Levels

- **Critical (Red)**: Immediate attention required
- **High (Orange)**: Attention within 30 minutes
- **Medium (Yellow)**: Attention within 2 hours
- **Low (Green)**: Can wait longer
- **Very Low (Gray)**: Non-urgent

### Editing Patients

1. Click "Edit Patient" on any patient card
2. Modify the information
3. Click "Save" - AI will recalculate priority if symptoms or vitals changed

## AI Configuration

### Changing the Model

Edit `backend/ollama_client.py`:

```python
class OllamaClient:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3:8b"  # Change this to any model you have
```

### Customizing Priority Logic

The AI prompt is in `backend/ollama_client.py`. You can modify the prompt to adjust how the AI evaluates patient priority.

## API Endpoints

All endpoints are available at `http://localhost:5001`:

- `GET /api/patients` - Get all patients
- `POST /api/patients` - Add new patient
- `PUT /api/patients/:id` - Update patient
- `POST /api/priority` - Get priority score for patient data

## Data Storage

Patient data is stored in `backend/data/patients.json`. For production, consider using a proper database.

## Troubleshooting

### Virtual Environment Issues

1. Make sure you're in the backend directory: `cd backend`
2. Activate the virtual environment: `source venv/bin/activate`
3. Verify Flask is installed: `pip list | grep flask`

### Ollama Connection Issues

1. Ensure Ollama is running: `ollama serve`
2. Check if model is installed: `ollama list`
3. Test connection: `curl http://localhost:11434/api/tags`

### Backend Issues

1. Check Python dependencies: `pip install -r requirements.txt`
2. Ensure port 5001 is available
3. Check logs for error messages

### Frontend Issues

1. Ensure Node.js dependencies are installed: `npm install`
2. Check if port 3000 is available
3. Verify backend is running on port 5001

## Development

### Project Structure

```
HealthCards/
├── start.sh              # Quick start script for both services
├── stop.sh               # Stop script for both services
├── .gitignore            # Git ignore file
├── README.md             # This file
├── backend/
│   ├── app.py              # Flask application
│   ├── ollama_client.py    # Ollama integration
│   ├── requirements.txt    # Python dependencies
│   ├── run.sh             # Backend-only start script
│   ├── venv/              # Virtual environment
│   └── data/
│       └── patients.json   # Patient data storage
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PatientCard.jsx
│   │   │   ├── PriorityQueue.jsx
│   │   │   └── AddPatient.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

### Adding Features

- **New Patient Fields**: Add to form in `AddPatient.jsx` and backend validation
- **Custom AI Models**: Modify `ollama_client.py` to use different models
- **Database Integration**: Replace JSON storage with SQLite/PostgreSQL
- **Real-time Updates**: Add WebSocket support for live updates

## License

This project is for educational and prototyping purposes. Not intended for production medical use.

## Contributing

Feel free to submit issues and enhancement requests! 