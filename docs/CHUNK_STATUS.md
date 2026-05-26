# CHUNK_STATUS.md
# Project: CyberShield LMS
# Owner: Saurabh (updated after each chunk completes)
# Rule: Update this file after every chunk before starting the next one.
# Rule: Every agent reads the relevant completed chunks here before starting work.

---

## HOW TO USE THIS FILE

After completing each chunk:
1. Fill in the status, files created, key decisions, and what next chunk needs
2. Commit this file: "docs: chunk[N] status updated"
3. Share updated file with the next agent before they start

If a chunk is not yet started, its section shows "NOT STARTED".
If a chunk is in progress, its section shows "IN PROGRESS".
If a chunk is complete and tested, its section shows "COMPLETE".

---

## CHUNK 1 — AUTH SYSTEM
Status: COMPLETE

Files Created:
- backend/main.py
- backend/services/firebase_service.py
- backend/services/auth_service.py
- backend/models/user.py
- backend/routers/auth.py
- frontend/src/firebase/config.js
- frontend/src/firebase/auth.js
- frontend/src/context/AuthContext.jsx
- frontend/src/hooks/useAuth.js
- frontend/src/utils/axiosInstance.js
- frontend/src/pages/Login.jsx
- frontend/src/components/ProtectedRoute.jsx
- frontend/src/pages/EmployeeDashboard.jsx (placeholder)
- frontend/src/pages/ManagerDashboard.jsx (placeholder)
- frontend/src/pages/AdminDashboard.jsx (placeholder)
- frontend/src/main.jsx
- frontend/src/App.jsx

Key Decisions Made:
- Token stored in localStorage key "cs_token"
- Module IDs in Firestore differ from schema (reconcile in Chunk 2)
- Windows clock sync required for Firebase token verification
- Admin user created manually in Firestore

What Chunk 2 Needs:
- currentUser shape: { uid, email, name, role, token }
- axiosInstance imported from utils/axiosInstance.js
- ProtectedRoute wraps all protected pages

what we defined          what got created
module_01_phishing       module_01_phishing ✅
module_02_passwords      module_02_passwords ✅
module_03_malware        module_03_social_engineering ❌
module_04_vishing        module_04_data_protection ❌
module_05_physical_sec   module_05_device_security ❌
module_06_data_handling  module_06_safe_browsing ❌
module_07_social_eng     module_07_incident_reporting ❌

*****"module IDs in Firestore differ from schema, reconcile before Chunk 2."******
---

## CHUNK 2 — MODULE VIEWER
Status: NOT STARTED

Goal: Employee can see all 7 module cards with lock/unlock status and read lesson slides.

### Agent Assignments:
- Antigravity: backend/routers/modules.py (new file), GET /api/modules, GET /api/modules/{module_id}
- Cursor: frontend/src/pages/EmployeeDashboard.jsx (basic version, just module list), frontend/src/pages/ModuleViewer.jsx, frontend/src/components/ModuleCard.jsx, frontend/src/components/LessonSlide.jsx, frontend/src/components/ProgressBar.jsx
- ChatGPT: frontend/src/data/modules.js (format all 7 modules from docx into structure defined in DATABASE_SCHEMA.md)

### What to build:

Backend (Antigravity):
- GET /api/modules: return all 7 modules with status (locked/unlocked/completed) for the requesting employee
- GET /api/modules/{module_id}: return full module with slides if employee has it unlocked
- Read employee_progress document to determine unlock status
- Return MODULE_LOCKED error if employee requests a locked module

Frontend (Cursor):
- EmployeeDashboard.jsx: grid of 7 ModuleCard components, shows progress bar at top
- ModuleCard.jsx: shows module title, description, lock/unlock icon, completion badge if done, click navigates to /module/{module_id}
- ModuleViewer.jsx: fetches module content, displays slides one at a time, prev/next navigation, shows slide counter (1 of 3), Start Quiz button at end of last slide
- LessonSlide.jsx: renders single slide with heading, body, key points
- ProgressBar.jsx: shows X of 7 modules completed as a visual bar

### Test criteria before marking COMPLETE:
- Employee sees 7 module cards, only first one unlocked initially
- Locked modules show lock icon and are not clickable
- Clicking unlocked module shows lesson slides
- Can navigate forward and backward through slides
- Last slide shows Start Quiz button
- Completed modules show completion checkmark on card
- Progress bar reflects accurate completion count

### Files Created:
(fill in after completion)

### Key Decisions Made:
(fill in after completion)

### Firestore Collections Touched:
(fill in after completion)

### What Chunk 3 Needs From This:
- How ModuleViewer navigates to quiz (what route, what params)
- module_id format used in routes
- How modules.js static data is structured (for fallback)

---

## CHUNK 3 — QUIZ ENGINE (STATIC)
Status: NOT STARTED

Goal: Employee can take a quiz with hardcoded static questions. Score calculated in backend. Pass/fail logic. Retry flow. Results saved to Firestore.

Note: Static questions are temporary. Chunk 4 replaces them with Groq-generated questions. Build the full quiz flow now with static questions so Chunk 4 only needs to swap the question source.

### Agent Assignments:
- Antigravity: backend/routers/quiz.py, backend/models/quiz.py, backend/services/completion_checker.py (basic version)
- Cursor: frontend/src/pages/QuizPage.jsx, frontend/src/components/QuestionCard.jsx, frontend/src/components/ScoreScreen.jsx, frontend/src/components/RetryPrompt.jsx

### What to build:

Backend (Antigravity):
- POST /api/quiz/start: create quiz_attempt document in Firestore with 5 hardcoded questions for that module (different set per module, minimum). Return attempt_id and questions WITHOUT correct_answer_index. Store correct_answer_index in Firestore document only.
- POST /api/quiz/submit: receive attempt_id and answers array. Fetch stored questions from Firestore. Score answers. Calculate percentage. Determine pass or fail using tenant settings pass_threshold (70). If passed: update employee_progress (add module to completed, unlock next module, add badge). Write to activity_log. Return full result per API_CONTRACTS.md.
- completion_checker.py: check_module_completion(uid, tenant_id) function that returns count of completed modules

Frontend (Cursor):
- QuizPage.jsx: fetches quiz via POST /api/quiz/start on mount. Shows one question at a time. Employee selects option. Next button advances. Submit on last question calls POST /api/quiz/submit. Shows loading state while scoring.
- QuestionCard.jsx: renders question text, 4 option buttons, highlights selected option
- ScoreScreen.jsx: shows score percentage, pass or fail message, which answers were right or wrong with explanations, badge earned notification if passed, next module unlocked notification if passed
- RetryPrompt.jsx: shown if failed. Shows score, weak area feedback placeholder (will be filled by Chunk 4), Try Again button that calls POST /api/quiz/start again

### Test criteria before marking COMPLETE:
- Employee can start a quiz and see 5 questions
- Selecting an option highlights it
- Cannot proceed without selecting an option
- Submit sends answers and receives score
- Score screen shows correct and incorrect answers
- Passing (4 or 5 correct) shows badge earned and next module unlocked
- Failing (3 or less correct) shows retry prompt
- Retry starts a new attempt (attempt_number increments)
- quiz_attempts collection in Firestore has correct document after submission
- employee_progress updates correctly on pass

### Files Created:
(fill in after completion)

### Key Decisions Made:
(fill in after completion)

### Firestore Collections Touched:
(fill in after completion)

### What Chunk 4 Needs From This:
- Exact shape of questions array returned by /api/quiz/start (Chunk 4 only changes how these are generated)
- Where weak_area_feedback is displayed in RetryPrompt.jsx (Chunk 4 fills this in)
- Groq service needs to know the static question format to match output format exactly

---

## CHUNK 4 — GROQ AI INTEGRATION
Status: NOT STARTED

Goal: Replace static quiz questions with Groq-generated questions. Add learning assistant widget. Add weak area feedback after failed quiz.

### Agent Assignments:
- Antigravity: backend/services/groq_service.py, backend/services/quiz_generator.py, backend/services/feedback_generator.py, backend/services/assistant.py, backend/routers/ai.py
- Cursor: frontend/src/components/LearningAssistant.jsx, frontend/src/components/WeakAreaFeedback.jsx

### What to build:

Backend (Antigravity):
- groq_service.py: base Groq client setup. Single function call_groq(prompt, system_prompt) that handles API call, error handling, and one retry on failure.
- quiz_generator.py: generate_quiz_questions(module_id, module_content) function. Reads prompt template from prompts/groq_prompts.py. Calls groq_service. Parses JSON response. Validates it has exactly 5 questions with correct structure. Returns questions array in same format as static questions in Chunk 3.
- feedback_generator.py: generate_weak_area_feedback(wrong_questions) function. Takes list of questions employee got wrong. Returns 2-3 sentence feedback string.
- assistant.py: generate_assistant_response(module_id, module_content, employee_question) function. Returns conversational answer scoped to module.
- Update POST /api/quiz/start to call quiz_generator instead of returning static questions
- Update POST /api/quiz/submit to call feedback_generator if any answers wrong, set weak_area_feedback field in response
- POST /api/ai/ask endpoint per API_CONTRACTS.md

Frontend (Cursor):
- LearningAssistant.jsx: small chat widget shown on ModuleViewer.jsx. Has text input and send button. Calls POST /api/ai/ask with module_id and question. Shows response. Shows typing indicator while waiting.
- WeakAreaFeedback.jsx: component shown in RetryPrompt.jsx. Displays weak_area_feedback string from quiz submission response. Show only if weak_area_feedback is not null.
- Add LearningAssistant to ModuleViewer.jsx
- Add WeakAreaFeedback to RetryPrompt.jsx

### Groq prompts to use (exact templates in prompts/groq_prompts.py):
- QUIZ_GENERATION_PROMPT: instructs Groq to generate 5 scenario-based MCQ questions from module content, return as JSON array
- FEEDBACK_GENERATION_PROMPT: instructs Groq to analyze wrong answers and generate personalized feedback
- ASSISTANT_SYSTEM_PROMPT: instructs Groq to act as a helpful cyber security tutor scoped to one module only

### Test criteria before marking COMPLETE:
- Quiz questions are different on every attempt (verify by taking same quiz twice)
- Questions are scenario-based not simple recall
- Learning assistant responds to questions during lesson
- Learning assistant stays on topic (test with off-topic question)
- Weak area feedback appears after failed quiz
- Weak area feedback is specific to what was missed, not generic
- Groq failure returns appropriate error, not crash

### Files Created:
(fill in after completion)

### Key Decisions Made:
(fill in after completion)

### What Chunk 5 Needs From This:
- Confirmation that employee_progress.modules_completed updates correctly on pass
- Confirmation that fraud_flagged logic will be triggered from certificate flow (not quiz flow)

---

## CHUNK 5 — BADGES AND CERTIFICATE
Status: NOT STARTED

Goal: Badge displays correctly after module pass. Certificate generates as downloadable PDF after all 7 modules passed. Fraud detection runs before certificate generation.

### Agent Assignments:
- Antigravity: backend/routers/rewards.py, backend/services/badge_service.py, backend/services/fraud_detector.py, backend/services/completion_checker.py (update)
- Cursor: frontend/src/pages/BadgesPage.jsx, frontend/src/pages/CertificatePage.jsx, frontend/src/components/BadgeCard.jsx, frontend/src/components/CertificateTemplate.jsx, frontend/src/utils/certificateGenerator.js

### What to build:

Backend (Antigravity):
- GET /api/rewards/badges: return all 7 badges with earned status for employee per API_CONTRACTS.md
- GET /api/rewards/certificate/check: check if all 7 modules in employee_progress.modules_completed, calculate total_completion_minutes from first_module_started_at to last_module_completed_at, run fraud detector, return eligibility and fraud flag
- POST /api/rewards/certificate/generate: if eligible, create certificates collection document, update employee_progress certificate fields, write activity_log entry, return certificate data
- fraud_detector.py: detect_suspicious_completion(first_started_at, last_completed_at, fraud_threshold_minutes) function. Returns boolean. Compares total minutes against tenant settings fraud_detection_minutes (default 20).
- badge_service.py: get_badges_for_employee(uid, tenant_id) function that joins module data with employee_progress badges_earned array

Frontend (Cursor):
- BadgesPage.jsx: grid of 7 BadgeCard components. Earned badges shown in full color. Unearned badges shown greyed out with lock icon.
- BadgeCard.jsx: shows badge icon (use emoji or simple SVG), badge name, earned date if earned, module name
- CertificatePage.jsx: fetches certificate check on mount. If not eligible shows progress message. If eligible shows Generate Certificate button. On click calls POST /api/rewards/certificate/generate, then renders CertificateTemplate with returned data, shows Download as PDF button.
- CertificateTemplate.jsx: professional looking certificate layout with employee name, tenant name, completion date, all 7 module names, certificate ID. This is what html2canvas captures.
- certificateGenerator.js: uses html2canvas to capture CertificateTemplate div as canvas, converts to PNG or PDF, triggers browser download

### Test criteria before marking COMPLETE:
- Earned badges show correctly after passing modules
- Unearned badges show as locked
- Certificate page shows not eligible message if modules incomplete
- Certificate generates correctly after all 7 passed
- Certificate PDF downloads successfully
- Certificate has correct employee name, date, all module names
- Fraud flag set correctly if completed in under 20 minutes (test by manually setting timestamps in Firestore)
- Admin can see fraud flags (verify in Firestore, dashboard in Chunk 6)

### Files Created:
(fill in after completion)

### Key Decisions Made:
(fill in after completion)

### Firestore Collections Touched:
(fill in after completion)

### What Chunk 6 Needs From This:
- Exact fields in employee_progress that dashboards will read
- certificates collection structure for admin compliance report
- fraud_flagged field location in both employee_progress and certificates

---

## CHUNK 6 — ROLE DASHBOARDS
Status: NOT STARTED

Goal: Three distinct dashboard views fully working. Employee sees own progress. Manager sees team. Admin sees everything plus user management.

### Agent Assignments:
- Antigravity: backend/routers/dashboard.py, backend/routers/admin.py
- Cursor: frontend/src/pages/EmployeeDashboard.jsx (full version, replace basic from Chunk 2), frontend/src/pages/ManagerDashboard.jsx, frontend/src/pages/AdminDashboard.jsx, frontend/src/components/TeamProgressTable.jsx, frontend/src/components/AnalyticsCard.jsx, frontend/src/components/UserManagement.jsx, frontend/src/components/ComplianceReport.jsx

### What to build:

Backend (Antigravity):
- GET /api/dashboard/employee per API_CONTRACTS.md
- GET /api/dashboard/manager per API_CONTRACTS.md (only return team members assigned to this manager via manager.team_uids)
- GET /api/dashboard/admin per API_CONTRACTS.md
- GET /api/admin/users per API_CONTRACTS.md
- GET /api/admin/compliance-report per API_CONTRACTS.md

Frontend (Cursor):
- EmployeeDashboard.jsx full version: progress bar, module grid, recent activity feed, badges summary, certificate status card, link to BadgesPage
- ManagerDashboard.jsx: team completion percentage card, TeamProgressTable with each member's status, download compliance report button (calls /api/admin/compliance-report scoped to team, triggers CSV download)
- AdminDashboard.jsx: analytics cards row (total employees, certified count, completion percentage, fraud flags count), module completion rates list, recent fraud flags table, UserManagement section
- TeamProgressTable.jsx: table with columns name, email, modules completed, completion percentage, certificate status, last active
- AnalyticsCard.jsx: reusable card showing a single metric with label and value
- UserManagement.jsx: table of all users with create user button (opens modal with form), deactivate user button per row
- ComplianceReport.jsx: button that downloads CSV from /api/admin/compliance-report response

### Test criteria before marking COMPLETE:
- Employee dashboard shows correct progress
- Manager dashboard shows only their team members, not other employees
- Admin dashboard shows company-wide numbers
- Admin can create a new employee account and they can login
- Admin can deactivate a user and that user cannot login
- Compliance report CSV downloads with correct data
- Fraud flags visible in admin dashboard

### Files Created:
(fill in after completion)

### Key Decisions Made:
(fill in after completion)

### What Chunk 7 Needs From This:
- List of any hardcoded values that need environment variable replacement
- Any known integration gaps between chunks
- List of pages and their routes

---

## CHUNK 7 — GLUE AND DEPLOY
Status: NOT STARTED

Goal: Full end-to-end flow working. Docker containers built. Deployed to GCP Cloud Run. Live URL ready for submission.

### Agent Assignments:
- Antigravity: backend/Dockerfile, docker-compose.yml, GitHub Actions workflow for backend
- Cursor: frontend/Dockerfile, GitHub Actions workflow for frontend
- Saurabh: GCP project setup, Cloud Run service creation, environment variables in GCP Secret Manager, final testing

### What to build:

Backend Dockerfile:
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

Frontend Dockerfile:
  FROM node:18-alpine AS build
  WORKDIR /app
  COPY package*.json .
  RUN npm install
  COPY . .
  RUN npm run build
  FROM nginx:alpine
  COPY --from=build /app/dist /usr/share/nginx/html
  EXPOSE 80

docker-compose.yml: runs both containers locally with shared .env file

GitHub Actions (.github/workflows/deploy.yml):
  On push to main:
  - Build frontend Docker image
  - Build backend Docker image  
  - Push both to GCP Artifact Registry
  - Deploy both to GCP Cloud Run

Integration checklist:
- All API calls in frontend use VITE_BACKEND_URL env variable
- All CORS origins in FastAPI main.py use FRONTEND_URL env variable
- Firebase service account JSON stored in GCP Secret Manager, not in repo
- All 7 Firestore indexes created in console
- Seed data function runs on backend startup
- Test full flow: register employee, complete module 1, take quiz, earn badge, check dashboard

### Test criteria before marking COMPLETE:
- docker-compose up runs both services locally without errors
- Full flow works on local Docker
- Frontend builds and deploys to Cloud Run
- Backend builds and deploys to Cloud Run
- Live URL works end to end
- Environment variables set correctly in Cloud Run service
- GitHub push triggers automatic redeploy

### Files Created:
(fill in after completion)

### Deployment URLs:
Frontend: (fill in after deployment)
Backend: (fill in after deployment)
GitHub Repo: https://github.com/Mane2305/cyber-security-lms

---

## CHUNK STATUS SUMMARY

Chunk 1 - Auth System: NOT STARTED
Chunk 2 - Module Viewer: NOT STARTED
Chunk 3 - Quiz Engine Static: NOT STARTED
Chunk 4 - Groq AI Integration: NOT STARTED
Chunk 5 - Badges and Certificate: NOT STARTED
Chunk 6 - Role Dashboards: NOT STARTED
Chunk 7 - Glue and Deploy: NOT STARTED

---

## HOW TO BRIEF AN AGENT FOR A CHUNK

When starting a new chunk, paste this into the agent's context:

---
You are working on CyberShield LMS. Read these three documents before writing any code:
[paste ARCHITECTURE.md]
[paste API_CONTRACTS.md]
[paste DATABASE_SCHEMA.md]

Your task for this session is Chunk [N]: [chunk name].
Here is what was completed in previous chunks:
[paste relevant completed sections from CHUNK_STATUS.md]

Your specific assignments for this chunk:
[paste the agent-specific section from this chunk's assignment above]

Rules:
- Stay in your assigned folder only
- Use exact field names from DATABASE_SCHEMA.md
- Use exact endpoint contracts from API_CONTRACTS.md
- Do not make architectural decisions, flag them for Claude instead
---