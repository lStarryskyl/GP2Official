"""Subscription and payment models."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SubscriptionBase(BaseModel):
    """Base subscription model."""
    plan: str
    billing_cycle: str = "monthly"
    organization: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    """Subscription creation model."""
    user_id: str


class Subscription(SubscriptionBase):
    """Subscription model."""
    id: str = Field(..., alias="_id")
    user_id: str
    status: str = "active"
    price: float
    currency: str = "USD"
    trial_ends_at: Optional[datetime] = None
    current_period_start: datetime = Field(default_factory=datetime.utcnow)
    current_period_end: datetime
    cancel_at_period_end: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class PaymentMethodBase(BaseModel):
    """Base payment method model."""
    type: str = "card"
    last4: str
    brand: str
    exp_month: int
    exp_year: int
    is_default: bool = False


class PaymentMethodCreate(PaymentMethodBase):
    """Payment method creation model."""
    user_id: str
    card_number: Optional[str] = None


class PaymentMethod(PaymentMethodBase):
    """Payment method model."""
    id: str = Field(..., alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class InvoiceBase(BaseModel):
    """Base invoice model."""
    amount: float
    currency: str = "USD"
    status: str = "draft"


class InvoiceCreate(InvoiceBase):
    """Invoice creation model."""
    subscription_id: str
    user_id: str
    due_date: datetime


class Invoice(InvoiceBase):
    """Invoice model."""
    id: str = Field(..., alias="_id")
    subscription_id: str
    user_id: str
    due_date: datetime
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ProcessPaymentRequest(BaseModel):
    """Payment processing request."""
    amount: float
    payment_method_id: str
    currency: str = "USD"


class ProcessPaymentResponse(BaseModel):
    """Payment processing response."""
    success: bool
    transaction_id: str
    amount: float
    status: str
    message: Optional[str] = None
