import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, Zap, Crown, Rocket, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  max_projects: number;
  max_users: number;
}

interface BillingPageProps {
  userId: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ userId }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await api.getBillingPlans();
      setPlans(data as PricingPlan[]);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    setSubscribing(planName);
    try {
      await api.subscribeToPlan(planName);
      alert(`Successfully subscribed to ${planName} plan!`);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Subscription failed. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return Zap;
      case 'pro': return Rocket;
      case 'enterprise': return Crown;
      default: return Zap;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free': return 'from-gray-400 to-gray-600';
      case 'pro': return 'from-orange-500 to-blue-500';
      case 'enterprise': return 'from-blue-600 to-navy-700';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const isFeatured = (planName: string) => planName === 'pro';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">Growth Plan</span>
        </h1>
        <p className="text-xl text-gray-600">Start free, upgrade as you grow 🌰</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const featured = isFeatured(plan.name);
          
          return (
            <div
              key={plan.name}
              className={`relative bg-white rounded-3xl p-8 transition-all ${
                featured
                  ? 'border-4 border-orange-400 shadow-2xl scale-105 z-10'
                  : 'border-2 border-gray-200 hover:shadow-xl hover:scale-102'
              }`}
            >
              {featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlanColor(plan.name)} mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 capitalize mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-600">/month</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${featured ? 'text-orange-500' : 'text-blue-500'}`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.name)}
                disabled={subscribing === plan.name}
                className={`w-full py-3 font-semibold ${
                  featured
                    ? 'bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {subscribing === plan.name ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {plan.name === 'free' ? 'Get Started' : 'Subscribe Now'}
                  </>
                )}
              </Button>

              <div className="mt-4 text-center text-sm text-gray-500">
                {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} projects •{' '}
                {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="mt-16 text-center">
        <p className="text-gray-600 mb-4">Trusted by 500+ teams worldwide</p>
        <div className="flex items-center justify-center gap-8 text-gray-400">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
