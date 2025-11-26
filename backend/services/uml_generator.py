"""UML diagram generation service."""

from __future__ import annotations

from typing import Dict, List
import re


def _sanitize_identifier(text: str, prefix: str) -> str:
    sanitized = re.sub(r"[^0-9a-zA-Z]+", "_", text).strip("_")
    if not sanitized:
        sanitized = prefix
    if sanitized[0].isdigit():
        sanitized = f"{prefix}_{sanitized}"
    return sanitized[:32]


class UMLGenerator:
    """Deterministic UML diagram generator based on project requirements."""

    def __init__(self):
        pass

    async def generate_use_case_diagram(self, requirements: List[Dict], project_name: str) -> str:
        """Generate a basic use-case diagram from functional requirements."""
        func_requirements = [
            req for req in requirements if str(req.get("type", "")).lower() == "functional"
        ] or requirements
        func_requirements = func_requirements[:12]

        lines = [
            "@startuml",
            "left to right direction",
            f'title {project_name} – Use Case Overview',
            "actor User",
            "actor Admin",
            f'rectangle "{project_name}" {{',
        ]

        for idx, req in enumerate(func_requirements, start=1):
            identifier = _sanitize_identifier(req.get("title", f"UseCase{idx}"), f"UC{idx}")
            lines.append(f'  usecase {identifier} as "{req.get("title", f"Use Case {idx}")}"')
            actor = "Admin" if "admin" in req.get("title", "").lower() else "User"
            lines.append(f"  {actor} --> {identifier}")

        lines.append("}")
        lines.append("@enduml")
        return "\n".join(lines)

    async def generate_class_diagram(self, requirements: List[Dict], project_name: str) -> str:
        """Create a lightweight class diagram that highlights main modules."""
        key_requirements = requirements[:8]

        lines = [
            "@startuml",
            f'title {project_name} – High Level Classes',
            "skinparam classAttributeIconSize 0",
        ]

        previous_identifier = None
        for idx, req in enumerate(key_requirements, start=1):
            identifier = _sanitize_identifier(req.get("title", f"Module{idx}"), f"C{idx}")
            description = req.get("description", "No description provided").replace('"', '\\"')
            req_type = str(req.get("type", "feature")).replace("_", " ").title()
            lines.append(f'class {identifier} {{')
            lines.append(f'  +Title: "{req.get("title", "Feature")}"')
            lines.append(f'  +Type: "{req_type}"')
            lines.append(f'  --')
            lines.append(f'  "{description[:90]}..."')
            lines.append("}")
            if previous_identifier:
                lines.append(f"{previous_identifier} --> {identifier} : depends")
            previous_identifier = identifier

        if not key_requirements:
            lines.append(f'class {project_name.replace(" ", "_")} {{\n  +Note: "No requirements yet"\n}}')

        lines.append("@enduml")
        return "\n".join(lines)

    async def generate_sequence_diagram(self, requirements: List[Dict], project_name: str) -> str:
        """Approximate a sequence diagram for the first requirement."""
        focus_requirement = requirements[0] if requirements else {"title": "User Flow", "description": ""}
        steps = [s.strip() for s in focus_requirement.get("description", "").split(".") if s.strip()]
        lines = [
            "@startuml",
            f'title {project_name} – "{focus_requirement.get("title", "Flow")}" Sequence',
            "actor User",
            "participant Frontend",
            "participant Backend",
            "participant Database",
        ]

        if not steps:
            steps = [
                "User initiates an action",
                "Frontend validates and forwards the request",
                "Backend processes data and persists results",
                "Database acknowledges operation",
            ]

        for idx, step in enumerate(steps, start=1):
            if idx == 1:
                lines.append(f'User -> Frontend : {step}')
            elif idx == 2:
                lines.append(f'Frontend -> Backend : {step}')
            elif idx == 3:
                lines.append(f'Backend -> Database : {step}')
                lines.append("Database --> Backend : Result")
            else:
                lines.append(f'Backend --> User : {step}')

        lines.append("@enduml")
        return "\n".join(lines)
