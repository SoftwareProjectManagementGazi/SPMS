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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database
    async with AsyncSessionLocal() as session:
        await seed_data(session)
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(title="SPMS API", version="1.0.0", lifespan=lifespan)

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
