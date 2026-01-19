import React, { useState } from 'react';
import { Check, Zap, Building2, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentCheckout } from '@/components/PaymentCheckout';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    projects: number | string;
    users: number | string;
    aiGenerations: number | string;
  };
  popular?: boolean;
  icon: React.ElementType;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals and small teams',
    monthlyPrice: 29,
    annualPrice: 290,
    icon: Zap,
    features: [
      'AI-powered requirements generation',
      'UML diagram creation',
      'Task breakdown & planning',
      'PDF & DOCX export',
      'Email support',
      'Version history (30 days)',
    ],
    limits: {
      projects: 5,
      users: 3,
      aiGenerations: 50,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams and organizations',
    monthlyPrice: 99,
    annualPrice: 990,
    icon: Building2,
    popular: true,
    features: [
      'Everything in Starter',
      'Unlimited projects',
      'Advanced SRS audit',
      'Stakeholder negotiation',
      'Traceability matrix',
      'Template library access',
      'Priority support',
      'Version history (unlimited)',
      'Real-time collaboration',
    ],
    limits: {
      projects: 'Unlimited',
      users: 10,
      aiGenerations: 500,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: 299,
    annualPrice: 2990,
    icon: Rocket,
    features: [
      'Everything in Professional',
      'Unlimited users',
      'Unlimited AI generations',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom training',
      'On-premise deployment option',
      'Advanced security & compliance',
    ],
    limits: {
      projects: 'Unlimited',
      users: 'Unlimited',
      aiGenerations: 'Unlimited',
    },
  },
];

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PricingTier | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSelectPlan = (tier: PricingTier) => {
    setSelectedPlan(tier);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    // Navigate to dashboard or show success message
  };

  if (showCheckout && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-acorn-blue-50 to-acorn-orange-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowCheckout(false)}
            className="mb-6 text-acorn-blue-600 hover:text-acorn-blue-700 font-medium"
          >
            ← Back to pricing
          </button>
          <PaymentCheckout
            planName={selectedPlan.name}
            planPrice={billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice}
            billingCycle={billingCycle}
            onSuccess={handleCheckoutSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-acorn-blue-50 to-acorn-orange-50">
      {/* Header */}
      <div className="bg-gradient-hero text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Choose Your Growth Plan</h1>
          <p className="text-xl text-acorn-blue-100 max-w-2xl mx-auto">
            Transform your project planning with AI-powered tools. Start free, scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full p-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-acorn-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-acorn-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Annual
              <span className="ml-2 px-2 py-1 bg-acorn-orange-500 text-white text-xs rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl shadow-acorn-lg overflow-hidden transform transition-all hover:scale-105 ${
                  tier.popular ? 'ring-4 ring-acorn-orange-500 relative' : ''
                }`}
              >
                {tier.popular && (
                  <div className="bg-acorn-orange-500 text-white text-center py-2 font-semibold text-sm">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-2xl font-bold text-acorn-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-acorn-gray-600 mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-acorn-blue-600">${price}</span>
                      <span className="text-acorn-gray-600">/ {billingCycle}</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-acorn-gray-500 mt-1">
                        ${Math.round(price / 12)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(tier)}
                    className={`w-full mb-6 ${
                      tier.popular
                        ? 'bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white'
                        : 'bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Limits */}
                  <div className="mb-6 p-4 bg-acorn-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-acorn-gray-600">Projects</span>
                      <span className="font-semibold text-acorn-gray-900">{tier.limits.projects}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-acorn-gray-600">Team members</span>
                      <span className="font-semibold text-acorn-gray-900">{tier.limits.users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-acorn-gray-600">AI generations/month</span>
                      <span className="font-semibold text-acorn-gray-900">{tier.limits.aiGenerations}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-acorn-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-acorn-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards. Enterprise customers can arrange for invoice billing.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.',
              },
              {
                q: 'What happens if I exceed my limits?',
                a: 'We\'ll notify you when you\'re approaching limits. You can upgrade anytime or purchase add-ons.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-acorn-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-acorn-gray-900 mb-2">{faq.q}</h3>
                <p className="text-acorn-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
