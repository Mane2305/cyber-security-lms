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
        
    # Create 7 module placeholders
    modules_ref = db.collection("modules")
    
    # We create 7 basic placeholders. You can expand on this.
    modules_to_create = [
        {"id": "module_01_phishing", "title": "Phishing Basics", "order": 1},
        {"id": "module_02_passwords", "title": "Password Security", "order": 2},
        {"id": "module_03_social_engineering", "title": "Social Engineering", "order": 3},
        {"id": "module_04_data_protection", "title": "Data Protection", "order": 4},
        {"id": "module_05_device_security", "title": "Device Security", "order": 5},
        {"id": "module_06_safe_browsing", "title": "Safe Browsing", "order": 6},
        {"id": "module_07_incident_reporting", "title": "Incident Reporting", "order": 7},
    ]
    
    for mod in modules_to_create:
        doc_ref = modules_ref.document(mod["id"])
        if not doc_ref.get().exists:
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

@app.get("/")
def root():
    return {"success": True, "data": {"status": "CyberShield LMS Backend Running"}}
