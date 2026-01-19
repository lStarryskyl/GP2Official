"""Fake payment gateway and subscription service."""

import uuid
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from models.subscription import (
    Subscription, SubscriptionCreate,
    PaymentMethod, PaymentMethodCreate,
    Invoice, InvoiceCreate,
    ProcessPaymentRequest, ProcessPaymentResponse
)


class SubscriptionService:
    """Fake payment gateway for demo purposes."""
    
    PLANS = {
        'free': {
            'price': 0,
            'features': ['5 projects', 'Basic AI', 'Community support'],
            'max_projects': 5,
            'max_users': 3
        },
        'pro': {
            'price': 29,
            'features': ['Unlimited projects', 'Advanced AI', 'Export PDF/DOCX', 'Priority support'],
            'max_projects': -1,  # Unlimited
            'max_users': 10
        },
        'enterprise': {
            'price': 99,
            'features': ['Everything in Pro', 'Custom AI models', 'Dedicated support', 'SLA guarantee'],
            'max_projects': -1,
            'max_users': -1
        }
    }
    
    async def create_subscription(
        self,
        user_id: str,
        plan: str,
        organization: Optional[str] = None,
        billing_cycle: str = "monthly"
    ) -> Dict[str, Any]:
        """Create a fake subscription."""
        
        if plan not in self.PLANS:
            raise ValueError(f"Invalid plan: {plan}")
        
        plan_details = self.PLANS[plan]
        
        # Calculate period end
        if billing_cycle == "monthly":
            period_end = datetime.utcnow() + timedelta(days=30)
        else:  # yearly
            period_end = datetime.utcnow() + timedelta(days=365)
        
        subscription = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "organization": organization,
            "plan": plan,
            "status": "active",
            "billing_cycle": billing_cycle,
            "price": plan_details['price'],
            "currency": "USD",
            "trial_ends_at": None,
            "current_period_start": datetime.utcnow(),
            "current_period_end": period_end,
            "cancel_at_period_end": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        return subscription
    
    async def process_payment(
        self,
        amount: float,
        payment_method_id: str,
        currency: str = "USD"
    ) -> ProcessPaymentResponse:
        """Simulate payment processing."""
        
        # Simulate processing delay
        await asyncio.sleep(1)
        
        # Always succeed in demo mode
        return ProcessPaymentResponse(
            success=True,
            transaction_id=f"fake_txn_{uuid.uuid4().hex[:12]}",
            amount=amount,
            status="succeeded",
            message="Payment processed successfully (demo mode)"
        )
    
    async def add_payment_method(
        self,
        user_id: str,
        card_number: str,
        exp_month: int,
        exp_year: int,
        brand: str = "visa"
    ) -> Dict[str, Any]:
        """Add fake payment method."""
        
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "card",
            "last4": card_number[-4:] if len(card_number) >= 4 else "4242",
            "brand": brand,
            "exp_month": exp_month,
            "exp_year": exp_year,
            "is_default": True,
            "created_at": datetime.utcnow()
        }
    
    async def create_invoice(
        self,
        subscription_id: str,
        user_id: str,
        amount: float,
        due_date: datetime
    ) -> Dict[str, Any]:
        """Create fake invoice."""
        
        return {
            "id": str(uuid.uuid4()),
            "subscription_id": subscription_id,
            "user_id": user_id,
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "due_date": due_date,
            "paid_at": datetime.utcnow(),
            "invoice_pdf_url": None,
            "created_at": datetime.utcnow()
        }
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        cancel_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """Cancel subscription."""
        
        return {
            "subscription_id": subscription_id,
            "status": "active" if cancel_at_period_end else "cancelled",
            "cancel_at_period_end": cancel_at_period_end,
            "message": "Subscription will be cancelled at period end" if cancel_at_period_end else "Subscription cancelled immediately"
        }
    
    def get_plan_details(self, plan: str) -> Dict[str, Any]:
        """Get plan details."""
        return self.PLANS.get(plan, self.PLANS['free'])
