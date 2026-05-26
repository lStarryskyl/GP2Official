<<<<<<< HEAD
import React from 'react';
import { AlertTriangle, CreditCard, Settings } from 'lucide-react';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Crown, Layers, Lock, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1

interface BillingPageProps {
  userId: string;
}

<<<<<<< HEAD
const billingEnabled = import.meta.env.VITE_ENABLE_BILLING === 'true';

export const BillingPage: React.FC<BillingPageProps> = () => {
  if (!billingEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'var(--brand-850)',
            border: '1px solid rgba(26,111,212,0.2)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <AlertTriangle className="w-7 h-7 text-orange-400" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Billing Unavailable</h1>
              <p className="text-[var(--text-muted)] max-w-2xl">
                Billing and checkout are disabled in this environment because no real payment provider is configured.
                The previous UI was only a demo flow, so it has been intentionally turned off.
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(26,46,69,0.45)', border: '1px solid rgba(26,111,212,0.14)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-[var(--blue-400)]" />
                    <span className="font-semibold text-[var(--text-primary)]">Why it is hidden</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Subscriptions were backed by mock endpoints. Keeping them visible would be misleading.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(26,46,69,0.45)', border: '1px solid rgba(26,111,212,0.14)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-[var(--blue-400)]" />
                    <span className="font-semibold text-[var(--text-primary)]">To enable later</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Add a real payment integration and set `VITE_ENABLE_BILLING=true`.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="rounded-3xl p-8 text-[var(--text-primary)]" style={{ background: 'var(--brand-850)', border: '1px solid rgba(26,111,212,0.2)' }}>
        Real billing is enabled for this environment, but the production checkout flow has not been implemented in this repository yet.
=======
interface PlanUsage {
  tier: string;
  used: number;
  limit: number | null;
  unlimited: boolean;
  can_create: boolean;
}

type TierKey = 'free' | 'pro' | 'enterprise';

interface PlanInfo {
  key: TierKey;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  projectLimit: string;
  projectLimitNumeric: number | null;
  features: string[];
  accent: string;
  accentSoft: string;
  icon: React.ElementType;
}

const PLANS: PlanInfo[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'Get started and explore the full SDLC flow.',
    projectLimit: '3 active projects',
    projectLimitNumeric: 3,
    features: [
      '3 active projects',
      'Basic AI assistance',
      'Community support',
    ],
    accent: '#1A6FD4',
    accentSoft: 'rgba(26,111,212,0.15)',
    icon: Layers,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$29',
    cadence: 'per month',
    tagline: 'For active teams shipping multiple projects.',
    projectLimit: 'Unlimited active projects',
    projectLimitNumeric: null,
    features: [
      'Unlimited projects',
      'Advanced AI',
      'Export to PDF / DOCX',
      'Priority support',
    ],
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.18)',
    icon: Crown,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    cadence: 'per month',
    tagline: 'Custom AI, dedicated support, and SLAs.',
    projectLimit: 'Unlimited active projects',
    projectLimitNumeric: null,
    features: [
      'Everything in Pro',
      'Custom AI models',
      'Dedicated support',
      'SLA guarantee',
    ],
    accent: '#A855F7',
    accentSoft: 'rgba(168,85,247,0.18)',
    icon: Sparkles,
  },
];

const billingEnabled = import.meta.env.VITE_ENABLE_BILLING === 'true';

export const BillingPage: React.FC<BillingPageProps> = () => {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getProjectsUsage();
        if (!cancelled) setUsage(data);
      } catch (e) {
        console.error('Failed to load plan usage:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTier: TierKey = useMemo(() => {
    const fromUsage = (usage?.tier || '').toLowerCase();
    const fromUser = (user?.subscription_tier || '').toLowerCase();
    const tier = fromUsage || fromUser || 'free';
    return (['free', 'pro', 'enterprise'].includes(tier) ? tier : 'free') as TierKey;
  }, [usage, user]);

  const currentPlan = PLANS.find((p) => p.key === currentTier) ?? PLANS[0];

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? null;
  const unlimited = usage?.unlimited ?? (currentTier !== 'free');
  const usagePct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atLimit = limit !== null && used >= (limit ?? 0);
  const nearLimit = limit !== null && !atLimit && used >= Math.max(1, (limit ?? 0) - 1);
  const usageBarColor = atLimit ? '#ef4444' : nearLimit ? '#F97316' : currentPlan.accent;

  const freeLimit = PLANS[0].projectLimitNumeric ?? 3;
  const wouldExceedFreeOnDowngrade = currentTier !== 'free' && used > freeLimit;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-[var(--blue-400)] to-[var(--blue-600)] rounded-full" />
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Billing &amp; Plan</h1>
        </div>
        <p className="text-[var(--text-muted)] text-lg ml-5">
          Review your current plan, project usage, and what each tier includes.
        </p>
      </div>

      {/* Current Plan + Usage */}
      <div
        className="rounded-3xl p-6 md:p-8"
        style={{
          background: 'var(--brand-850)',
          border: `1px solid ${atLimit ? 'rgba(239,68,68,0.4)' : 'rgba(26,111,212,0.2)'}`,
        }}
        data-testid="current-plan-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: currentPlan.accentSoft }}
            >
              <currentPlan.icon className="w-7 h-7" style={{ color: currentPlan.accent }} />
            </div>
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Current Plan
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl font-bold text-[var(--text-primary)]"
                  data-testid="current-tier-name"
                >
                  {currentPlan.name}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  · {currentPlan.projectLimit}
                </span>
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1" data-testid="current-usage-text">
                {loading
                  ? 'Loading usage…'
                  : unlimited
                    ? `You're using ${used} active project${used === 1 ? '' : 's'}.`
                    : `You're using ${used} of ${limit} project${limit === 1 ? '' : 's'}.`}
              </div>
            </div>
          </div>

          {!unlimited && limit !== null && !loading && (
            <div className="flex items-center gap-3 w-full md:w-72">
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(74,96,112,0.25)' }}
              >
                <div
                  style={{
                    width: `${usagePct}%`,
                    height: '100%',
                    background: usageBarColor,
                    transition: 'width 400ms ease',
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums">
                {usagePct}%
              </span>
            </div>
          )}
        </div>

        {atLimit && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2 text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
            }}
          >
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You've reached your plan limit. Archive a project or upgrade to Pro to start a new
              one.
            </span>
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentTier;
            const isFreeDowngradeBlocked = plan.key === 'free' && wouldExceedFreeOnDowngrade;
            return (
              <div
                key={plan.key}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: 'var(--brand-850)',
                  border: isCurrent
                    ? `2px solid ${plan.accent}`
                    : '1px solid rgba(26,111,212,0.18)',
                  boxShadow: isCurrent ? `0 0 0 4px ${plan.accentSoft}` : undefined,
                }}
                data-testid={`plan-card-${plan.key}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: plan.accentSoft }}
                  >
                    <plan.icon className="w-5 h-5" style={{ color: plan.accent }} />
                  </div>
                  {isCurrent && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{ background: plan.accentSoft, color: plan.accent }}
                      data-testid={`current-badge-${plan.key}`}
                    >
                      Current Plan
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-sm text-[var(--text-muted)]">/ {plan.cadence}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2">{plan.tagline}</p>

                <div
                  className="mt-4 rounded-xl px-3 py-2 text-sm font-semibold"
                  style={{ background: plan.accentSoft, color: plan.accent }}
                  data-testid={`plan-limit-${plan.key}`}
                >
                  {plan.projectLimit}
                </div>

                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[var(--text-secondary,var(--text-muted))]"
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: plan.accent }}
                      />
                      <span className="text-[var(--text-muted)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isFreeDowngradeBlocked && (
                  <div
                    className="mt-4 rounded-xl px-3 py-2 flex items-start gap-2 text-xs"
                    style={{
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.3)',
                      color: '#fdba74',
                    }}
                    data-testid="downgrade-warning-free"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      You currently have {used} active projects. Archive at least {used - freeLimit}{' '}
                      to fit within the Free plan before downgrading.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
      </div>

      {/* Checkout availability notice */}
      {!billingEnabled ? (
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'var(--brand-850)',
            border: '1px solid rgba(26,111,212,0.2)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Checkout is currently unavailable
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-2xl">
                Plan upgrades and downgrades are disabled in this environment because no real
                payment provider is configured. The information above reflects your active plan and
                usage so you can plan ahead.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl p-6 text-[var(--text-primary)]"
          style={{ background: 'var(--brand-850)', border: '1px solid rgba(26,111,212,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[var(--blue-400)]" />
            <span className="text-sm">
              Real billing is enabled, but the production checkout flow has not been implemented in
              this repository yet.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
