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


---

## CHUNK 2 — MODULE VIEWER

Status: COMPLETE
Files Created:

backend/models/module.py
backend/routers/modules.py
frontend/src/pages/EmployeeDashboard.jsx (replaced placeholder)
frontend/src/pages/ModuleViewer.jsx
frontend/src/components/ModuleCard.jsx
frontend/src/components/LessonSlide.jsx
frontend/src/components/ProgressBar.jsx

Key Decisions Made:

8 modules total (module_08_financial_scams added to original 7)
seed_data() in main.py deletes and recreates all module documents on every startup
Modules seeded with slides: [] initially — slides populated in Chunk 3
Take Quiz button in ModuleViewer navigates to /quiz/:module_id
Module IDs use underscore format: module_01_phishing etc
Tested with admin UID only — no employee user existed yet at time of testing

Firestore Collections Touched:

modules (seeded 8 documents)
employee_progress (read only, admin uid used for testing)
activity_log (module_started written on GET /api/modules/{module_id})

What Chunk 3 Needs From This:

Take Quiz navigates to /quiz/:module_id
axiosInstance in utils/axiosInstance.js handles auth automatically
currentUser from useAuth() has shape: { uid, email, name, role, token }
ProtectedRoute accepts allowedRoles prop as array of strings
All API responses shape: { success: true, data: {...} } — always read response.data.data
---

## CHUNK 3 — QUIZ ENGINE (STATIC)
Status: COMPLETE
Files Created:

backend/models/quiz.py (replaced skeleton)
backend/services/completion_checker.py (replaced skeleton)
backend/routers/quiz.py (replaced skeleton)
frontend/src/pages/QuizPage.jsx
frontend/src/components/QuestionCard.jsx
frontend/src/components/ScoreScreen.jsx
frontend/src/components/RetryPrompt.jsx
frontend/src/data/modules.js (populated with full slide content by ChatGPT)
frontend/src/App.jsx (updated, added /quiz/:module_id route)

Key Decisions Made:

Static questions hardcoded in quiz.py STATIC_QUESTIONS dict, 5 questions per module, all 8 modules covered
correct_answer_index stored in Firestore only, never sent to frontend
Pass threshold is 70% (4 out of 5 correct)
Retry flow: QuizPage resets all state and calls POST /api/quiz/start again for fresh attempt
attempt_number increments by counting existing attempts in quiz_attempts collection
weak_area_feedback is null in all responses — Chunk 4 fills this via Groq
RetryPrompt is not a separate page — it is rendered inside ScoreScreen when passed is false
Test employee seeded by seed_data() on startup: employee@groupsns.com / TestEmployee@123
Seed also populates real slide content into all 8 module documents in Firestore

Firestore Collections Touched:

quiz_attempts (created on start, updated on submit)
employee_progress (updated on pass: modules_completed, modules_unlocked, badges_earned, last_module_completed_at)
activity_log (quiz_started, quiz_passed, quiz_failed, module_completed, badge_earned)
modules (slide content seeded)
users (test employee document created)

What Chunk 4 Needs From This:

questions array shape returned by /api/quiz/start: { question_number, question_text, options, hint }
weak_area_feedback field exists in quiz_attempts Firestore document and in submit response — currently null, Chunk 4 replaces with Groq output
WeakAreaFeedback displayed in ScoreScreen inside amber box titled "Areas to Review" when not null
LearningAssistant placeholder exists in ModuleViewer as "Ask AI - Coming Soon" button — Chunk 4 replaces it with real LearningAssistant.jsx component
Groq quiz generator must output exactly 5 questions matching the static question format: question_number, question_text, options (4 strings), correct_answer_index (0-3), explanation, hint

---

## CHUNK 4 — GROQ AI INTEGRATION
Status: COMPLETE

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
- backend/services/groq_service.py
- backend/services/quiz_generator.py
- backend/services/feedback_generator.py
- backend/services/assistant.py
- backend/routers/ai.py
- frontend/src/components/LearningAssistant.jsx
- frontend/src/pages/ModuleViewer.jsx (updated to mount LearningAssistant)
- backend/routers/quiz.py (updated to use Groq questions and weak area feedback)
- backend/main.py (registered AI router)

### Key Decisions Made:
- Groq model updated to llama-3.3-70b-versatile because llama3-70b-8192 is decommissioned
- backend/services/groq_service.py loads backend/.env directly so GROQ_API_KEY works from repo root or backend cwd
- Quiz generation keeps static question fallback if Groq fails
- Quiz generator now uses Group SNS-specific workplace scenarios, attempt_id variation seed, attempt_number, and recent prior questions to improve variety
- AI assistant answers are scoped to the current module content
- Weak area feedback is generated only on failed quizzes; passed quizzes keep weak_area_feedback as null
- LearningAssistant keeps local conversation history and calls POST /api/ai/ask

### What Chunk 5 Needs From This:
- Confirmation that employee_progress.modules_completed updates correctly on pass
- Confirmation that fraud_flagged logic will be triggered from certificate flow (not quiz flow)

---

## CHUNK 5 — BADGES AND CERTIFICATE
Status: COMPLETE

Goal: Badge displays correctly after module pass. Certificate generates after all 8 modules passed. Fraud detection runs before certificate generation.

### Agent Assignments:
- Antigravity: backend/routers/rewards.py, backend/services/badge_service.py, backend/services/fraud_detector.py, backend/services/completion_checker.py (update)
- Cursor: frontend/src/pages/BadgesPage.jsx, frontend/src/pages/CertificatePage.jsx, frontend/src/components/BadgeCard.jsx, frontend/src/components/CertificateTemplate.jsx, frontend/src/utils/certificateGenerator.js

### What to build:

Backend (Antigravity):
- GET /api/rewards/badges: return all 8 badges with earned status for employee per API_CONTRACTS.md
- GET /api/rewards/certificate/check: check if all 8 modules in employee_progress.modules_completed, calculate total_completion_minutes from first_module_started_at to last_module_completed_at, return eligibility and fraud flag
- POST /api/rewards/certificate/generate: if eligible, create certificates collection document, update employee_progress certificate fields, write activity_log entry, return certificate data
- fraud_detector.py: check_fraud(uid, tenant_id) function. Returns boolean. Compares total minutes against tenant settings fraud_detection_minutes (default 20).
- badge_service.py: get_all_badges_for_employee(uid, tenant_id) function that joins module data with employee_progress badges_earned array

Frontend (Cursor):
- BadgesPage.jsx: grid of 8 BadgeCard components. Earned badges shown in full color. Unearned badges shown greyed out with lock icon.
- BadgeCard.jsx: shows badge icon (use emoji or simple SVG), badge name, earned date if earned, module name
- CertificatePage.jsx: fetches certificate check on mount. If not eligible shows progress message. If eligible shows Generate Certificate button. On click calls POST /api/rewards/certificate/generate, then renders CertificateTemplate with returned data, shows Download as PDF button.
- CertificateTemplate.jsx: professional looking certificate layout with employee name, tenant name, completion date, all 8 module names, certificate ID. This is what html2canvas captures.
- certificateGenerator.js: uses html2canvas to capture CertificateTemplate div as canvas, converts to PNG or PDF, triggers browser download

### Test criteria before marking COMPLETE:
- Earned badges show correctly after passing modules
- Unearned badges show as locked
- Certificate page shows not eligible message if modules incomplete
- Certificate generates correctly after all 8 passed
- Certificate PDF downloads successfully
- Certificate has correct employee name, date, all module names
- Fraud flag set correctly if completed in under 20 minutes (test by manually setting timestamps in Firestore)
- Admin can see fraud flags (verify in Firestore, dashboard in Chunk 6)

### Files Created:
- backend/services/badge_service.py
- backend/services/fraud_detector.py
- backend/services/completion_checker.py (updated with get_completion_time_minutes)
- backend/routers/rewards.py
- backend/main.py (registered rewards router)
- frontend/src/pages/BadgesPage.jsx
- frontend/src/pages/CertificatePage.jsx
- frontend/src/components/BadgeCard.jsx
- frontend/src/components/CertificateTemplate.jsx
- frontend/src/utils/certificateGenerator.js

### Key Decisions Made:
- GET /api/rewards/badges returns 8 badge objects with module_id, module_title, badge_name, badge_description, earned, earned_at
- Certificate eligibility requires exactly 8 completed modules
- POST /api/rewards/certificate/generate is idempotent: if certificate_issued is true and certificate exists, it returns existing certificate data
- Fraud detection runs during certificate generation, not quiz submission
- Fraud threshold comes from tenants/{tenant_id}.settings.fraud_detection_minutes with default 20
- Certificate document ID format is cert_{uid}_{unix_timestamp}
- Certificate fields follow DATABASE_SCHEMA.md: certificate_id, uid, tenant_id, employee_name, employee_email, tenant_name, issued_at, valid_until, modules_completed, fraud_flagged, total_completion_minutes
- Activity log writes certificate_generated and, when applicable, fraud_flag_raised
- Badges page displays earned and locked badges from /api/rewards/badges
- Certificate page checks eligibility, generates certificate data, renders certificate preview, and downloads certificate as PNG
- Certificate download now renders directly to canvas from certificate data instead of relying on DOM capture, avoiding silent html2canvas download failures

### Firestore Collections Touched:
- modules (read for badge metadata)
- employee_progress (read for badges/check, updated for certificate_issued, certificate_id, certificate_issued_at, fraud_flagged, total_completion_minutes, updated_at)
- tenants (read for tenant name, certificate_validity_days, fraud_detection_minutes)
- users (read employee name and email)
- certificates (created/read)
- activity_log (certificate_generated, fraud_flag_raised)

### What Chunk 6 Needs From This:
- Dashboards can read employee_progress.modules_completed, badges_earned, certificate_issued, certificate_id, certificate_issued_at, fraud_flagged, total_completion_minutes, last_module_completed_at, updated_at
- certificates collection fields for admin compliance report: certificate_id, uid, tenant_id, employee_name, employee_email, tenant_name, issued_at, valid_until, modules_completed, fraud_flagged, total_completion_minutes
- fraud_flagged exists in both employee_progress and certificates
- Rewards endpoints are registered under /api/rewards

---

## CHUNK 6 — ROLE DASHBOARDS
Status: COMPLETE

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
- backend/services/achievement_service.py
- backend/services/risk_calculator.py
- backend/services/team_service.py
- backend/routers/dashboard.py
- backend/routers/admin.py
- backend/routers/manager.py
- backend/routers/notifications.py
- backend/main.py (registered dashboard, admin, manager, notifications routers)
- frontend/src/pages/EmployeeDashboard.jsx (full dashboard version)
- frontend/src/pages/ManagerDashboard.jsx
- frontend/src/pages/AdminDashboard.jsx
- frontend/src/pages/SettingsPage.jsx
- frontend/src/components/AppLayout.jsx
- frontend/src/components/Sidebar.jsx
- frontend/src/components/AnalyticsCard.jsx
- frontend/src/components/TeamProgressTable.jsx
- frontend/src/components/UserManagement.jsx
- frontend/src/components/ComplianceReport.jsx
- frontend/src/components/NotificationBell.jsx
- frontend/src/components/RiskScoreBadge.jsx
- frontend/src/components/AccountSettings.jsx
- frontend/src/components/ThemeToggle.jsx
- frontend/src/components/skeletons/DashboardSkeleton.jsx
- frontend/src/components/skeletons/ModuleSkeleton.jsx
- frontend/src/components/skeletons/TableSkeleton.jsx
- frontend/src/hooks/useDashboardView.js
- frontend/src/context/ThemeContext.jsx
- frontend/src/utils/formatters.js
- frontend/src/App.jsx (updated dashboard/settings/badges/certificate routes)
- frontend/src/main.jsx (ThemeProvider added)

### Key Decisions Made:
- Dashboards use role-specific API endpoints under /api/dashboard
- Employee dashboard shows progress, unlocked modules, recent activity, certificate status, badges, achievements, risk score, and notifications
- Manager dashboard shows team metrics, member progress table, fraud/high-risk visibility, compliance export, reset quiz flow, and notification handling
- Admin dashboard shows organization metrics, module completion rates, fraud flags, user management, compliance reporting, and risk indicators
- User management supports creating users and deactivating users through admin endpoints
- Compliance report downloads as CSV from frontend using returned report data
- AppLayout and Sidebar provide shared authenticated navigation across protected pages
- ThemeContext powers light/dark theme preference across the frontend
- Notifications are exposed through /api/notifications and shown in the shared layout
- Manager-specific reset quiz endpoint is implemented under /api/manager/reset-quiz
- Frontend build was verified successfully with npm.cmd run build

### What Chunk 7 Needs From This:
- Hardcoded values to review for deployment: API base URL/env handling, CORS origins, tenant_id "group-sns", seeded demo users, fraud threshold defaults, certificate validity defaults
- Known integration gap: docs/API_CONTRACTS.md and docs/ARCHITECTURE.md still reference 7 modules in places, but the app now uses 8 modules
- Known integration gap: html2canvas remains listed in frontend dependencies though certificate download now uses direct canvas rendering
- Protected routes include /dashboard/employee, /dashboard/manager, /dashboard/admin, /module/:module_id, /quiz/:module_id, /badges, /certificate, and /settings
- Backend routers now include auth, modules, quiz, ai, rewards, dashboard, admin, manager, and notifications

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

Chunk 1 - Auth System: COMPLETE
Chunk 2 - Module Viewer: COMPLETE
Chunk 3 - Quiz Engine Static: COMPLETE
Chunk 4 - Groq AI Integration: COMPLETE
Chunk 5 - Badges and Certificate: COMPLETE
Chunk 6 - Role Dashboards: COMPLETE
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
