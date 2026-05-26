import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# We need to ensure db is initialized before the app starts if we want to seed data
from services.firebase_service import db, auth as auth_client
from routers import auth
from routers.modules import router as modules_router
from routers.quiz import router as quiz_router
from routers.ai import router as ai_router
from routers.rewards import router as rewards_router
from routers.dashboard import router as dashboard_router
from routers.admin import router as admin_router
from routers.manager import router as manager_router
from routers.notifications import router as notifications_router

def seed_data():
    if not db:
        print("Firestore DB is not initialized. Skipping seed data.")
        return
        
    print("Running seed_data()...")
    
    # Create tenant document
    tenant_ref = db.collection("tenants").document("group-sns")
    if not tenant_ref.get().exists:
        tenant_ref.set({
            "tenant_id": "group-sns",
            "name": "Group SNS",
            "active": True,
            "settings": {
                "max_users": 18000,
                "certificate_validity_days": 365,
                "pass_threshold": 70,
                "fraud_detection_minutes": 20
            }
        })
        print("Created tenant document.")
        
    # Delete ALL existing documents in modules collection
    modules_ref = db.collection("modules")
    existing_docs = list(modules_ref.stream())
    for doc in existing_docs:
        doc.reference.delete()
        
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
        
    MODULE_SLIDES = {
    "module_01_phishing": [
        {
            "slide_number": 1,
            "heading": "What is Phishing?",
            "body": "Phishing is a fraudulent attempt to obtain sensitive information such as usernames, passwords, and credit card details by disguising as a trustworthy entity in an electronic communication, typically email. It is the most common form of cyber attack and the number one entry point for corporate data breaches.",
            "key_points": [
                "Phishing emails impersonate trusted organizations like banks, IT departments, or executives",
                "The goal is to steal credentials, financial data, or install malware",
                "One click can compromise an entire organization"
            ]
        },
        {
            "slide_number": 2,
            "heading": "Red Flags of a Phishing Email",
            "body": "Knowing what to look for is your best defense. Phishing emails use psychological tricks to rush you into acting without thinking. Common red flags include urgent or threatening language, generic greetings, suspicious links with mismatched URLs, and spelling or grammar mistakes.",
            "key_points": [
                "Hover over links to reveal the real URL before clicking",
                "Check the sender's full email address, not just the display name",
                "Unexpected attachments from any sender should never be opened"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Your Best Defense: Skepticism",
            "body": "The golden rule is: if an email seems suspicious, it probably is. Do not click any links or download attachments. If you think the email might be legitimate, navigate to the company website directly in a new browser tab. Always report phishing attempts to your IT department immediately.",
            "key_points": [
                "Never use links or contact info provided inside a suspicious email",
                "Go directly to the company website by typing the URL yourself",
                "Report every phishing attempt to IT — your report protects your whole team"
            ]
        }
    ],
    "module_02_passwords": [
        {
            "slide_number": 1,
            "heading": "Why Weak Passwords Are Dangerous",
            "body": "Attackers use automated software that can guess millions of passwords per second. Simple passwords like 'password123' or anything based on your name or birthday can be cracked almost instantly. A strong password is your first and most crucial line of defense.",
            "key_points": [
                "Automated tools can crack simple passwords in seconds",
                "Personal information like birthdays makes passwords easy to guess",
                "Reusing passwords means one breach exposes all your accounts"
            ]
        },
        {
            "slide_number": 2,
            "heading": "The Pillars of a Strong Password",
            "body": "A strong password should be at least 14 characters long. Use a mix of uppercase letters, lowercase letters, numbers, and symbols. Never reuse passwords across different websites — a breach on one site exposes all accounts if you do.",
            "key_points": [
                "Minimum 14 characters — length is the most important factor",
                "Mix uppercase, lowercase, numbers, and symbols like !@#$%",
                "Every account needs its own unique password, no exceptions"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Password Managers and 2FA",
            "body": "A trusted password manager generates, stores, and auto-fills ultra-strong passwords so you only need to remember one master password. Two-Factor Authentication adds a second step so even if an attacker steals your password, they cannot access your account.",
            "key_points": [
                "Use a password manager to generate and store unique passwords for every site",
                "Enable 2FA on every account that supports it",
                "2FA means a stolen password alone is not enough for an attacker to get in"
            ]
        }
    ],
    "module_03_malware": [
        {
            "slide_number": 1,
            "heading": "What is Malware?",
            "body": "Malware is any software designed to harm your system or steal your data. It includes viruses, spyware, and trojans. Ransomware encrypts all your files and holds them hostage until you pay a fee — often with no guarantee of recovery even after payment.",
            "key_points": [
                "Malware includes viruses, spyware, trojans, and ransomware",
                "Ransomware encrypts your files and demands payment to restore them",
                "Paying the ransom does not guarantee you will get your files back"
            ]
        },
        {
            "slide_number": 2,
            "heading": "How Malware Spreads",
            "body": "The number one way malware spreads is through phishing emails. Other vectors include downloading software from untrusted websites and failing to update software. Attackers exploit known security holes in outdated operating systems, browsers, and applications.",
            "key_points": [
                "Phishing emails with malicious attachments are the top infection method",
                "Never download software from unofficial or untrusted websites",
                "Keep your OS, browser, and all applications updated at all times"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Your Defensive Strategy",
            "body": "Use a reputable antivirus program and keep it updated. Be extremely cautious about what you click and download. Regularly back up your important files to an external drive or approved cloud service. Regular backups are your best and only guaranteed defense against ransomware.",
            "key_points": [
                "Install and maintain reputable antivirus software on all devices",
                "Never click links or open attachments from unexpected emails",
                "Back up important files regularly — backups defeat ransomware completely"
            ]
        }
    ],
    "module_04_vishing": [
        {
            "slide_number": 1,
            "heading": "Phishing Beyond Email",
            "body": "Social engineering does not just happen in your inbox. Vishing is voice phishing via phone calls. Smishing is SMS phishing via text messages. These attacks are often more convincing than email because they feel more personal and immediate.",
            "key_points": [
                "Vishing uses phone calls to steal information or money",
                "Smishing uses text messages with malicious links or urgent requests",
                "These attacks feel more personal and are harder to detect than email phishing"
            ]
        },
        {
            "slide_number": 2,
            "heading": "Common Scams and Tactics",
            "body": "Common smishing attacks include fake bank alerts with links to fake login pages. Common vishing attacks include tech support scams claiming your computer is infected. Attackers also impersonate the IRS, delivery services, or your own company's IT helpdesk.",
            "key_points": [
                "Fake bank alerts via SMS lead to credential-stealing fake login pages",
                "Tech support scams try to get remote access to your device or take payment",
                "Attackers impersonate authorities, companies, and even your own IT team"
            ]
        },
        {
            "slide_number": 3,
            "heading": "How to Respond",
            "body": "Never trust, always verify. Do not click links in suspicious texts. Hang up on unsolicited calls. Contact the company directly using a phone number or website you already know is legitimate — never use contact information provided in the suspicious message itself.",
            "key_points": [
                "Hang up on any unsolicited call asking for information or payment",
                "Never use the phone number or link in a suspicious message to verify",
                "Always look up the company's official contact details independently"
            ]
        }
    ],
    "module_05_physical_security": [
        {
            "slide_number": 1,
            "heading": "Security is Not Just Digital",
            "body": "Physical security means protecting your devices and screen from unauthorized access in the real world. A locked computer and an aware employee can prevent breaches that no software can stop. Never underestimate the physical dimension of cybersecurity.",
            "key_points": [
                "Physical access to your screen or device is as dangerous as a digital attack",
                "Always lock your screen when stepping away, even for a moment",
                "Use Win+L on Windows or Cmd+Ctrl+Q on Mac to lock instantly"
            ]
        },
        {
            "slide_number": 2,
            "heading": "In the Office and On the Go",
            "body": "Shoulder surfing means people watching you enter passwords or view sensitive data in public places like cafes, airports, or trains. Never leave laptops, phones, or tablets unattended. When traveling, keep all devices in your personal possession and never place them in checked luggage.",
            "key_points": [
                "Be aware of who can see your screen in public spaces",
                "Never leave devices unattended in public, not even briefly",
                "Keep devices on your person when traveling, never in checked bags"
            ]
        },
        {
            "slide_number": 3,
            "heading": "The Dangers of Public Wi-Fi",
            "body": "Public Wi-Fi is not secure. Attackers on the same network can intercept your data. Avoid logging into sensitive accounts on public Wi-Fi. If you must use it, always connect through a company-approved Virtual Private Network (VPN) to encrypt your traffic.",
            "key_points": [
                "Public Wi-Fi allows attackers on the same network to intercept your data",
                "Never access bank, email, or work accounts on unsecured public Wi-Fi",
                "Always use a company-approved VPN when working remotely or traveling"
            ]
        }
    ],
    "module_06_data_handling": [
        {
            "slide_number": 1,
            "heading": "Not All Data is Equal",
            "body": "Data is classified by sensitivity: Public (press releases), Internal (org charts), and Confidential/Restricted (PII, financial records, health information). You have a legal and professional responsibility to handle each type appropriately.",
            "key_points": [
                "Public data can be shared openly; confidential data requires strict protection",
                "PII, financial records, and health data are the most sensitive categories",
                "Mishandling confidential data can result in legal liability"
            ]
        },
        {
            "slide_number": 2,
            "heading": "Secure Handling and Disposal",
            "body": "Only share sensitive data with those who have a legitimate business need — the need-to-know principle. Store confidential data on approved, encrypted systems only. When disposing of data, shred physical documents and securely delete digital files — the trash bin is not enough.",
            "key_points": [
                "Only share sensitive data with people who have a legitimate need for it",
                "Never store confidential data on personal devices or unapproved cloud services",
                "Shred physical documents and securely delete digital files"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Incident Reporting",
            "body": "If you suspect a security incident — you clicked a phishing link, lost a work device, or accidentally shared sensitive data — report it immediately to IT, InfoSec, or your manager. Fast reporting is critical. The longer an incident goes unreported, the greater the damage.",
            "key_points": [
                "Report any suspected security incident immediately — do not wait",
                "Incidents include clicking phishing links, losing devices, or accidental data sharing",
                "Fast reporting limits damage and is required by compliance regulations"
            ]
        }
    ],
    "module_07_social_engineering": [
        {
            "slide_number": 1,
            "heading": "The Human Element",
            "body": "Social engineering is the art of manipulating people into giving up confidential information or taking harmful actions. Attackers know that humans are often the weakest link in the security chain. No firewall can protect against an employee who has been psychologically manipulated.",
            "key_points": [
                "Social engineering targets people, not technology",
                "Attackers exploit trust, authority, urgency, and fear to manipulate victims",
                "You are the last line of defense that no software can replace"
            ]
        },
        {
            "slide_number": 2,
            "heading": "Modern Scam Tactics",
            "body": "CEO Fraud impersonates an executive to request urgent wire transfers. Deepfakes and AI voice cloning allow scammers to convincingly clone voices. Baiting uses infected USB drives left in public spaces. Pretexting creates fabricated scenarios to extract personal information.",
            "key_points": [
                "CEO Fraud targets finance employees with fake executive wire transfer requests",
                "AI voice cloning can convincingly impersonate executives or family members",
                "Never plug in unknown USB drives found in public — they contain malware"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Defending Against Manipulation",
            "body": "Always verify unusual requests through a secondary channel, especially those involving money or sensitive data. If the CEO emails for an urgent wire transfer, call them directly to confirm. Be skeptical of unsolicited urgency — urgency is a manipulation tactic designed to make you skip verification.",
            "key_points": [
                "Always verify financial or sensitive requests through a second independent channel",
                "Call the person directly using a number you already have, not one they provide",
                "Urgency is a red flag — legitimate requests can withstand a verification call"
            ]
        }
    ],
    "module_08_financial_scams": [
        {
            "slide_number": 1,
            "heading": "Financial Fraud in the Workplace",
            "body": "Invoice fraud involves fake invoices sent to accounts payable requesting payment to attacker-controlled accounts. Payroll diversion scams trick HR into redirecting an employee's salary to a fraudulent account. These attacks combine email spoofing with social engineering to appear completely legitimate.",
            "key_points": [
                "Invoice fraud tricks finance teams into paying fake supplier invoices",
                "Payroll diversion attacks redirect your salary to attacker-controlled accounts",
                "Always verify payment detail changes through a phone call to a known number"
            ]
        },
        {
            "slide_number": 2,
            "heading": "Cryptocurrency Scams",
            "body": "Cryptocurrency scams are among the fastest-growing financial frauds. Common types include fake investment platforms promising guaranteed high returns, pig butchering scams where attackers build trust over weeks before requesting investment, and crypto giveaway scams. Once cryptocurrency is sent, it cannot be recovered.",
            "key_points": [
                "Guaranteed high returns on crypto investments are always a scam",
                "Pig butchering scams build fake relationships over time before asking for money",
                "Cryptocurrency transactions are irreversible — lost funds cannot be recovered"
            ]
        },
        {
            "slide_number": 3,
            "heading": "Protecting Yourself and the Company",
            "body": "Never make financial transactions based solely on email instructions, no matter how official they appear. Always verify by calling a number from your official company directory. Be extremely skeptical of any unsolicited investment opportunity. Report suspicious financial requests to your manager and finance team immediately before acting.",
            "key_points": [
                "Never process payments based only on email — always verify by phone",
                "No legitimate investment guarantees returns — that promise is the scam",
                "Report suspicious financial requests immediately before acting on them"
            ]
        }
    ]
}


    modules_data = [
        {
            "id": "module_01_phishing",
            "tenant_id": "group-sns",
            "title": "Phishing Awareness",
            "description": "Learn to identify and avoid phishing attacks targeting employees via email",
            "order": 1,
            "badge_name": "Phishing Shield",
            "badge_description": "Awarded for completing phishing awareness training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_02_passwords",
            "tenant_id": "group-sns",
            "title": "Passwords & Two-Factor Authentication",
            "description": "Master strong password practices and secure your accounts with 2FA",
            "order": 2,
            "badge_name": "Password Guardian",
            "badge_description": "Awarded for completing password and 2FA training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_03_malware",
            "tenant_id": "group-sns",
            "title": "Malware & Ransomware",
            "description": "Understand malware threats and how to protect your devices and data",
            "order": 3,
            "badge_name": "Malware Defender",
            "badge_description": "Awarded for completing malware and ransomware training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_04_vishing",
            "tenant_id": "group-sns",
            "title": "Vishing & Smishing",
            "description": "Recognize and respond to phone and SMS-based social engineering attacks",
            "order": 4,
            "badge_name": "Voice Defense",
            "badge_description": "Awarded for completing vishing and smishing training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_05_physical_security",
            "tenant_id": "group-sns",
            "title": "Physical & Remote Security",
            "description": "Secure your physical workspace and remote working environment",
            "order": 5,
            "badge_name": "Security Sentinel",
            "badge_description": "Awarded for completing physical and remote security training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_06_data_handling",
            "tenant_id": "group-sns",
            "title": "Data Handling & Compliance",
            "description": "Learn proper data handling practices and regulatory compliance requirements",
            "order": 6,
            "badge_name": "Data Protector",
            "badge_description": "Awarded for completing data handling and compliance training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_07_social_engineering",
            "tenant_id": "group-sns",
            "title": "Social Engineering & Modern Scams",
            "description": "Identify manipulation tactics and modern social engineering attacks",
            "order": 7,
            "badge_name": "Social Shield",
            "badge_description": "Awarded for completing social engineering training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "module_08_financial_scams",
            "tenant_id": "group-sns",
            "title": "Financial & Cryptocurrency Scams",
            "description": "Recognize and avoid financial fraud, investment scams, and cryptocurrency attacks targeting employees",
            "order": 8,
            "badge_name": "Crypto Guardian",
            "badge_description": "Awarded for completing financial and cryptocurrency scam training",
            "slides": [],
            "created_at": now,
            "updated_at": now
        }
    ]
    
    for mod in modules_data:
        mod["slides"] = MODULE_SLIDES.get(mod["id"], [])
        doc_ref = modules_ref.document(mod["id"])
        doc_ref.set(mod)
        print(f"Created module document: {mod['id']}")
    # --- SEED TEST EMPLOYEE ---
    TEST_EMPLOYEE_EMAIL = "employee@groupsns.com"
    TEST_EMPLOYEE_PASSWORD = "TestEmployee@123"
    TEST_EMPLOYEE_NAME = "Test Employee"

    try:
        # Try to get existing user from Firebase Auth
        test_user = auth_client.get_user_by_email(TEST_EMPLOYEE_EMAIL)
        test_uid = test_user.uid
        print(f"Test employee already exists in Firebase Auth: {test_uid}")
    except Exception:
        # Create new Firebase Auth user
        test_user = auth_client.create_user(
            email=TEST_EMPLOYEE_EMAIL,
            password=TEST_EMPLOYEE_PASSWORD,
            display_name=TEST_EMPLOYEE_NAME
        )
        test_uid = test_user.uid
        print(f"Created test employee in Firebase Auth: {test_uid}")

    # Create or overwrite users document
    db.collection("users").document(test_uid).set({
        "uid": test_uid,
        "tenant_id": "group-sns",
        "email": TEST_EMPLOYEE_EMAIL,
        "name": TEST_EMPLOYEE_NAME,
        "role": "employee",
        "active": True,
        "manager_uid": None,
        "team_uids": [],
        "created_at": now,
        "created_by_uid": "system",
        "last_login_at": None
    })

    # Create employee_progress if it does not exist
    progress_ref = db.collection("employee_progress").document(test_uid)
    if not progress_ref.get().exists:
        progress_ref.set({
            "uid": test_uid,
            "tenant_id": "group-sns",
            "modules_completed": [],
            "modules_unlocked": ["module_01_phishing"],
            "badges_earned": [],
            "certificate_issued": False,
            "certificate_id": None,
            "certificate_issued_at": None,
            "fraud_flagged": False,
            "first_module_started_at": None,
            "last_module_completed_at": None,
            "total_completion_minutes": None,
            "created_at": now,
            "updated_at": now
        })
        print(f"Created employee_progress for test employee: {test_uid}")
    else:
        print(f"employee_progress already exists for test employee: {test_uid}")

    print(f"Test employee login: {TEST_EMPLOYEE_EMAIL} / {TEST_EMPLOYEE_PASSWORD}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_data()
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

frontend_url_env = os.environ.get("FRONTEND_URL", "http://localhost:5173")
allow_origins = [url.strip() for url in frontend_url_env.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for standard envelope
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    # If detail is already a dict, we extract error and message, else we wrap it
    error_code = "HTTP_ERROR"
    message = str(exc.detail)
    if isinstance(exc.detail, dict):
        error_code = exc.detail.get("error", str(exc.status_code))
        message = exc.detail.get("message", "An error occurred")
        
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": error_code, "message": message}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "VALIDATION_ERROR", "message": str(exc.errors())}
    )
    
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "INTERNAL_SERVER_ERROR", "message": str(exc)}
    )

# Register routers
app.include_router(auth.router)
app.include_router(modules_router)
app.include_router(quiz_router)
app.include_router(ai_router)
app.include_router(rewards_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(manager_router)
app.include_router(notifications_router)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"success": True, "data": {"status": "CyberShield LMS Backend Running"}}
