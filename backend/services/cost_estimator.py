"""Cost estimation service."""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class CostEstimator:
    """Project cost estimation service."""
    
    # Standard hourly rates (USD)
    RATES = {
        'junior': 50,
        'mid': 80,
        'senior': 120,
        'architect': 150,
        'pm': 100
    }
    
    def estimate_project_cost(self, tasks: List[Dict], schedule: Dict) -> Dict[str, Any]:
        """Estimate project costs based on tasks and schedule."""
        
        logger.info("Calculating project cost estimation")
        
        total_hours = schedule.get('total_hours', 0)
        
        # Calculate team composition based on phases
        phases = schedule.get('phases', {})
        
        # Estimate hours by role
        hours_by_role = self._estimate_hours_by_role(phases, total_hours)
        
        # Calculate costs
        cost_by_role = {}
        total_cost = 0
        for role, hours in hours_by_role.items():
            cost = hours * self.RATES[role]
            cost_by_role[role] = {
                'hours': round(hours, 1),
                'rate': self.RATES[role],
                'cost': round(cost, 2)
            }
            total_cost += cost
        
        # Add overhead (15%)
        overhead = total_cost * 0.15
        
        # Add contingency (20% for uncertainty)
        contingency = total_cost * 0.20
        
        # Calculate ranges
        optimistic = total_cost * 0.85  # -15%
        pessimistic = total_cost * 1.30  # +30%
        
        return {
            'base_cost': round(total_cost, 2),
            'overhead': round(overhead, 2),
            'contingency': round(contingency, 2),
            'total_estimated_cost': round(total_cost + overhead + contingency, 2),
            'cost_range': {
                'optimistic': round(optimistic, 2),
                'most_likely': round(total_cost, 2),
                'pessimistic': round(pessimistic, 2)
            },
            'breakdown_by_role': cost_by_role,
            'currency': 'USD'
        }
    
    def _estimate_hours_by_role(self, phases: Dict, total_hours: float) -> Dict[str, float]:
        """Estimate hours distribution across roles."""
        
        design_hours = phases.get('design', {}).get('total_hours', 0)
        dev_hours = phases.get('development', {}).get('total_hours', 0)
        test_hours = phases.get('testing', {}).get('total_hours', 0)
        deploy_hours = phases.get('deployment', {}).get('total_hours', 0)
        
        return {
            'architect': design_hours * 0.3 + dev_hours * 0.1,
            'senior': design_hours * 0.4 + dev_hours * 0.3 + test_hours * 0.2,
            'mid': dev_hours * 0.4 + test_hours * 0.4 + deploy_hours * 0.3,
            'junior': dev_hours * 0.2 + test_hours * 0.4 + deploy_hours * 0.4,
            'pm': total_hours * 0.15  # PM overhead across all phases
        }
