# DATABASE_SCHEMA.md
# Project: CyberShield LMS
# Owner: Claude (Tech Lead)
# Last Updated: May 2026
# Rule: No agent changes any collection or field without updating this file first.

---

## DATABASE: FIRESTORE (GCP)

Firestore is a NoSQL document database. Data is organized as collections containing documents. Each document is a JSON-like object with fields. Documents can have subcollections.

This file defines every collection, every document structure, every field name, every field type, and every constraint. Agents must use exact field names as written here. No variations, no camelCase vs snake_case confusion — everything here is snake_case.

---

## TENANT ISOLATION RULE

Every document that belongs to an organization must have a tenant_id field with value "group-sns" for this prototype. When querying any collection, always filter by tenant_id first. This ensures multi-tenant safety from day one.

Exception: The tenants collection itself does not have a tenant_id field.

---

## COLLECTION: tenants

One document per company using the platform.

Document ID: tenant_id string (example: "group-sns")

Fields:
  tenant_id: string — same as document ID
  name: string — display name (example: "Group SNS")
  created_at: timestamp
  active: boolean
  settings:
    max_users: number
    certificate_validity_days: number (how long cert is valid, 365 default)
    pass_threshold: number (percentage, default 70)
    fraud_detection_minutes: number (default 20, completions under this are flagged)

Example document:
{
  "tenant_id": "group-sns",
  "name": "Group SNS",
  "created_at": "2026-05-01T00:00:00Z",
  "active": true,
  "settings": {
    "max_users": 18000,
    "certificate_validity_days": 365,
    "pass_threshold": 70,
    "fraud_detection_minutes": 20
  }
}

---

## COLLECTION: users

One document per user. Document ID is Firebase Auth UID.

Document ID: firebase_uid string

Fields:
  uid: string — same as document ID, Firebase Auth UID
  tenant_id: string — which org this user belongs to
  email: string
  name: string
  role: string — must be exactly one of: "employee", "manager", "admin"
  active: boolean — false means deactivated, cannot login
  manager_uid: string or null — only set if role is "employee", points to their manager's uid
  team_uids: array of strings or empty array — only populated if role is "manager", list of employee uids on their team
  created_at: timestamp
  created_by_uid: string — uid of admin who created this user
  last_login_at: timestamp or null

Example employee document:
{
  "uid": "abc123",
  "tenant_id": "group-sns",
  "email": "john.doe@groupsns.com",
  "name": "John Doe",
  "role": "employee",
  "active": true,
  "manager_uid": "mgr456",
  "team_uids": [],
  "created_at": "2026-05-10T09:00:00Z",
  "created_by_uid": "admin789",
  "last_login_at": "2026-05-26T08:30:00Z"
}

Example manager document:
{
  "uid": "mgr456",
  "tenant_id": "group-sns",
  "email": "sarah.khan@groupsns.com",
  "name": "Sarah Khan",
  "role": "manager",
  "active": true,
  "manager_uid": null,
  "team_uids": ["abc123", "def456", "ghi789"],
  "created_at": "2026-05-01T09:00:00Z",
  "created_by_uid": "admin789",
  "last_login_at": "2026-05-26T07:00:00Z"
}

---

## COLLECTION: modules

One document per module. 8 documents total. These are seeded once by admin setup. Content editable by admin without code deployment.

Document ID: module_id string (use exact IDs below)

Exact module IDs — use these strings everywhere across frontend, backend, and database:
  module_01_phishing
  module_02_passwords
  module_03_malware
  module_04_vishing
  module_05_physical_security
  module_06_data_handling
  module_07_social_engineering
  module_08_financial_scams

Fields:
  id: string — same as document ID
  tenant_id: string
  title: string — display title
  description: string — short description shown on module card
  order: number — 1 through 7, determines unlock sequence
  badge_name: string — name of badge earned on completion
  badge_description: string — what the badge represents
  slides: array of slide objects
  created_at: timestamp
  updated_at: timestamp

Slide object structure:
  slide_number: number — 1, 2, 3, or 4 (max 4 slides per module)
  heading: string — slide title
  body: string — main content text, keep under 100 words per slide
  key_points: array of strings — max 3 bullet points summarizing the slide

Example module document:
{
  "id": "module_01_phishing",
  "tenant_id": "group-sns",
  "title": "Phishing Awareness",
  "description": "Learn to identify and respond to phishing attacks targeting employees",
  "order": 1,
  "badge_name": "Phishing Shield",
  "badge_description": "Awarded for completing phishing awareness training",
  "slides": [
    {
      "slide_number": 1,
      "heading": "What is Phishing?",
      "body": "Phishing is a cyber attack where criminals impersonate trusted organizations via email to steal credentials, financial data, or install malware. It is the most common entry point for corporate data breaches.",
      "key_points": [
        "Phishing emails look legitimate but contain malicious links or attachments",
        "Attackers impersonate banks, IT departments, and executives",
        "One click can compromise an entire organization"
      ]
    }
  ],
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}

---

## COLLECTION: employee_progress

One document per employee. Tracks everything about their training journey. Document ID is the employee's Firebase UID.

Document ID: firebase_uid string

Fields:
  uid: string — employee uid
  tenant_id: string
  modules_completed: array of strings — module IDs the employee has passed
  modules_unlocked: array of strings — module IDs the employee can currently access
  badges_earned: array of badge objects
  certificate_issued: boolean — true only after all 8 modules passed and certificate generated
  certificate_id: string or null — set when certificate is generated
  certificate_issued_at: timestamp or null
  fraud_flagged: boolean — set to true by fraud detector if completion was too fast
  first_module_started_at: timestamp or null — set when employee starts module 01 for first time
  last_module_completed_at: timestamp or null — updated each time a module is completed
  total_completion_minutes: number or null — calculated when certificate is generated
  created_at: timestamp
  updated_at: timestamp

Badge object structure inside badges_earned array:
  module_id: string
  badge_name: string
  earned_at: timestamp

Initial state when employee account is created:
  modules_completed: []
  modules_unlocked: ["module_01_phishing"]
  badges_earned: []
  certificate_issued: false
  certificate_id: null
  certificate_issued_at: null
  fraud_flagged: false
  first_module_started_at: null
  last_module_completed_at: null
  total_completion_minutes: null

Example document after completing 2 modules:
{
  "uid": "abc123",
  "tenant_id": "group-sns",
  "modules_completed": ["module_01_phishing", "module_02_passwords"],
  "modules_unlocked": ["module_01_phishing", "module_02_passwords", "module_03_malware"],
  "badges_earned": [
    {
      "module_id": "module_01_phishing",
      "badge_name": "Phishing Shield",
      "earned_at": "2026-05-26T10:00:00Z"
    },
    {
      "module_id": "module_02_passwords",
      "badge_name": "Password Guardian",
      "earned_at": "2026-05-26T10:45:00Z"
    }
  ],
  "certificate_issued": false,
  "certificate_id": null,
  "certificate_issued_at": null,
  "fraud_flagged": false,
  "first_module_started_at": "2026-05-26T09:30:00Z",
  "last_module_completed_at": "2026-05-26T10:45:00Z",
  "total_completion_minutes": null,
  "created_at": "2026-05-10T09:00:00Z",
  "updated_at": "2026-05-26T10:45:00Z"
}

---

## COLLECTION: quiz_attempts

One document per quiz attempt. An employee can have multiple attempts per module. Never delete old attempts — they are the audit trail.

Document ID: auto-generated Firestore document ID (this becomes the attempt_id)

Fields:
  attempt_id: string — same as document ID
  uid: string — employee who took the quiz
  tenant_id: string
  module_id: string
  attempt_number: number — 1 for first try, 2 for second, etc
  started_at: timestamp
  submitted_at: timestamp or null — null until employee submits
  questions: array of question objects (full questions stored here for audit)
  answers_submitted: array of numbers or null — employee's chosen option indexes, null until submitted
  score: number or null — percentage 0-100, null until submitted
  passed: boolean or null — null until submitted
  weak_area_feedback: string or null — Groq generated feedback, null if all correct or not yet submitted
  status: string — "active" (started not submitted) or "submitted"

Question object structure inside questions array:
  question_number: number — 1 through 5
  question_text: string
  options: array of 4 strings
  correct_answer_index: number — 0, 1, 2, or 3 (NEVER sent to frontend, stored here only)
  explanation: string — shown to employee after submission

Example document after submission:
{
  "attempt_id": "xyz789",
  "uid": "abc123",
  "tenant_id": "group-sns",
  "module_id": "module_01_phishing",
  "attempt_number": 1,
  "started_at": "2026-05-26T10:00:00Z",
  "submitted_at": "2026-05-26T10:08:00Z",
  "questions": [
    {
      "question_number": 1,
      "question_text": "You receive an email from your bank asking you to verify your account by clicking a link. What do you do?",
      "options": [
        "Click the link and enter your credentials",
        "Reply to the email with your account number",
        "Call your bank directly using the number on their official website",
        "Forward the email to your manager"
      ],
      "correct_answer_index": 2,
      "explanation": "Always verify by calling the institution directly. Legitimate banks never ask for credentials via email links."
    }
  ],
  "answers_submitted": [2, 1, 0, 2, 3],
  "score": 80,
  "passed": true,
  "weak_area_feedback": "You missed the question about suspicious attachments. Remember that any unexpected attachment, even from known senders, should be verified before opening.",
  "status": "submitted"
}

---

## COLLECTION: certificates

One document per issued certificate.

Document ID: certificate_id string (generate as "cert_" + uid + "_" + timestamp)

Fields:
  certificate_id: string — same as document ID
  uid: string — employee who earned it
  tenant_id: string
  employee_name: string
  employee_email: string
  tenant_name: string
  issued_at: timestamp
  valid_until: timestamp — issued_at plus tenant settings certificate_validity_days
  modules_completed: number — always 8
  fraud_flagged: boolean — copied from employee_progress at time of generation
  total_completion_minutes: number — how long it took to complete all 8 modules

Example document:
{
  "certificate_id": "cert_abc123_1716818400",
  "uid": "abc123",
  "tenant_id": "group-sns",
  "employee_name": "John Doe",
  "employee_email": "john.doe@groupsns.com",
  "tenant_name": "Group SNS",
  "issued_at": "2026-05-26T12:00:00Z",
  "valid_until": "2027-05-26T12:00:00Z",
  "modules_completed": 7,
  "fraud_flagged": false,
  "total_completion_minutes": 43
}

---

## COLLECTION: activity_log

One document per significant user action. Used for admin analytics and audit trail. Write-only from application perspective — never update or delete these.

Document ID: auto-generated Firestore document ID

Fields:
  tenant_id: string
  uid: string — user who performed the action
  action: string — see action types below
  module_id: string or null — relevant module if action is module-related
  metadata: object or null — any extra context
  timestamp: timestamp

Action types (use these exact strings):
  module_started
  module_completed
  quiz_started
  quiz_passed
  quiz_failed
  badge_earned
  certificate_generated
  fraud_flag_raised
  user_created
  user_deactivated
  login

Example document:
{
  "tenant_id": "group-sns",
  "uid": "abc123",
  "action": "quiz_passed",
  "module_id": "module_01_phishing",
  "metadata": {
    "score": 80,
    "attempt_number": 1
  },
  "timestamp": "2026-05-26T10:08:00Z"
}

---

## FIRESTORE INDEXES NEEDED

These composite indexes must be created in Firestore console for queries to work. Add them before running the app.

Index 1: quiz_attempts collection
  Fields: uid ASC, module_id ASC, started_at DESC
  Purpose: Get all attempts by an employee for a specific module, newest first

Index 2: quiz_attempts collection
  Fields: tenant_id ASC, module_id ASC, passed ASC
  Purpose: Admin analytics — pass rate per module

Index 3: employee_progress collection
  Fields: tenant_id ASC, certificate_issued ASC
  Purpose: Admin — count certified employees

Index 4: activity_log collection
  Fields: tenant_id ASC, timestamp DESC
  Purpose: Admin recent activity feed

Index 5: activity_log collection
  Fields: uid ASC, timestamp DESC
  Purpose: Employee recent activity feed

---

## FIRESTORE SECURITY RULES SUMMARY

These are enforced at the Firebase console level as a second layer of security. The FastAPI backend with Firebase Admin SDK bypasses these rules (Admin SDK has full access). These rules apply only if any direct Firestore calls are ever added from frontend (they should not be, but this is a safety net).

users collection: read/write only if request.auth.uid == document uid or user has admin role
employee_progress collection: read only if request.auth.uid == document uid
quiz_attempts collection: read only if request.auth.uid == document uid
certificates collection: read only if request.auth.uid == document uid
modules collection: read allowed for all authenticated users, write only for admin
activity_log collection: write only, no reads from frontend ever
tenants collection: no access from frontend ever

---

## DATA SEEDING CHECKLIST

Before running the app for the first time, these must exist in Firestore:

1. One document in tenants collection with tenant_id "group-sns"
2. Eight documents in modules collection with the exact module IDs listed above
3. One admin user document in users collection
4. One employee_progress document for the admin user (even admin gets one for consistency)

The backend's main.py should have a seed_data() function that creates these if they don't exist on startup.

---

## MODULES.JS STRUCTURE FOR FRONTEND (for ChatGPT agent)

The frontend has a static fallback in frontend/src/data/modules.js in case Firestore is unavailable. ChatGPT agent must format the 8 module contents from the docx into this exact JS structure:

export const MODULES = [
  {
    id: "module_01_phishing",
    title: "Phishing Awareness",
    description: "short description here",
    order: 1,
    badge_name: "Phishing Shield",
    slides: [
      {
        slide_number: 1,
        heading: "slide heading",
        body: "slide body text under 100 words",
        key_points: ["point 1", "point 2", "point 3"]
      }
    ]
  }
]

Repeat this structure for all 8 modules. Use the exact id strings. Keep body under 100 words per slide. Maximum 4 slides per module. Extract content from the Cyber_Security_Quiz.docx file.