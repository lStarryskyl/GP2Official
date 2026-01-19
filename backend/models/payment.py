"""Fake payment gateway models."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PaymentIntentCreate(BaseModel):
    """Create payment intent."""
    amount: float
    currency: str = "USD"
    description: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class PaymentIntent(BaseModel):
    """Payment intent model."""
    id: str
    amount: float
    currency: str
    status: str
    client_secret: str
    description: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PaymentConfirm(BaseModel):
    """Confirm payment."""
    payment_intent_id: str
    payment_method: str = "test_card"
    card_number: Optional[str] = "4242424242424242"
    exp_month: Optional[int] = 12
    exp_year: Optional[int] = 2030
    cvc: Optional[str] = "123"


class PaymentResult(BaseModel):
    """Payment result."""
    success: bool
    payment_intent_id: str
    status: str
    amount: float
    currency: str
    message: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SubscriptionCheckout(BaseModel):
    """Subscription checkout."""
    plan_id: str
    billing_cycle: str = "monthly"
    payment_method: str = "test_card"
    card_number: Optional[str] = "4242424242424242"
    exp_month: Optional[int] = 12
    exp_year: Optional[int] = 2030
    cvc: Optional[str] = "123"
