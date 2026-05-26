# CyberShield LMS 🛡️

CyberShield LMS is a modern, AI-powered Cyber Security Learning Management System designed to train employees on security best practices, track progress, generate dynamic quizzes, and reward completions with certificates.

## 🛠️ Tech Stack
* **Frontend:** React, Vite (Deployed on Vercel)
* **Backend:** Python, FastAPI, Uvicorn (Deployed on Railway via Docker)
* **Database & Auth:** Firebase Firestore & Firebase Authentication
* **AI Engine:** Groq API (for high-speed, dynamic quiz generation)

## 🤖 How Antigravity Was Utilized
This project was built collaboratively with **Antigravity** (Google DeepMind's Agentic AI). Antigravity was utilized to:
* Architect and implement the entire FastAPI backend chunk-by-chunk.
* Design and enforce the Firestore database schemas and security rules.
* Integrate Firebase Authentication and role-based access control (Admin, Manager, Employee).
* Build the AI quiz engine using the Groq API.
* Debug deployment issues, configure CORS for multiple Vercel preview environments, and Dockerize the backend for Railway.

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