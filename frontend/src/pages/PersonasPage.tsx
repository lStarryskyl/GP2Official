import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PersonaGenerator } from '@/components/PersonaGenerator';

export const PersonasPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]" style={{ backgroundColor: '#0a0f1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PersonaGenerator projectId={id!} />
        </div>
      </div>
    </Layout>
  );
};

export default PersonasPage;
