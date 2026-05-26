# CyberShield LMS 🛡️

CyberShield LMS is a modern, AI-powered Cyber Security Learning Management System designed to train employees on security best practices, track progress, generate dynamic quizzes, and reward completions with certificates.

## 🛠️ Tech Stack
* **Frontend:** React, Vite (Deployed on Vercel)
* **Backend:** Python, FastAPI, Uvicorn (Deployed on Railway via Docker)
* **Database & Auth:** Firebase Firestore & Firebase Authentication
* **AI Engine:** Groq API (for high-speed, dynamic quiz generation)

## AI-Assisted Development Process

This project was built using a multi-agent AI development workflow — 
treating AI tools not as autocomplete, but as a structured engineering team.

### The Approach

Instead of building everything manually or relying on a single AI tool, 
I designed a multi-agent system where each AI had a specific role and 
ownership boundary. This mirrors how a real engineering team operates.

### Agent Roles

**Claude (Anthropic) — Tech Lead & Architect**
Claude handled all reasoning, architecture decisions, and planning before 
any code was written. This included designing the full system architecture, 
defining all API contracts, designing the Firestore database schema, 
planning the 7-chunk build strategy, writing agent briefing documents, 
and making all technical decisions around stack, security, and scalability. 
No code was written until Claude had specified exactly what needed to be built 
and why.

**Antigravity — Backend Agent**
Antigravity executed all backend implementation inside the backend/ folder. 
Given precise briefings from Claude, it built the FastAPI routes, Firebase 
Admin SDK integration, Groq AI services, quiz engine, risk scoring, 
fraud detection, and all Firestore operations. Each session started with 
the full architecture context so it never made decisions without specification.

**Cursor — Frontend Agent**
Cursor handled all React implementation inside the frontend/ folder. 
It built the complete UI including authentication flows, module viewer, 
quiz interface with animations, all three role dashboards, badge and 
certificate screens, dark theme, and chart visualizations. Like Antigravity, 
it operated from precise Claude-written briefings and never touched the backend.

**ChatGPT — Content Agent**
ChatGPT handled one specific task: formatting the 8 cyber security module 
contents from the provided document into the exact JavaScript data structure 
required by the frontend. Content formatting only, no logic.

### How It Worked In Practice

The key insight was that AI agents fail when given too much context at once. 
The solution was a chunk-based build strategy — 7 focused chunks where each 
agent received only the context relevant to their current task. After each 
chunk, a CHUNK_STATUS.md file was updated capturing exactly what was built, 
what decisions were made, and what the next agent needed to know. This file 
acted as the memory layer across sessions and agents.

Claude wrote four core documents before any agent touched any code:
ARCHITECTURE.md, API_CONTRACTS.md, DATABASE_SCHEMA.md, and CHUNK_STATUS.md. 
Every agent read these before starting. This meant all agents operated from 
a single source of truth, preventing conflicts, naming inconsistencies, and 
architectural drift.

### Why This Matters

This workflow demonstrates something beyond just building a feature — it shows 
how to orchestrate multiple AI systems toward a shared engineering goal. 
The result is a production-architected platform built faster than any single 
agent or manual approach could achieve, with clean separation of concerns, 
consistent code quality, and a codebase that a real engineering team can 
pick up and extend.

## 🚀 Setup Instructions

### Prerequisites
1. A Firebase project with Authentication and Firestore enabled.
2. A `serviceAccountKey.json` from your Firebase project.
3. A Groq API Key.

### Backend Setup
1. `cd backend`
2. Create a virtual environment and run `pip install -r requirements.txt`
3. Create a `.env` file in the `backend/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   FRONTEND_URL=http://localhost:5173
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```
4. Place your `serviceAccountKey.json` in the `backend/` folder.
5. Start the server: `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. Run `npm install`
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_BACKEND_URL=http://localhost:8000
   ```
4. Start the development server: `npm run dev`

## 💡 Key Implementation Decisions
* **Dynamic CORS Handling:** The backend accepts a comma-separated list of origins via the `FRONTEND_URL` environment variable, making it incredibly easy to support multiple Vercel preview domains simultaneously.
* **On-the-fly AI Quizzes:** Instead of static questions, the platform uses the Groq API to instantly generate relevant quiz questions based on the module's slide content, ensuring employees can't memorize answers.
* **Stateless Seed Data:** The backend runs a `seed_data()` function on server startup to initialize tenant configuration, modules, and a test employee, perfectly complementing Railway's ephemeral container scaling.
* **Serverless Firebase Integration:** Using Firebase Auth directly from the frontend while verifying tokens on the FastAPI backend ensures secure, high-performance authentication without maintaining a complex session store.
