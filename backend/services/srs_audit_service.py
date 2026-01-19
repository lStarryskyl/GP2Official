"""SRS Audit service."""

import uuid
from typing import List, Dict, Any
from datetime import datetime

from models.srs_audit import SRSAuditReport, AuditFinding
from services.llm_client import LLMClient


class SRSAuditService:
    """Service for auditing Software Requirements Specifications."""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def audit_requirements(
        self,
        project_id: str,
        requirements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform comprehensive SRS audit."""
        
        findings = []
        
        # Check completeness
        findings.extend(self._check_completeness(requirements))
        
        # Check consistency
        findings.extend(await self._check_consistency(requirements))
        
        # Check clarity
        findings.extend(self._check_clarity(requirements))
        
        # Check testability
        findings.extend(self._check_testability(requirements))
        
        # Calculate scores
        scores = self._calculate_scores(findings, len(requirements))
        
        # Generate recommendations
        recommendations = self._generate_recommendations(findings)
        
        return {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "audit_date": datetime.utcnow(),
            "overall_score": scores['overall'],
            "completeness_score": scores['completeness'],
            "consistency_score": scores['consistency'],
            "clarity_score": scores['clarity'],
            "testability_score": scores['testability'],
            "findings": findings,
            "recommendations": recommendations,
            "status": "completed",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    def _check_completeness(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check if all necessary requirements are present."""
        findings = []
        
        # Check for functional requirements
        functional = [r for r in requirements if r.get('type') == 'functional']
        if len(functional) < 5:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "completeness",
                "severity": "high",
                "requirement_id": None,
                "title": "Insufficient Functional Requirements",
                "description": f"Only {len(functional)} functional requirements found. Typical projects need 10-50.",
                "recommendation": "Add more detailed functional requirements covering all user interactions.",
                "status": "open"
            })
        
        # Check for non-functional requirements
        non_functional = [r for r in requirements if r.get('type') == 'non_functional']
        if len(non_functional) == 0:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "completeness",
                "severity": "critical",
                "requirement_id": None,
                "title": "Missing Non-Functional Requirements",
                "description": "No non-functional requirements (performance, security, scalability) defined.",
                "recommendation": "Add NFRs for performance, security, scalability, and usability.",
                "status": "open"
            })
        
        # Check for security requirements
        security = [r for r in requirements if 'security' in r.get('title', '').lower() or 'security' in r.get('description', '').lower()]
        if len(security) == 0:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "completeness",
                "severity": "high",
                "requirement_id": None,
                "title": "No Security Requirements",
                "description": "No explicit security requirements found.",
                "recommendation": "Add security requirements for authentication, authorization, and data protection.",
                "status": "open"
            })
        
        return findings
    
    async def _check_consistency(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for contradictions and inconsistencies."""
        findings = []
        
        # Use AI to detect contradictions
        if len(requirements) > 1:
            req_titles = [r.get('title', '') for r in requirements[:20]]  # Limit to avoid token limits
            
            prompt = f"""
Analyze these requirements for contradictions or inconsistencies:

{chr(10).join([f"{i+1}. {title}" for i, title in enumerate(req_titles)])}

Identify any conflicting requirements. Respond with JSON array of conflicts, each with:
- requirement1_index
- requirement2_index
- description
- severity (low/medium/high)

If no conflicts, return empty array.
"""
            
            try:
                response = await self.llm_client.generate(prompt)
                import json
                conflicts = json.loads(response)
                
                for conflict in conflicts:
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "category": "consistency",
                        "severity": conflict.get('severity', 'medium'),
                        "requirement_id": None,
                        "title": "Conflicting Requirements Detected",
                        "description": conflict.get('description', 'Requirements may conflict'),
                        "recommendation": "Review and resolve the contradiction.",
                        "status": "open"
                    })
            except:
                pass  # Skip if AI fails
        
        return findings
    
    def _check_clarity(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check if requirements are clear and unambiguous."""
        findings = []
        
        ambiguous_words = ['maybe', 'possibly', 'might', 'could', 'should', 'probably', 'perhaps']
        
        for req in requirements:
            description = req.get('description', '').lower()
            title = req.get('title', '').lower()
            
            # Check for ambiguous words
            found_ambiguous = [word for word in ambiguous_words if word in description or word in title]
            if found_ambiguous:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "category": "clarity",
                    "severity": "medium",
                    "requirement_id": req.get('id'),
                    "title": f"Ambiguous Language in '{req.get('title', 'Requirement')}'",
                    "description": f"Contains ambiguous words: {', '.join(found_ambiguous)}",
                    "recommendation": "Use definitive language: 'must', 'will', 'shall'.",
                    "status": "open"
                })
            
            # Check for vague descriptions
            if len(description) < 20:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "category": "clarity",
                    "severity": "low",
                    "requirement_id": req.get('id'),
                    "title": f"Vague Description in '{req.get('title', 'Requirement')}'",
                    "description": "Description is too brief and may lack detail.",
                    "recommendation": "Expand description with specific details and examples.",
                    "status": "open"
                })
        
        return findings
    
    def _check_testability(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check if requirements are testable."""
        findings = []
        
        for req in requirements:
            # Check for acceptance criteria
            acceptance_criteria = req.get('acceptance_criteria', [])
            if not acceptance_criteria or len(acceptance_criteria) == 0:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "category": "testability",
                    "severity": "high",
                    "requirement_id": req.get('id'),
                    "title": f"No Acceptance Criteria for '{req.get('title', 'Requirement')}'",
                    "description": "Requirement lacks testable acceptance criteria.",
                    "recommendation": "Add specific, measurable acceptance criteria.",
                    "status": "open"
                })
        
        return findings
    
    def _calculate_scores(self, findings: List[Dict[str, Any]], total_requirements: int) -> Dict[str, float]:
        """Calculate audit scores."""
        
        # Count findings by category and severity
        category_counts = {
            'completeness': 0,
            'consistency': 0,
            'clarity': 0,
            'testability': 0
        }
        
        severity_weights = {
            'critical': 10,
            'high': 5,
            'medium': 2,
            'low': 1
        }
        
        for finding in findings:
            category = finding.get('category', 'other')
            severity = finding.get('severity', 'low')
            if category in category_counts:
                category_counts[category] += severity_weights.get(severity, 1)
        
        # Calculate scores (100 - penalty)
        max_penalty = max(total_requirements * 2, 20)  # Scale with requirements
        
        scores = {}
        for category, penalty in category_counts.items():
            score = max(0, 100 - (penalty / max_penalty * 100))
            scores[category] = round(score, 2)
        
        # Overall score is average
        scores['overall'] = round(sum(scores.values()) / len(scores), 2)
        
        return scores
    
    def _generate_recommendations(self, findings: List[Dict[str, Any]]) -> List[str]:
        """Generate high-level recommendations."""
        recommendations = []
        
        # Group by severity
        critical = [f for f in findings if f.get('severity') == 'critical']
        high = [f for f in findings if f.get('severity') == 'high']
        
        if critical:
            recommendations.append(f"Address {len(critical)} critical issues immediately before proceeding.")
        
        if high:
            recommendations.append(f"Resolve {len(high)} high-priority issues to improve requirements quality.")
        
        # Category-specific recommendations
        categories = {}
        for finding in findings:
            cat = finding.get('category', 'other')
            categories[cat] = categories.get(cat, 0) + 1
        
        if categories.get('completeness', 0) > 0:
            recommendations.append("Add missing requirement types to ensure comprehensive coverage.")
        
        if categories.get('testability', 0) > 0:
            recommendations.append("Define clear acceptance criteria for all requirements.")
        
        if categories.get('clarity', 0) > 0:
            recommendations.append("Use precise, unambiguous language throughout requirements.")
        
        return recommendations
