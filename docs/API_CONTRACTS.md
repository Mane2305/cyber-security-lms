# API_CONTRACTS.md
# Project: CyberShield LMS
# Owner: Claude (Tech Lead)
# Last Updated: May 2026
# Rule: No agent changes any endpoint without updating this file first.

---

## BASE URL

Local development: http://localhost:8000
Production: https://[cloud-run-service-url]/

All endpoints are prefixed with /api

---

## AUTHENTICATION

Every protected endpoint requires this header:
Authorization: Bearer <firebase_jwt_token>

The backend verifies this token using Firebase Admin SDK on every request.
If token is missing or invalid, backend returns 401.
The user's role and uid are extracted from the verified token + Firestore lookup.

Public endpoints (no auth required):
- POST /api/auth/login

All other endpoints are protected.

---

## STANDARD RESPONSE ENVELOPE

Every API response follows this shape:

Success:
{
  "success": true,
  "data": <response payload>,
  "message": "optional human readable message"
}

Error:
{
  "success": false,
  "error": "error code string",
  "message": "human readable error description"
}

Frontend always checks success field before reading data field.

---

## ERROR CODES

AUTH_TOKEN_MISSING: No authorization header sent
AUTH_TOKEN_INVALID: Token verification failed
AUTH_INSUFFICIENT_ROLE: User role does not have permission for this action
USER_NOT_FOUND: User document not found in Firestore
MODULE_NOT_FOUND: Module ID does not exist
MODULE_LOCKED: Employee has not unlocked this module yet
QUIZ_ALREADY_ACTIVE: Employee has an active quiz attempt in progress
QUIZ_NOT_FOUND: Quiz attempt ID not found
GROQ_FAILURE: Groq API call failed (backend should retry once before returning this)
CERTIFICATE_NOT_ELIGIBLE: Employee has not passed all 7 modules yet
VALIDATION_ERROR: Request body failed Pydantic validation

---

## AUTH ENDPOINTS

### POST /api/auth/login
Public endpoint.
Called by frontend Login.jsx after Firebase Auth returns a token.
Purpose: Verify token, return user profile and role so frontend can route correctly.

Request body:
{
  "firebase_token": "string"
}

Success response data:
{
  "uid": "string",
  "email": "string",
  "name": "string",
  "role": "employee" | "manager" | "admin",
  "tenant_id": "string",
  "manager_uid": "string or null (only populated if role is employee)",
  "team_uids": ["string array, only populated if role is manager"]
}

Error responses:
- 401 AUTH_TOKEN_INVALID

---

### POST /api/auth/create-user
Admin only endpoint.
Called by AdminDashboard when admin creates a new user account.

Request body:
{
  "email": "string",
  "name": "string",
  "role": "employee" | "manager",
  "manager_uid": "string or null (required if role is employee)"
}

Success response data:
{
  "uid": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "temporary_password": "string (auto generated, admin shares with new user)"
}

Error responses:
- 403 AUTH_INSUFFICIENT_ROLE (if caller is not admin)
- 400 VALIDATION_ERROR

---

### POST /api/auth/deactivate-user
Admin only endpoint.

Request body:
{
  "uid": "string"
}

Success response data:
{
  "uid": "string",
  "deactivated": true
}

---

## MODULE ENDPOINTS

### GET /api/modules
Protected. All roles.
Returns all 7 modules with employee's unlock and completion status.
If role is manager or admin, returns modules without personal progress (they dont take the course in this view).

Success response data:
{
  "modules": [
    {
      "id": "module_01_phishing",
      "title": "string",
      "description": "string",
      "slide_count": 3,
      "status": "locked" | "unlocked" | "completed",
      "badge_earned": true | false,
      "quiz_best_score": 0-100 | null,
      "order": 1
    }
  ]
}

---

### GET /api/modules/{module_id}
Protected. Employee role only.
Returns full module content including all slides.
Backend checks if employee has this module unlocked before returning content.

Success response data:
{
  "id": "string",
  "title": "string",
  "order": 1,
  "slides": [
    {
      "slide_number": 1,
      "heading": "string",
      "body": "string",
      "key_points": ["string array, max 3 points"]
    }
  ]
}

Error responses:
- 403 MODULE_LOCKED
- 404 MODULE_NOT_FOUND

---

## QUIZ ENDPOINTS

### POST /api/quiz/start
Protected. Employee role only.
Starts a new quiz attempt for a module. Backend calls Groq to generate 5 questions.
Returns attempt ID and generated questions.
Frontend stores attempt_id and uses it for submission.

Request body:
{
  "module_id": "string"
}

Success response data:
{
  "attempt_id": "string (store this, needed for submit)",
  "module_id": "string",
  "questions": [
    {
      "question_number": 1,
      "question_text": "string",
      "options": ["string", "string", "string", "string"],
      "hint": "string (optional, shown if employee asks for hint)"
    }
  ]
}

Note: Correct answer index is NOT returned here. It is stored in Firestore by backend. Never send correct answers to frontend.

Error responses:
- 403 MODULE_LOCKED
- 500 GROQ_FAILURE

---

### POST /api/quiz/submit
Protected. Employee role only.
Submits employee answers for scoring. Backend scores against stored correct answers.
Backend calls Groq for weak area feedback if any answers are wrong.
Backend updates progress, unlocks badge and next module if passed.

Request body:
{
  "attempt_id": "string",
  "answers": [0, 2, 1, 3, 0] (array of 5 integers, each 0-3 representing chosen option index)
}

Success response data:
{
  "attempt_id": "string",
  "module_id": "string",
  "score": 80,
  "passed": true | false,
  "pass_threshold": 70,
  "correct_count": 4,
  "total_questions": 5,
  "results": [
    {
      "question_number": 1,
      "correct": true | false,
      "correct_option_index": 2,
      "explanation": "string"
    }
  ],
  "weak_area_feedback": "string or null (null if all correct)",
  "badge_unlocked": true | false,
  "next_module_unlocked": "module_id string or null",
  "certificate_eligible": true | false
}

Error responses:
- 404 QUIZ_NOT_FOUND
- 400 VALIDATION_ERROR (wrong number of answers)

---

## AI ENDPOINTS

### POST /api/ai/ask
Protected. Employee role only.
Learning assistant. Employee asks a question during a lesson.
Backend sends question + module content to Groq and returns answer.

Request body:
{
  "module_id": "string",
  "question": "string"
}

Success response data:
{
  "answer": "string"
}

Error responses:
- 500 GROQ_FAILURE

---

## REWARDS ENDPOINTS

### GET /api/rewards/badges
Protected. Employee role only.
Returns all badges with earned/not earned status for the requesting employee.

Success response data:
{
  "badges": [
    {
      "module_id": "string",
      "module_title": "string",
      "badge_name": "string",
      "badge_description": "string",
      "earned": true | false,
      "earned_at": "ISO timestamp string or null"
    }
  ]
}

---

### GET /api/rewards/certificate/check
Protected. Employee role only.
Checks if employee is eligible for certificate and if any fraud flag exists.

Success response data:
{
  "eligible": true | false,
  "all_modules_passed": true | false,
  "fraud_flagged": true | false,
  "completion_time_minutes": 45
}

---

### POST /api/rewards/certificate/generate
Protected. Employee role only.
Generates certificate data. Frontend uses this data to render and download via html2canvas.
Backend also saves certificate record to Firestore with timestamp.

Request body: none

Success response data:
{
  "certificate_id": "string",
  "employee_name": "string",
  "issued_at": "ISO timestamp string",
  "modules_completed": 7,
  "tenant_name": "Group SNS",
  "fraud_flagged": true | false
}

Error responses:
- 403 CERTIFICATE_NOT_ELIGIBLE

---

## DASHBOARD ENDPOINTS

### GET /api/dashboard/employee
Protected. Employee role only.
Returns personal progress summary for the employee dashboard.

Success response data:
{
  "employee_name": "string",
  "modules_completed": 3,
  "modules_total": 7,
  "completion_percentage": 42,
  "badges_earned": 3,
  "certificate_eligible": false,
  "current_streak": 2,
  "recent_activity": [
    {
      "module_id": "string",
      "module_title": "string",
      "action": "completed" | "failed_quiz" | "badge_earned",
      "timestamp": "ISO timestamp string"
    }
  ]
}

---

### GET /api/dashboard/manager
Protected. Manager role only.
Returns team progress summary. Only returns data for employees assigned to this manager.

Success response data:
{
  "manager_name": "string",
  "team_size": 10,
  "team_completion_percentage": 60,
  "fully_certified": 3,
  "in_progress": 5,
  "not_started": 2,
  "team_members": [
    {
      "uid": "string",
      "name": "string",
      "email": "string",
      "modules_completed": 5,
      "modules_total": 7,
      "completion_percentage": 71,
      "certificate_earned": false,
      "last_active": "ISO timestamp string or null"
    }
  ]
}

---

### GET /api/dashboard/admin
Protected. Admin role only.
Returns company-wide analytics.

Success response data:
{
  "tenant_id": "string",
  "total_employees": 45,
  "total_certified": 12,
  "overall_completion_percentage": 54,
  "fraud_flags_count": 2,
  "module_completion_rates": [
    {
      "module_id": "string",
      "module_title": "string",
      "completion_rate": 78
    }
  ],
  "recent_fraud_flags": [
    {
      "uid": "string",
      "name": "string",
      "completion_time_minutes": 8,
      "flagged_at": "ISO timestamp string"
    }
  ]
}

---

## ADMIN ENDPOINTS

### GET /api/admin/users
Protected. Admin role only.
Returns all users in the tenant.

Success response data:
{
  "users": [
    {
      "uid": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "active": true | false,
      "manager_uid": "string or null",
      "modules_completed": 3,
      "certificate_earned": false,
      "created_at": "ISO timestamp string"
    }
  ]
}

---

### GET /api/admin/compliance-report
Protected. Admin role only.
Returns full compliance data for export. Frontend triggers CSV download from this.

Success response data:
{
  "generated_at": "ISO timestamp string",
  "tenant_id": "string",
  "report": [
    {
      "name": "string",
      "email": "string",
      "role": "string",
      "modules_completed": 7,
      "certificate_earned": true,
      "certificate_issued_at": "ISO timestamp string or null",
      "fraud_flagged": false,
      "completion_time_minutes": 43
    }
  ]
}

---

## NOTES FOR AGENTS

Cursor (frontend): Use axiosInstance from utils/axiosInstance.js for all API calls. This automatically attaches the auth token. Never use raw fetch or raw axios. Always check response.data.success before reading response.data.data.

Antigravity (backend): Every router function must call verify_token(authorization_header) as the first line before any logic. This function is in services/auth_service.py. Return 401 immediately if token is invalid. Use Pydantic models from models/ folder for all request and response validation.
