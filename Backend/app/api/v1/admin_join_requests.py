"""Phase 14 Plan 14-01 — Admin join-request router (D-A1).

4 endpoints:
- GET    /admin/join-requests?status=pending&limit=&offset=  (admin list)
- POST   /admin/join-requests/{id}/approve                   (admin approve)
- POST   /admin/join-requests/{id}/reject                    (admin reject)
- POST   /projects/{project_id}/join-requests                (PM-side create —
            uses require_project_transition_authority)

Every admin endpoint uses Depends(require_admin); the PM-side create endpoint
uses require_project_transition_authority (Phase 9 D-15) so admins AND project
managers AND team leaders may all open join requests for the project.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import (
    require_admin,
    require_project_transition_authority,
)
from app.api.deps.project import get_project_repo
from app.api.deps.project_join_request import get_project_join_request_repo
from app.api.deps.team import get_team_repo
from app.api.deps.user import get_user_repo
from app.application.dtos.project_join_request_dtos import (
    CreateJoinRequestDTO,
    JoinRequestListDTO,
    JoinRequestProjectDTO,
    JoinRequestResponseDTO,
    JoinRequestUserDTO,
)
from app.application.use_cases.approve_join_request import ApproveJoinRequestUseCase
from app.application.use_cases.create_join_request import CreateJoinRequestUseCase
from app.application.use_cases.list_pending_join_requests import (
    ListPendingJoinRequestsUseCase,
)
from app.application.use_cases.reject_join_request import RejectJoinRequestUseCase
from app.domain.entities.project_join_request import ProjectJoinRequest
from app.domain.entities.user import User
from app.domain.exceptions import (
    JoinRequestInvalidStateError,
    JoinRequestNotFoundError,
)

router = APIRouter()


async def _enrich_response(
    entity: ProjectJoinRequest,
    project_repo,
    user_repo,
) -> JoinRequestResponseDTO:
    """Hydrate the raw entity with nested project/user submodels for the
    JoinRequestResponseDTO. None values are preserved for FK-SET-NULL paths
    (deleted users / deleted projects)."""
    project = await project_repo.get_by_id(entity.project_id)
    requested_by = (
        await user_repo.get_by_id(entity.requested_by_user_id)
        if entity.requested_by_user_id is not None
        else None
    )
    target_user = (
        await user_repo.get_by_id(entity.target_user_id)
        if entity.target_user_id is not None
        else None
    )

    return JoinRequestResponseDTO(
        id=entity.id or 0,
        project=(
            JoinRequestProjectDTO(id=project.id, key=project.key, name=project.name)
            if project
            else None
        ),
        requested_by=(
            JoinRequestUserDTO(
                id=requested_by.id,
                email=requested_by.email,
                full_name=requested_by.full_name,
                avatar_url=requested_by.avatar,
            )
            if requested_by
            else None
        ),
        target_user=(
            JoinRequestUserDTO(
                id=target_user.id,
                email=target_user.email,
                full_name=target_user.full_name,
                avatar_url=target_user.avatar,
            )
            if target_user
            else None
        ),
        status=entity.status,
        note=entity.note,
        created_at=entity.created_at,
        reviewed_at=entity.reviewed_at,
    )


@router.get("/admin/join-requests", response_model=JoinRequestListDTO)
async def list_pending_join_requests(
    status: str = Query(default="pending"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(require_admin),
    repo=Depends(get_project_join_request_repo),
    project_repo=Depends(get_project_repo),
    user_repo=Depends(get_user_repo),
):
    """D-A1 admin list of pending join requests. Currently only "pending"
    status is exercised by the Overview tab; future plans may extend with
    status filter parameter (already accepted via Query)."""
    if status != "pending":
        # v2.0 Plan 14-01 ships only the "pending" pathway; other statuses
        # are no-op-safe (return empty) for forward compat without surprising
        # the caller.
        return JoinRequestListDTO(items=[], total=0)
    uc = ListPendingJoinRequestsUseCase(repo)
    items, total = await uc.execute(limit=limit, offset=offset)
    enriched = [
        await _enrich_response(it, project_repo, user_repo) for it in items
    ]
    return JoinRequestListDTO(items=enriched, total=total)


@router.post(
    "/admin/join-requests/{request_id}/approve",
    response_model=JoinRequestResponseDTO,
)
async def approve_join_request(
    request_id: int,
    admin: User = Depends(require_admin),
    repo=Depends(get_project_join_request_repo),
    audit_repo=Depends(get_audit_repo),
    team_repo=Depends(get_team_repo),
    project_repo=Depends(get_project_repo),
    user_repo=Depends(get_user_repo),
):
    """D-A1 admin approve. Adds target user to team + emits audit row.
    Atomic: rolls back status on team_repo failure (non-IntegrityError)."""
    uc = ApproveJoinRequestUseCase(repo, audit_repo, team_repo, project_repo)
    try:
        updated = await uc.execute(request_id, admin.id)
    except JoinRequestNotFoundError:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND,
                            detail=f"Join request {request_id} not found")
    except JoinRequestInvalidStateError as e:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail={"error_code": "JOIN_REQUEST_INVALID_STATE",
                    "message": str(e), "current_status": e.current_status},
        )
    return await _enrich_response(updated, project_repo, user_repo)


@router.post(
    "/admin/join-requests/{request_id}/reject",
    response_model=JoinRequestResponseDTO,
)
async def reject_join_request(
    request_id: int,
    admin: User = Depends(require_admin),
    repo=Depends(get_project_join_request_repo),
    audit_repo=Depends(get_audit_repo),
    project_repo=Depends(get_project_repo),
    user_repo=Depends(get_user_repo),
):
    """D-A1 admin reject. State flip + audit emission only."""
    uc = RejectJoinRequestUseCase(repo, audit_repo, project_repo)
    try:
        updated = await uc.execute(request_id, admin.id)
    except JoinRequestNotFoundError:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND,
                            detail=f"Join request {request_id} not found")
    except JoinRequestInvalidStateError as e:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail={"error_code": "JOIN_REQUEST_INVALID_STATE",
                    "message": str(e), "current_status": e.current_status},
        )
    return await _enrich_response(updated, project_repo, user_repo)


@router.post(
    "/projects/{project_id}/join-requests",
    response_model=JoinRequestResponseDTO,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_project_join_request(
    project_id: int,
    dto: CreateJoinRequestDTO,
    current_user: User = Depends(require_project_transition_authority),
    repo=Depends(get_project_join_request_repo),
    audit_repo=Depends(get_audit_repo),
    project_repo=Depends(get_project_repo),
    user_repo=Depends(get_user_repo),
):
    """PM-side create endpoint (D-A1). Uses require_project_transition_authority
    so admins / project manager / team leader on the project may all open a
    join request for a target user."""
    if dto.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="DTO project_id must match path project_id",
        )
    uc = CreateJoinRequestUseCase(repo, audit_repo, project_repo)
    created = await uc.execute(
        project_id=project_id,
        requested_by_user_id=current_user.id,
        target_user_id=dto.target_user_id,
        note=dto.note,
    )
    return await _enrich_response(created, project_repo, user_repo)
