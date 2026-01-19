import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface PaymentCheckoutProps {
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'annual';
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  planName,
  planPrice,
  billingCycle,
  onSuccess,
  onCancel
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const testCards = [
    { number: '4242424242424242', result: 'Success' },
    { number: '4000000000000002', result: 'Declined' },
    { number: '4000000000009995', result: 'Insufficient Funds' },
  ];

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const cleanCard = cardNumber.replace(/\s/g, '');
      
      if (cleanCard === '4242424242424242') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (cleanCard === '4000000000000002') {
        setError('Card declined. Please try another card.');
        setProcessing(false);
      } else if (cleanCard === '4000000000009995') {
        setError('Insufficient funds. Please try another card.');
        setProcessing(false);
      } else {
        setError('Invalid card number. Use a test card.');
        setProcessing(false);
      }
    }, 1500);
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-acorn-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-acorn-gray-600">Your subscription has been activated.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-acorn-lg p-8 max-w-2xl mx-auto">
      {/* Sandbox Notice */}
      <div className="bg-acorn-orange-50 border border-acorn-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-acorn-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold text-acorn-orange-900">Sandbox Environment</p>
            <p className="text-sm text-acorn-orange-700 mt-1">
              This is a test payment gateway. Use test card numbers below.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Summary */}
      <div className="bg-acorn-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-acorn-gray-900 mb-2">{planName}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-acorn-blue-600">${planPrice}</span>
          <span className="text-acorn-gray-600">/ {billingCycle}</span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-acorn-gray-700 mb-2">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full p-3 pl-10 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
              required
            />
            <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-acorn-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-acorn-gray-700 mb-2">
              Exp Month
            </label>
            <input
              type="text"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              placeholder="12"
              maxLength={2}
              className="w-full p-3 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-acorn-gray-700 mb-2">
              Exp Year
            </label>
            <input
              type="text"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              placeholder="2030"
              maxLength={4}
              className="w-full p-3 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-acorn-gray-700 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="123"
              maxLength={4}
              className="w-full p-3 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Test Cards */}
        <div className="bg-acorn-blue-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-acorn-blue-900 mb-2">Test Cards:</p>
          <div className="space-y-1">
            {testCards.map((card) => (
              <div key={card.number} className="flex justify-between text-xs">
                <code className="text-acorn-blue-700">{card.number}</code>
                <span className="text-acorn-gray-600">{card.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-acorn-gray-600">
          <Lock className="w-4 h-4" />
          <span>Secure payment processing</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={processing}
            className="flex-1 bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white"
          >
            {processing ? 'Processing...' : `Pay $${planPrice}`}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
