# ARCHITECTURE.md
# Project: CyberShield LMS — AI-Powered Cyber Security Awareness Training Platform
# Lead Architect: Claude (Anthropic)
# Last Updated: May 2026

---

## WHAT IS THIS PROJECT

A SaaS-ready, multi-tenant Learning Management System (LMS) built for corporate cyber security awareness training. The platform trains employees through bite-sized modules, AI-generated quizzes, and issues badges and certificates on completion. Designed for Group SNS (18,000 employees, Dubai HQ) as a prototype that can scale.

This is NOT a generic LMS. It is scoped specifically to:
- 7 fixed cyber security training modules
- 3 user roles: Employee, Manager, Admin
- AI-powered quiz generation and learning assistance via Groq
- Badge per module, certificate after all 7 modules passed

---

## AGENT RESPONSIBILITIES

Every agent working on this repo must read this section before writing any code.

### Claude (Tech Lead)
- Owns: docs/, prompts/, all architectural decisions
- Writes: ARCHITECTURE.md, API_CONTRACTS.md, DATABASE_SCHEMA.md, Groq prompt templates
- Reviews: logic decisions, data structure changes, integration points
- Rule: No code writing. Reasoning and specification only.

### Cursor (Frontend Agent)
- Owns: frontend/ folder exclusively
- Reads: ARCHITECTURE.md, API_CONTRACTS.md, DATABASE_SCHEMA.md before starting each chunk
- Communicates with backend via REST API endpoints defined in API_CONTRACTS.md
- Rule: Never touch backend/ folder. Never hardcode business logic. All quiz scoring, badge unlocking, certificate generation triggered via API calls to backend.

### Antigravity (Backend Agent)
- Owns: backend/ folder exclusively
- Reads: ARCHITECTURE.md, API_CONTRACTS.md, DATABASE_SCHEMA.md before starting each chunk
- Handles: FastAPI routes, Groq integration, Firebase Admin SDK, all business logic
- Rule: Never touch frontend/ folder. All responses follow the response contracts in API_CONTRACTS.md exactly.

### ChatGPT (Content + Boilerplate Agent)
- Owns: frontend/src/data/modules.js only
- Task: Format the 7 module contents into the JS data structure defined in DATABASE_SCHEMA.md
- Rule: No logic. Data formatting only.

### Gemini Codex (Debug Agent)
- Owns: Nothing permanently. Read-only access to full codebase.
- Task: Called only when a bug exists that requires full codebase context to diagnose
- Rule: Suggest fixes only. Saurabh applies them manually.

---

## SYSTEM ARCHITECTURE OVERVIEW

```
[Browser - React + Vite + Tailwind]
        |
        | HTTP REST calls
        |
[FastAPI Backend - GCP Cloud Run]
        |
        |--- Firebase Admin SDK ---> [Firestore Database]
        |--- Firebase Admin SDK ---> [Firebase Auth]
        |--- Groq Python SDK ------> [Groq API - LLM]
```

No direct frontend to Firestore calls. All data flows through the FastAPI backend. Firebase Auth tokens are verified by the backend on every protected request. This is intentional for security and future scalability.

---

## TECH STACK

Frontend: React 18 + Vite
Styling: Tailwind CSS
Routing: React Router v6
HTTP Client: Axios
Backend: FastAPI (Python)
Auth: Firebase Authentication (SSO-ready via SAML/Azure AD/Google)
Database: Firestore (GCP)
AI: Groq API with llama3-70b-8192 model
Containers: Docker (both frontend and backend)
Deployment: GCP Cloud Run (serverless, scales to zero)
CI/CD: GitHub Actions (auto deploy on push to main)

---

## MULTI-TENANT DESIGN DECISION

Every Firestore document that belongs to an organization has a tenantId field. For this prototype, tenantId is always "group-sns". When the platform is sold to another company, a new tenantId is created and their data is completely isolated. No schema changes needed to support this later.

This decision costs nothing now but saves a full rebuild later.

---

## AUTHENTICATION FLOW

1. Employee opens app, sees login screen
2. Employee enters email + password
3. Firebase Auth validates credentials, returns JWT token
4. Frontend stores token in memory (not localStorage, not sessionStorage)
5. Every API call sends token in Authorization header as: Bearer <token>
6. FastAPI backend verifies token using Firebase Admin SDK on every protected request
7. Backend reads user role from Firestore users collection
8. Backend returns data scoped to that role only

Admin creates all user accounts. Employees cannot self-register. This is intentional for enterprise security compliance.

---

## ROLE SYSTEM

Three roles exist. Stored in Firestore users collection, not in Firebase Auth custom claims (simpler for prototype, can migrate to custom claims for scale without data changes).

Employee:
- Can: view modules, take quizzes, see own progress, earn badges, download certificate
- Cannot: see other users data, access admin or manager views

Manager:
- Can: everything Employee can + view their assigned team progress, see who passed/failed/pending, download team compliance report as CSV
- Cannot: create users, edit content, see teams not assigned to them

Admin:
- Can: everything + create/deactivate user accounts, assign managers to employees, view company-wide analytics, edit module content in Firestore, see fraud flags on suspicious completions
- Cannot: nothing restricted

---

## MODULE SYSTEM

7 fixed modules. Content stored in Firestore as documents, not hardcoded in frontend. Admin can edit content without triggering a code deployment.

Module IDs (use these exact strings everywhere):
- module_01_phishing
- module_02_passwords
- module_03_malware
- module_04_vishing
- module_05_physical_security
- module_06_data_handling
- module_07_social_engineering

Module unlock logic: Sequential. Employee must pass module N before module N+1 unlocks. Module 01 is unlocked by default for all employees.

Module completion flow:
1. Employee clicks module card (if unlocked)
2. Reads 3-4 bite-sized lesson slides (max 2 min read)
3. Clicks "Take Quiz"
4. Backend generates 5 AI questions via Groq
5. Employee answers all 5
6. Backend scores, returns result
7. Score 70% or above (4/5 or 5/5): badge unlocks, next module unlocks, progress updates
8. Score below 70% (3/5 or less): retry screen shown, new AI questions generated on retry
9. After all 7 modules passed: certificate generation becomes available

---

## AI FEATURES

All AI calls go through the FastAPI backend. Frontend never calls Groq directly. This keeps the API key secure and allows prompt versioning.

Feature 1 — Adaptive Quiz Generation:
- Triggered when: employee starts a quiz attempt (including retries)
- Backend sends to Groq: module content text + prompt from groq_prompts.py
- Groq returns: 5 scenario-based MCQ questions, 4 options each, correct answer index (0-3), brief explanation per question
- Backend validates response structure before sending to frontend
- Effect: Every attempt has different questions. Answer memorization is impossible.

Feature 2 — Per-Module Learning Assistant:
- Triggered when: employee types a question in the chat widget during a lesson
- Backend sends to Groq: employee question + module content as system context
- Groq returns: conversational explanation scoped only to that module
- Effect: Employee gets instant help without leaving the platform or googling

Feature 3 — Weak Area Feedback:
- Triggered when: quiz is submitted and scored
- Backend sends to Groq: list of questions employee got wrong + their chosen wrong answers
- Groq returns: 2-3 sentence personalized feedback naming exactly what concepts they missed
- Effect: Employee knows specifically what to review before retrying

Feature 4 — Suspicious Completion Detection:
- Triggered when: certificate generation is requested
- This is NOT AI. Pure backend logic.
- Rule: If total time across all 7 module completions is under 20 minutes, flag as suspicious
- Time is calculated from first_module_started_at to last_module_completed_at in Firestore
- Effect: Certificate still generates but admin dashboard shows a fraud flag on that employee record

---

## BUILD ORDER

Build in this exact sequence. Do not start a chunk until the previous chunk is tested and CHUNK_STATUS.md is updated.

Chunk 1: Auth System
- Firebase Auth setup, login page, role-based routing, protected routes, AuthContext

Chunk 2: Module Viewer
- Dashboard with module cards, lesson slide viewer, sequential unlock logic, progress bar

Chunk 3: Quiz Engine (Static)
- Quiz page with hardcoded questions first, score calculation in backend, pass/fail logic, retry flow, results saved to Firestore

Chunk 4: Groq AI Integration
- Replace static questions with Groq-generated questions, add learning assistant widget, add weak area feedback after quiz

Chunk 5: Badges and Certificate
- Badge unlock after passing each module, certificate template, html2canvas PDF generation, fraud detection logic in backend

Chunk 6: Role Dashboards
- Employee dashboard (own progress), Manager dashboard (team view, compliance report), Admin dashboard (company analytics, user management, fraud flags)

Chunk 7: Glue and Deploy
- Wire all chunks together, fix integration gaps, Docker setup, GCP Cloud Run deployment, GitHub Actions CI/CD, final README

---

## ENVIRONMENT VARIABLES

Never commit .env to git. Use .env.example as reference.

Frontend (.env in frontend/):
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_BACKEND_URL

Backend (.env in backend/):
GROQ_API_KEY
FIREBASE_SERVICE_ACCOUNT_PATH (path to downloaded service account JSON)
FRONTEND_URL (for CORS)

---

## FOLDER STRUCTURE

cyber-security-lms/
  frontend/
    src/
      pages/
        Login.jsx
        EmployeeDashboard.jsx
        ManagerDashboard.jsx
        AdminDashboard.jsx
        ModuleViewer.jsx
        QuizPage.jsx
        BadgesPage.jsx
        CertificatePage.jsx
      components/
        ModuleCard.jsx
        LessonSlide.jsx
        QuestionCard.jsx
        ScoreScreen.jsx
        RetryPrompt.jsx
        BadgeCard.jsx
        CertificateTemplate.jsx
        LearningAssistant.jsx
        WeakAreaFeedback.jsx
        ProgressBar.jsx
        TeamProgressTable.jsx
        AnalyticsCard.jsx
        UserManagement.jsx
      context/
        AuthContext.jsx
      hooks/
        useAuth.js
        useProgress.js
      data/
        modules.js (static fallback content, formatted by ChatGPT agent)
      utils/
        certificateGenerator.js
        axiosInstance.js (axios with auth token interceptor)
      firebase/
        config.js
        auth.js
    index.html
    vite.config.js
    tailwind.config.js
    Dockerfile

  backend/
    main.py
    routers/
      auth.py
      quiz.py
      ai.py
      dashboard.py
      admin.py
      rewards.py
    services/
      groq_service.py
      quiz_generator.py
      feedback_generator.py
      assistant.py
      badge_service.py
      completion_checker.py
      fraud_detector.py
    models/
      user.py
      quiz.py
    requirements.txt
    Dockerfile

  docs/
    ARCHITECTURE.md (this file)
    API_CONTRACTS.md
    DATABASE_SCHEMA.md
    CHUNK_STATUS.md

  prompts/
    groq_prompts.py

  docker-compose.yml
  .env.example
  .gitignore
  README.md

---

## RULES EVERY AGENT MUST FOLLOW

1. Read ARCHITECTURE.md, API_CONTRACTS.md, DATABASE_SCHEMA.md before writing any code
2. Never hardcode secrets. Always use environment variables.
3. Never write business logic in frontend. Make API call to backend instead.
4. Never change an API endpoint contract without updating API_CONTRACTS.md first
5. Never change a Firestore collection structure without updating DATABASE_SCHEMA.md first
6. Every backend route must verify Firebase Auth token before processing request
7. Every Firestore document belonging to an organization must have tenantId field
8. After completing a chunk, update CHUNK_STATUS.md before starting next chunk
9. Commit after each chunk: "feat: chunk[N] - [chunk name] complete"
10. If stuck on an architectural decision, stop and consult Claude with a specific question. Do not guess.

---

## PRODUCTION SCALE NOTE

This prototype uses Firebase Auth + Firestore + GCP Cloud Run. For production at 18,000 employees the following changes are needed but require no architecture rebuild:
- Auth: Enable Firebase SAML SSO with existing Azure AD or Google Workspace
- Database: Add composite Firestore indexes for large collection queries
- Certificate generation: Move to async queue via GCP Cloud Tasks
- Frontend: Serve via Firebase Hosting with Cloud CDN for global edge delivery
- Monitoring: Add GCP Cloud Logging and Error Reporting
- These are infrastructure and configuration changes only. The codebase does not change.
