from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.routes.paper_routes import router as paper_router
from backend.app.modules.matching.routes import router as matching_router
from backend.app.modules.matching.routes import router as matching_router
app.include_router(matching_router)
import backend.app.models  # Ensure all SQLAlchemy models are registered

# Create database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Notice during table initialization: {e}")

app = FastAPI(
    title="TraceSet API - Examination Paper Leak Detection System",
    description="Unified Backend API for TraceSet. Member 1: Paper Generation & Digital Fingerprinting.",
    version="1.0.0"
)

# CORS Middleware for React frontend (Member 4)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Member 1 Routes
app.include_router(paper_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check and module status."""
    return {
        "status": "healthy",
        "system": "TraceSet Examination Security Platform",
        "modules": {
            "member_1_paper_generation": "ONLINE",
            "member_2_ocr_extraction": "READY_FOR_INTEGRATION",
            "member_3_ai_matching": "ONLINE",
            "member_4_frontend": "READY_FOR_INTEGRATION"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

