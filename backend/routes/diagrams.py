"""SDLC and UML diagram routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from models.artifact import ArtifactResponse
from models.diagram import DiagramChatRequest, DiagramChatResponse, DiagramStateResponse, DiagramUpdateRequest
from models.user import User
from repositories.artifact_repository import ArtifactRepository
from routes.auth import get_current_user
from services.diagram_service import DiagramService
from services.project_service import ProjectService
from services.uml_editor import UmlEditorService
from services.plantuml_service import build_plantuml_image_url

router = APIRouter()
diagram_service = DiagramService()
project_service = ProjectService()
artifact_repo = ArtifactRepository()
uml_editor = UmlEditorService()


@router.get("/projects/{project_id}/sdlc-diagrams/", response_model=List[DiagramStateResponse])
async def list_sdlc_diagrams(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return the diagram workspace for each SDLC stage."""
    await project_service.get_project(project_id, current_user)
    diagrams = await diagram_service.list_or_seed(project_id)
    return [diagram_service.to_response(diagram) for diagram in diagrams]


@router.get("/projects/{project_id}/sdlc-diagrams/{stage}/", response_model=DiagramStateResponse)
async def get_sdlc_diagram(
    project_id: str,
    stage: str,
    current_user: User = Depends(get_current_user),
):
    """Fetch the workspace for a single stage."""
    await project_service.get_project(project_id, current_user)
    diagram = await diagram_service.ensure_stage(project_id, stage)
    return diagram_service.to_response(diagram)


@router.put("/projects/{project_id}/sdlc-diagrams/{stage}/", response_model=DiagramStateResponse)
async def save_sdlc_diagram(
    project_id: str,
    stage: str,
    payload: DiagramUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """Persist edits to a workspace."""
    await project_service.get_project(project_id, current_user)
    diagram = await diagram_service.save_stage(project_id, stage, payload)
    return diagram_service.to_response(diagram)


@router.post("/projects/{project_id}/sdlc-diagrams/{stage}/chat/", response_model=DiagramChatResponse)
async def chat_with_diagram_assistant(
    project_id: str,
    stage: str,
    payload: DiagramChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Send an instruction to the diagram assistant."""
    await project_service.get_project(project_id, current_user)
    return await diagram_service.chat(project_id, stage, payload.message)


# === UML PlantUML diagram editing (use case / class / sequence / ER) ===

def _canonical_diagram_type(diagram_type: str) -> str:
    normalized = diagram_type.strip().lower().replace("-", "_")
    mapping = {
        "usecase": "use_case",
        "use_case": "use_case",
        "class": "class_diagram",
        "class_diagram": "class_diagram",
        "sequence": "sequence",
        "sequence_diagram": "sequence",
        "entity": "entity_relationship",
        "entity_relationship": "entity_relationship",
        "er": "entity_relationship",
        "erd": "entity_relationship",
        "state": "state_machine",
        "state_machine": "state_machine",
        "statemachine": "state_machine",
        "activity": "activity",
        "activity_diagram": "activity",
    }
    if normalized in mapping:
        return mapping[normalized]
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported UML diagram type: '{diagram_type}'. Supported: use_case, class, sequence, erd, state, activity",
    )


def _uml_artifact_type(diagram_type: str) -> str:
    canonical = _canonical_diagram_type(diagram_type)
    mapping = {
        "use_case": "uml_use_case",
        "class_diagram": "uml_class_diagram",
        "sequence": "uml_sequence",
        "entity_relationship": "uml_entity_relationship",
        "state_machine": "uml_state_machine",
        "activity": "uml_activity",
    }
    return mapping[canonical]


def _diagram_title(diagram_type: str) -> str:
    canonical = _canonical_diagram_type(diagram_type)
    labels = {
        "use_case": "Use Case Diagram",
        "class_diagram": "Class Diagram",
        "sequence": "Sequence Diagram",
        "entity_relationship": "ER Diagram",
        "state_machine": "State Machine Diagram",
        "activity": "Activity Diagram",
    }
    return labels.get(canonical, canonical.replace("_", " ").title())


def _default_plantuml(diagram_type: str) -> str:
    canonical = _canonical_diagram_type(diagram_type)
    base_header = [
        "@startuml",
        "skinparam backgroundColor #FFFFFF",
        "skinparam shadowing false",
    ]
    if canonical == "use_case":
        body = [
            "actor User",
            "actor Admin",
            'rectangle "System" {',
            '  usecase UC1 as "Draft requirement"',
            '  usecase UC2 as "Review output"',
            "}",
            "User --> UC1",
            "Admin --> UC2",
        ]
    elif canonical == "class_diagram":
        body = [
            "skinparam classAttributeIconSize 0",
            "class Project {",
            "  +name",
            "  +description",
            "}",
            "class Requirement {",
            "  +title",
            "  +type",
            "}",
            "Project \"1\" o-- \"*\" Requirement : includes",
        ]
    elif canonical == "sequence":
        body = [
            "actor User",
            "participant Frontend",
            "participant Backend",
            "User -> Frontend : Request",
            "Frontend -> Backend : Process",
            "Backend --> User : Response",
        ]
    elif canonical == "entity_relationship":
        body = [
            "entity Project {",
            "  *project_id : UUID",
            "  name : string",
        ]
        body.append("}")
        body.extend(
            [
                "entity Requirement {",
                "  *requirement_id : UUID",
                "  title : string",
                "}",
                "Project ||--o{ Requirement : contains",
            ]
        )
    elif canonical == "state_machine":
        body = [
            "[*] --> Draft : create",
            "Draft --> Active : submit",
            "Active --> UnderReview : complete",
            "UnderReview --> Done : approve",
            "UnderReview --> Active : request changes",
            "Done --> [*]",
        ]
    elif canonical == "activity":
        body = [
            "start",
            ":User initiates action;",
            "if (Valid?) then (yes)",
            "  :Process request;",
            "  :Persist to database;",
            "  :Notify stakeholders;",
            "else (no)",
            "  :Return error;",
            "  stop",
            "endif",
            ":Done;",
            "stop",
        ]
    else:
        body = ["rectangle Placeholder"]
    return "\n".join(base_header + body + ["@enduml"])


async def _ensure_uml_artifact(project_id: str, artifact_type: str, diagram_type: str):
    """Return existing UML artifact or seed a default template."""
    artifacts = await artifact_repo.list_by_project(project_id, artifact_type)
    if artifacts:
        return artifacts[0]
    plantuml = _default_plantuml(diagram_type)
    metadata = {"plantuml_svg_url": build_plantuml_image_url(plantuml)}
    created = await artifact_repo.upsert_artifact(
        project_id,
        artifact_type,
        _diagram_title(diagram_type),
        {"plantuml": plantuml},
        metadata=metadata,
    )
    return created


def _artifact_to_response(artifact):
    return ArtifactResponse(
        id=artifact.id,
        artifact_id=artifact.id,
        project_id=artifact.project_id,
        type=artifact.type,
        title=artifact.title,
        content_json=artifact.content_json,
        version=artifact.version,
        is_approved=artifact.is_approved,
        metadata=artifact.metadata,
        created_at=artifact.created_at,
        updated_at=artifact.updated_at,
    )


@router.get("/projects/{project_id}/uml/{diagram_type}/", response_model=ArtifactResponse)
async def get_uml_diagram(
    project_id: str,
    diagram_type: str,
    current_user: Optional[User] = Depends(get_current_user),
):
    """Fetch the generated UML diagram artifact (PlantUML)."""
    await project_service.get_project(project_id, current_user)
    canonical = _canonical_diagram_type(diagram_type)
    artifact_type = _uml_artifact_type(canonical)
    artifact = await _ensure_uml_artifact(project_id, artifact_type, canonical)
    return _artifact_to_response(artifact)


from pydantic import BaseModel


class PlantUMLUpdateRequest(BaseModel):
    """Payload for direct PlantUML edits."""

    plantuml: str
    title: Optional[str] = None


@router.put("/projects/{project_id}/uml/{diagram_type}/", response_model=ArtifactResponse)
async def save_uml_diagram(
    project_id: str,
    diagram_type: str,
    payload: PlantUMLUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """Persist manual edits to a UML diagram."""
    await project_service.get_project(project_id, current_user)
    canonical = _canonical_diagram_type(diagram_type)
    artifact_type = _uml_artifact_type(canonical)
    existing = await _ensure_uml_artifact(project_id, artifact_type, canonical)
    title = payload.title or existing.title or _diagram_title(canonical)
    metadata = (existing.metadata or {}).copy()
    metadata["plantuml_svg_url"] = build_plantuml_image_url(payload.plantuml)
    updated = await artifact_repo.upsert_artifact(
        project_id,
        artifact_type,
        title,
        {"plantuml": payload.plantuml},
        metadata=metadata,
    )
    return _artifact_to_response(updated)


class DiagramSyncPayload(BaseModel):
    mode: str


@router.post("/projects/{project_id}/diagrams/sync/", response_model=DiagramStateResponse)
async def sync_diagram_canvas(
    project_id: str,
    payload: DiagramSyncPayload,
    current_user: User = Depends(get_current_user),
):
    """Seed a diagram canvas (requirements, srs, costs, or freeform) from project data."""
    project = await project_service.get_project(project_id, current_user)
    try:
        diagram = await diagram_service.seed_mode(project_id, project.organization, payload.mode)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return diagram_service.to_response(diagram)


@router.post("/projects/{project_id}/uml/{diagram_type}/chat/", response_model=ArtifactResponse)
async def chat_edit_uml_diagram(
    project_id: str,
    diagram_type: str,
    payload: DiagramChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Use the AI assistant to modify an existing UML diagram."""
    await project_service.get_project(project_id, current_user)
    canonical = _canonical_diagram_type(diagram_type)
    artifact_type = _uml_artifact_type(canonical)
    artifact = await _ensure_uml_artifact(project_id, artifact_type, canonical)
    plantuml = artifact.content_json.get("plantuml") if artifact.content_json else None
    if not plantuml:
        plantuml = _default_plantuml(canonical)

    new_plantuml = await uml_editor.apply_instruction(plantuml, payload.message)
    metadata = (artifact.metadata or {}).copy()
    metadata["plantuml_svg_url"] = build_plantuml_image_url(new_plantuml)
    updated = await artifact_repo.upsert_artifact(
        project_id,
        artifact_type,
        artifact.title,
        {"plantuml": new_plantuml},
        metadata=metadata,
    )
    return _artifact_to_response(updated)
