import React from 'react';
import { Layout } from '@/components/Layout';
import { BillingPage } from '@/components/BillingPage';
import { useAuthStore } from '@/store/authStore';

export const BillingPageRoute: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Layout>
      <BillingPage userId={user?.id || ''} />
    </Layout>
  );
};
