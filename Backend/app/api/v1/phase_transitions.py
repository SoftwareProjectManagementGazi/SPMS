"""API-01 POST /projects/{id}/phase-transitions router."""
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_project_transition_authority
from app.api.deps.project import get_project_repo
from app.api.deps.task import get_task_repo
from app.api.deps.audit import get_audit_repo
from app.infrastructure.database.database import get_db_session
from app.application.use_cases.execute_phase_transition import ExecutePhaseTransitionUseCase
from app.application.dtos.phase_transition_dtos import (
    PhaseTransitionRequestDTO, PhaseTransitionResponseDTO,
)
from app.application.services import idempotency_cache
from app.domain.exceptions import (
    PhaseGateLockedError, CriteriaUnmetError, PhaseGateNotApplicableError,
    ArchivedNodeReferenceError, ProjectNotFoundError, InvalidTransitionError,
)

router = APIRouter()


@router.post(
    "/projects/{project_id}/phase-transitions",
    response_model=PhaseTransitionResponseDTO,
)
async def create_phase_transition(
    project_id: int,
    dto: PhaseTransitionRequestDTO,
    request: Request,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    user=Depends(require_project_transition_authority),
    project_repo=Depends(get_project_repo),
    task_repo=Depends(get_task_repo),
    audit_repo=Depends(get_audit_repo),
    session: AsyncSession = Depends(get_db_session),
) -> PhaseTransitionResponseDTO:
    """D-01..D-12 Phase Gate transition endpoint.

    - D-50: rate limit 10s per (user_id, project_id)
    - D-50: idempotency via `Idempotency-Key` header (10 min cache)
    - D-01: 409 on concurrent transition for same project
    - D-03: 422 on unmet criteria without allow_override
    - D-07: 400 on continuous workflow mode
    """
    # D-50: custom rate limit
    wait_s = idempotency_cache.check_rate_limit(user.id, project_id)
    if wait_s is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit; retry after {wait_s:.1f}s",
            headers={"Retry-After": str(int(wait_s) + 1)},
        )

    # D-50: idempotency cache lookup
    if idempotency_key:
        cached = idempotency_cache.lookup(user.id, project_id, idempotency_key)
        if cached is not None:
            return cached

    # Record request (for rate limit window)
    idempotency_cache.record_request(user.id, project_id)

    use_case = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    try:
        response = await use_case.execute(project_id, dto, user.id)
    except PhaseGateLockedError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "PHASE_GATE_LOCKED", "message": str(e)},
        )
    except CriteriaUnmetError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "CRITERIA_UNMET", "unmet": e.unmet_criteria},
        )
    except PhaseGateNotApplicableError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "PHASE_GATE_NOT_APPLICABLE", "message": str(e)},
        )
    except ArchivedNodeReferenceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id, "reason": e.reason},
        )
    except InvalidTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_TRANSITION",
                "source_phase_id": e.source_phase_id,
                "target_phase_id": e.target_phase_id,
                "reason": e.reason,
            },
        )
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    # Cache successful response
    if idempotency_key:
        idempotency_cache.store(user.id, project_id, idempotency_key, response)

    return response
