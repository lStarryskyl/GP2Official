"""Version history and diffing service."""

from typing import List, Dict, Any, Optional
from datetime import datetime

from models.version import VersionCreate, DiffResult
from repositories.version_repository import VersionRepository
from repositories.artifact_repository import ArtifactRepository


class VersionService:
    """Service for version history and diffing."""

    def __init__(self):
        self.repo = VersionRepository()
        self.artifact_repo = ArtifactRepository()

    async def create_version(
        self,
        version_data: VersionCreate,
        changed_by_name: str,
        previous_version_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new version record."""
        
        version_number = version_data.version_number
        if version_number <= 0:
            version_number = await self.repo.get_latest_version_number(
                version_data.entity_type,
                version_data.entity_id,
            ) + 1

        if previous_version_id is None and version_number > 1:
            previous = await self.repo.get_by_entity_version(
                version_data.entity_type,
                version_data.entity_id,
                version_number - 1,
            )
            previous_version_id = previous.id if previous else None

        version = {
            "project_id": version_data.project_id,
            "entity_type": version_data.entity_type,
            "entity_id": version_data.entity_id,
            "version_number": version_number,
            "changes": version_data.changes,
            "change_summary": version_data.change_summary,
            "changed_by": version_data.changed_by,
            "changed_by_name": changed_by_name,
            "previous_version_id": previous_version_id,
            "created_at": datetime.utcnow()
        }

        saved = await self.repo.create_version(version)
        return saved.model_dump(by_alias=False)
    
    async def get_version_history(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get version history for an entity."""
        
        versions = await self.repo.list_by_entity(entity_type, entity_id, limit)
        return [version.model_dump(by_alias=False) for version in versions]
    
    async def compare_versions(
        self,
        entity_type: str,
        entity_id: str,
        from_version: int,
        to_version: int,
        version_history: List[Dict[str, Any]]
    ) -> DiffResult:
        """Compare two versions and generate diff."""
        
        from_data = None
        to_data = None
        
        for version in version_history:
            if version['version_number'] == from_version:
                from_data = version['changes']
            if version['version_number'] == to_version:
                to_data = version['changes']
        
        if not from_data or not to_data:
            return DiffResult(
                entity_type=entity_type,
                entity_id=entity_id,
                from_version=from_version,
                to_version=to_version,
                added={},
                removed={},
                modified={},
                summary="Version data not found"
            )
        
        # Calculate diff
        added = {}
        removed = {}
        modified = {}
        
        # Find added keys
        for key in to_data:
            if key not in from_data:
                added[key] = to_data[key]
        
        # Find removed keys
        for key in from_data:
            if key not in to_data:
                removed[key] = from_data[key]
        
        # Find modified keys
        for key in from_data:
            if key in to_data and from_data[key] != to_data[key]:
                modified[key] = {
                    "from": from_data[key],
                    "to": to_data[key]
                }
        
        # Generate summary
        summary_parts = []
        if added:
            summary_parts.append(f"{len(added)} field(s) added")
        if removed:
            summary_parts.append(f"{len(removed)} field(s) removed")
        if modified:
            summary_parts.append(f"{len(modified)} field(s) modified")
        
        summary = ", ".join(summary_parts) if summary_parts else "No changes"
        
        return DiffResult(
            entity_type=entity_type,
            entity_id=entity_id,
            from_version=from_version,
            to_version=to_version,
            added=added,
            removed=removed,
            modified=modified,
            summary=summary
        )
    
    async def restore_version(
        self,
        entity_type: str,
        entity_id: str,
        version_number: int,
        restored_by: str
    ) -> Dict[str, Any]:
        """Restore an entity to a previous version."""
        version = await self.repo.get_by_entity_version(entity_type, entity_id, version_number)
        if not version:
            return {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "restored_to_version": version_number,
                "restored_by": restored_by,
                "restored_at": datetime.utcnow(),
                "restored": False,
            }

        if entity_type == "artifact":
            restored = await self.artifact_repo.update_artifact(
                version.project_id,
                entity_id,
                {"content_json": version.changes},
            )
            if restored:
                await self.create_version(
                    VersionCreate(
                        project_id=version.project_id,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        version_number=restored.version,
                        changes=version.changes,
                        change_summary=f"Restored artifact to version {version_number}",
                        changed_by=restored_by,
                    ),
                    changed_by_name=restored_by,
                )
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "restored_to_version": version_number,
            "restored_by": restored_by,
            "restored_at": datetime.utcnow(),
            "restored": True,
        }
