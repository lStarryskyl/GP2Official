"""Fake payment gateway service for demonstration."""

import uuid
import random
from typing import Dict, Any
from datetime import datetime

from models.payment import (
    PaymentIntentCreate, PaymentIntent, PaymentConfirm, PaymentResult, SubscriptionCheckout
)


class PaymentGatewayService:
    """Fake payment gateway for testing and demonstration."""
    
    # Test card numbers
    TEST_CARDS = {
        "4242424242424242": {"result": "success", "message": "Payment successful"},
        "4000000000000002": {"result": "declined", "message": "Card declined"},
        "4000000000009995": {"result": "insufficient_funds", "message": "Insufficient funds"},
        "4000000000000069": {"result": "expired", "message": "Card expired"},
    }
    
    async def create_payment_intent(
        self,
        intent_data: PaymentIntentCreate
    ) -> PaymentIntent:
        """Create a payment intent."""
        
        intent_id = f"pi_test_{uuid.uuid4().hex[:24]}"
        client_secret = f"pi_test_{uuid.uuid4().hex[:24]}_secret_{uuid.uuid4().hex[:16]}"
        
        return PaymentIntent(
            id=intent_id,
            amount=intent_data.amount,
            currency=intent_data.currency,
            status="requires_payment_method",
            client_secret=client_secret,
            description=intent_data.description,
            metadata=intent_data.metadata,
            created_at=datetime.utcnow()
        )
    
    async def confirm_payment(
        self,
        confirm_data: PaymentConfirm
    ) -> PaymentResult:
        """Confirm and process payment."""
        
        # Simulate processing delay
        import asyncio
        await asyncio.sleep(0.5)
        
        # Check test card
        card_number = confirm_data.card_number or "4242424242424242"
        card_result = self.TEST_CARDS.get(card_number, self.TEST_CARDS["4242424242424242"])
        
        success = card_result["result"] == "success"
        status = "succeeded" if success else "failed"
        
        # Simulate random failures for realism (10% chance)
        if success and random.random() < 0.1:
            success = False
            status = "failed"
            card_result = {"result": "processing_error", "message": "Payment processing error"}
        
        transaction_id = f"txn_test_{uuid.uuid4().hex[:24]}" if success else None
        
        return PaymentResult(
            success=success,
            payment_intent_id=confirm_data.payment_intent_id,
            status=status,
            amount=0.0,  # Would be fetched from payment intent
            currency="USD",
            message=card_result["message"],
            transaction_id=transaction_id,
            created_at=datetime.utcnow()
        )
    
    async def process_subscription_checkout(
        self,
        checkout_data: SubscriptionCheckout,
        user_id: str
    ) -> Dict[str, Any]:
        """Process subscription checkout."""
        
        # Simulate processing
        import asyncio
        await asyncio.sleep(0.5)
        
        card_number = checkout_data.card_number or "4242424242424242"
        card_result = self.TEST_CARDS.get(card_number, self.TEST_CARDS["4242424242424242"])
        
        success = card_result["result"] == "success"
        
        if success:
            subscription_id = f"sub_test_{uuid.uuid4().hex[:24]}"
            return {
                "success": True,
                "subscription_id": subscription_id,
                "plan_id": checkout_data.plan_id,
                "billing_cycle": checkout_data.billing_cycle,
                "status": "active",
                "message": "Subscription activated successfully",
                "next_billing_date": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
        else:
            return {
                "success": False,
                "subscription_id": None,
                "plan_id": checkout_data.plan_id,
                "status": "failed",
                "message": card_result["message"],
                "created_at": datetime.utcnow()
            }
    
    async def cancel_subscription(
        self,
        subscription_id: str
    ) -> Dict[str, Any]:
        """Cancel a subscription."""
        
        return {
            "success": True,
            "subscription_id": subscription_id,
            "status": "canceled",
            "message": "Subscription canceled successfully",
            "canceled_at": datetime.utcnow()
        }
    
    async def get_payment_methods(
        self,
        user_id: str
    ) -> list:
        """Get saved payment methods for user."""
        
        # Return test payment methods
        return [
            {
                "id": f"pm_test_{uuid.uuid4().hex[:24]}",
                "type": "card",
                "brand": "visa",
                "last4": "4242",
                "exp_month": 12,
                "exp_year": 2030,
                "is_default": True
            }
        ]
    
    def get_test_cards(self) -> Dict[str, Dict[str, str]]:
        """Get list of test cards for documentation."""
        return self.TEST_CARDS
