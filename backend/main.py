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
from services.firebase_service import db
from routers import auth
from routers.modules import router as modules_router

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
        doc_ref = modules_ref.document(mod["id"])
        doc_ref.set(mod)
        print(f"Created module document: {mod['id']}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_data()
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
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

@app.get("/")
def root():
    return {"success": True, "data": {"status": "CyberShield LMS Backend Running"}}
