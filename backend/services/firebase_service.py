import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin SDK using service account path from env
cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")

try:
    firebase_app = firebase_admin.get_app()
except ValueError:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Failed to initialize Firebase Admin SDK. Please check serviceAccountKey.json path: {e}")
        # We don't want to crash import completely if file is missing, but it will fail on db access
        firebase_app = None

# Expose db = firestore.client()
db = firestore.client() if firebase_app else None

# Expose auth = firebase_admin.auth
# auth is already exposed by the import above
