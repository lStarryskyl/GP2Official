"""Version history and diffing service."""

import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from models.version import Version, VersionCreate, DiffResult


class VersionService:
    """Service for version history and diffing."""
    
    async def create_version(
        self,
        version_data: VersionCreate,
        changed_by_name: str,
        previous_version_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new version record."""
        
        version = {
            "id": str(uuid.uuid4()),
            "project_id": version_data.project_id,
            "entity_type": version_data.entity_type,
            "entity_id": version_data.entity_id,
            "version_number": version_data.version_number,
            "changes": version_data.changes,
            "change_summary": version_data.change_summary,
            "changed_by": version_data.changed_by,
            "changed_by_name": changed_by_name,
            "previous_version_id": previous_version_id,
            "created_at": datetime.utcnow()
        }
        
        return version
    
    async def get_version_history(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get version history for an entity."""
        
        # This would query the database
        # For now, return empty list as placeholder
        return []
    
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
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "restored_to_version": version_number,
            "restored_by": restored_by,
            "restored_at": datetime.utcnow()
        }
