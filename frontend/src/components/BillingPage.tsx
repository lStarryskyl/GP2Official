import React from 'react';
import { AlertTriangle, CreditCard, Settings } from 'lucide-react';

interface BillingPageProps {
  userId: string;
}

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
      </div>
    </div>
  );
};
