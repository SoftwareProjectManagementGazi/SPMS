import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add the Backend directory to sys.path to allow absolute imports of 'app'
# This handles cases where the script is run directly or from a different working directory
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, projects, tasks
from app.infrastructure.database.database import AsyncSessionLocal
from app.infrastructure.database.seeder import seed_data
from app.infrastructure.config import settings


def _validate_startup_secrets(s) -> None:
    """Raise RuntimeError if insecure default secrets are detected."""
    if s.JWT_SECRET == "supersecretkey":
        raise RuntimeError(
            "STARTUP FAILED: JWT_SECRET is set to the insecure default value. "
            "Set a secure, unique value in your .env file."
        )
    if s.DB_PASSWORD == "secretpassword":
        raise RuntimeError(
            "STARTUP FAILED: DB_PASSWORD is set to the insecure default value. "
            "Set a secure, unique value in your .env file."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate secrets before anything else
    _validate_startup_secrets(settings)
    # Startup: Seed database
    async with AsyncSessionLocal() as session:
        await seed_data(session)
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(title="SPMS API", version="1.0.0", lifespan=lifespan)

# Configure CORS — origins read from env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SPMS API"}
