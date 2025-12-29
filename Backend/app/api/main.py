import sys
from pathlib import Path

# Add the Backend directory to sys.path to allow absolute imports of 'app'
# This handles cases where the script is run directly or from a different working directory
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI
from app.api.v1 import auth, projects, tasks

app = FastAPI(title="SPMS API", version="1.0.0")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SPMS API"}
