from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json

app = FastAPI()

# Enable CORS so frontend at localhost:3000 can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store of patients for PoC
patients = []

# Pydantic model for request body
class ChatRequest(BaseModel):
    user_input: str

# Format prompt for Ollama
def build_prompt(user_input: str) -> str:
    return f"""
You are an assistant that extracts structured information from clinical notes.
Given a sentence like: "{user_input}", extract the patient's:

- Name (if given, otherwise "Unknown")
- Age (if given, otherwise null)
- Gender (if mentioned, otherwise "Unknown")
- Condition or synopsis (a short summary of what's wrong)

Respond in this JSON format:

{{
  "name": "...",
  "age": ...,
  "gender": "...",
  "condition": "..."
}}
"""

# Async function to talk to Ollama's HTTP API
async def query_ollama(user_input: str) -> str:
    prompt = build_prompt(user_input)
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:11434/api/chat", json={
            "model": "llama3",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        })
        return response.json()['message']['content']

# Endpoint to handle user input and extract patient info
@app.post("/chat")
async def chat(request: ChatRequest):
    content = await query_ollama(request.user_input)
    try:
        parsed_patient = json.loads(content)
        patients.append(parsed_patient)
        return {"patient": parsed_patient}
    except json.JSONDecodeError:
        return {"error": "Failed to parse response", "raw": content}

# Endpoint to return all patients
@app.get("/patients")
async def get_patients():
    return {"patients": patients}
