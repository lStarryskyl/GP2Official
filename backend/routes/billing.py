"""Billing and subscription routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from models.subscription import ProcessPaymentRequest
from services.subscription_service import SubscriptionService
from routes.auth import get_current_user

router = APIRouter()
subscription_service = SubscriptionService()


@router.get("/billing/plans")
async def get_plans():
    """Get available subscription plans."""
    return {"plans": subscription_service.PLANS}


@router.post("/billing/subscribe")
async def create_subscription(
    plan: str,
    billing_cycle: str = "monthly",
    current_user = Depends(get_current_user)
):
    """Create a new subscription."""
    try:
        subscription = await subscription_service.create_subscription(
            user_id=current_user.id,
            plan=plan,
            organization=current_user.organization,
            billing_cycle=billing_cycle
        )
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing/payment-methods")
async def add_payment_method(
    card_number: str,
    exp_month: int,
    exp_year: int,
    brand: str = "visa",
    current_user = Depends(get_current_user)
):
    """Add a payment method."""
    try:
        payment_method = await subscription_service.add_payment_method(
            user_id=current_user.id,
            card_number=card_number,
            exp_month=exp_month,
            exp_year=exp_year,
            brand=brand
        )
        return payment_method
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing/process-payment")
async def process_payment(
    request: ProcessPaymentRequest,
    current_user = Depends(get_current_user)
):
    """Process a payment."""
    try:
        result = await subscription_service.process_payment(
            amount=request.amount,
            payment_method_id=request.payment_method_id,
            currency=request.currency
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/billing/subscription/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    cancel_at_period_end: bool = True,
    current_user = Depends(get_current_user)
):
    """Cancel a subscription."""
    try:
        result = await subscription_service.cancel_subscription(
            subscription_id=subscription_id,
            cancel_at_period_end=cancel_at_period_end
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
