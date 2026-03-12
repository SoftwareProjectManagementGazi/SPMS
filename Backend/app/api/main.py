import sys
import json
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Add the Backend directory to sys.path to allow absolute imports of 'app'
# This handles cases where the script is run directly or from a different working directory
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.v1 import auth, projects, tasks
from app.api.v1.teams import router as teams_router
from app.infrastructure.database.database import AsyncSessionLocal
from app.infrastructure.database.seeder import seed_data
from app.infrastructure.config import settings

# ---------------------------------------------------------------------------
# Structured logging configuration (SAFE-03)
# Configure root logger to emit to stdout at INFO level.
# External tools (Sentry, Datadog) can consume these stdout JSON lines.
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",   # We emit pre-serialised JSON; no extra formatting needed
    stream=sys.stdout,
)
logger = logging.getLogger("spms")


# ---------------------------------------------------------------------------
# RequestLoggingMiddleware — emits one JSON log line per HTTP request
# ---------------------------------------------------------------------------
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)

        # Optionally extract user_id from JWT without blocking the response
        user_id = None
        try:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                from jose import jwt as _jwt
                token = auth_header.split(" ", 1)[1]
                payload = _jwt.decode(
                    token,
                    settings.JWT_SECRET,
                    algorithms=[settings.JWT_ALGORITHM],
                    options={"verify_exp": False},
                )
                user_id = payload.get("sub")
        except Exception:
            pass  # Never fail a request due to logging

        log_record = {
            "event": "http_request",
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        }
        if user_id is not None:
            log_record["user_id"] = user_id

        logger.info(json.dumps(log_record))
        return response


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

# ---------------------------------------------------------------------------
# slowapi rate limiting (SEC-01)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Structured request logging middleware (SAFE-03)
app.add_middleware(RequestLoggingMiddleware)

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
app.include_router(teams_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to SPMS API"}
