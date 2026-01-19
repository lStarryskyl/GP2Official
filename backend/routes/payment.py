"""Payment gateway routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.payment import (
    PaymentIntentCreate, PaymentIntent, PaymentConfirm, PaymentResult, SubscriptionCheckout
)
from services.payment_gateway_service import PaymentGatewayService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
payment_service = PaymentGatewayService()


@router.post("/payment/create-intent", response_model=PaymentIntent)
async def create_payment_intent(
    intent_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent (fake gateway)."""
    intent = await payment_service.create_payment_intent(intent_data)
    return intent


@router.post("/payment/confirm", response_model=PaymentResult)
async def confirm_payment(
    confirm_data: PaymentConfirm,
    current_user: User = Depends(get_current_user)
):
    """Confirm and process payment (fake gateway)."""
    result = await payment_service.confirm_payment(confirm_data)
    return result


@router.post("/payment/subscription/checkout")
async def subscription_checkout(
    checkout_data: SubscriptionCheckout,
    current_user: User = Depends(get_current_user)
):
    """Process subscription checkout (fake gateway)."""
    result = await payment_service.process_subscription_checkout(checkout_data, current_user.id)
    return result


@router.post("/payment/subscription/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a subscription."""
    result = await payment_service.cancel_subscription(subscription_id)
    return result


@router.get("/payment/methods")
async def get_payment_methods(
    current_user: User = Depends(get_current_user)
):
    """Get saved payment methods."""
    methods = await payment_service.get_payment_methods(current_user.id)
    return methods


@router.get("/payment/test-cards")
async def get_test_cards():
    """Get list of test cards for sandbox testing."""
    return {
        "test_cards": payment_service.get_test_cards(),
        "note": "This is a SANDBOX environment. Use these test cards for testing only."
    }
