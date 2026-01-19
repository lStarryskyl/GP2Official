import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SRSAudit } from '@/components/SRSAudit';

export const SRSAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SRSAudit projectId={id!} />
      </div>
    </Layout>
  );
};
