import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, Search, FileText, CheckSquare, Layout, Code,
  ListTodo, DollarSign, AlertTriangle, BookOpen, ChevronLeft,
  ChevronRight, Menu, X, ArrowLeft,
} from 'lucide-react';
import { phaseConfigs } from '@/constants/phases';

const PHASE_ICONS: Record<string, React.ReactNode> = {
  planning:               <Lightbulb size={15} />,
  feasibility_study:      <Search size={15} />,
  requirements_gathering: <FileText size={15} />,
  validation:             <CheckSquare size={15} />,
  design:                 <Layout size={15} />,
  development:            <Code size={15} />,
  tasks:                  <ListTodo size={15} />,
  cost_benefit:           <DollarSign size={15} />,
  risks:                  <AlertTriangle size={15} />,
  summary:                <BookOpen size={15} />,
};

const STATUS_COLORS: Record<string, string> = {
  completed:   '#22c55e',
  active:      '#1A6FD4',
  in_progress: '#1A6FD4',
  ready:       '#3d8fe0',
  planning:    '#8899AA',
  locked:      '#4a6070',
};

interface PhasePageShellProps {
  projectId: string;
  projectName: string;
  currentPhaseId: string;
  phaseStatus: Record<string, string>;
  children: React.ReactNode;
}

export const PhasePageShell: React.FC<PhasePageShellProps> = ({
  projectId,
  projectName,
  currentPhaseId,
  phaseStatus,
  children,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentIndex = phaseConfigs.findIndex(p => p.id === currentPhaseId);
  const currentPhase = phaseConfigs[currentIndex];
  const prevPhase = currentIndex > 0 ? phaseConfigs[currentIndex - 1] : null;
  const nextPhase = currentIndex < phaseConfigs.length - 1 ? phaseConfigs[currentIndex + 1] : null;

  const getStatusLabel = (phaseId: string) => {
    const s = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (s === 'completed') return 'completed';
    if (s === 'active' || s === 'in_progress') return 'active';
    if (s === 'ready' || s === 'planning') return 'ready';
    return 'locked';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A', color: '#E8EDF5' }}>
      {/* Top bar */}
      <div style={{
        height: '52px',
        background: '#111f30',
        borderBottom: '1px solid rgba(26,111,212,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', padding: '4px', borderRadius: '6px', display: 'flex' }}
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', padding: 0 }}
          >
            Projects
          </button>
          <span style={{ color: '#4a6070' }}>›</span>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', padding: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {projectName}
          </button>
          <span style={{ color: '#4a6070' }}>›</span>
          <span style={{ color: '#1A6FD4', fontWeight: 600 }}>
            {currentPhase?.title || currentPhaseId}
          </span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(26,111,212,0.1)',
            border: '1px solid rgba(26,111,212,0.25)',
            borderRadius: '8px',
            color: '#3d8fe0',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <ArrowLeft size={13} />
          Back to Project
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Phase nav sidebar */}
        {sidebarOpen && (
          <div style={{
            width: '240px',
            flexShrink: 0,
            background: '#111f30',
            borderRight: '1px solid rgba(26,111,212,0.15)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Project name */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(26,111,212,0.15)',
            }}>
              <p style={{ fontSize: '10px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Project
              </p>
              <p style={{ fontSize: '13px', color: '#E8EDF5', fontFamily: 'Syne, sans-serif', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {projectName}
              </p>
            </div>

            {/* Phase list */}
            <div style={{ padding: '8px', flex: 1 }}>
              <p style={{ fontSize: '10px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', margin: '8px 8px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Phases
              </p>
              {phaseConfigs.map(phase => {
                const statusKey = getStatusLabel(phase.id);
                const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.locked;
                const isActive = phase.id === currentPhaseId;
                const isLocked = statusKey === 'locked';

                return (
                  <button
                    key={phase.id}
                    onClick={() => !isLocked && navigate(`/projects/${projectId}/phases/${phase.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? 'rgba(26,111,212,0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #1A6FD4' : '3px solid transparent',
                      cursor: isLocked ? 'default' : 'pointer',
                      textAlign: 'left',
                      marginBottom: '2px',
                      transition: 'background 0.15s',
                      opacity: isLocked ? 0.5 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!isActive && !isLocked) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26,111,212,0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Phase icon */}
                    <span style={{ color: isActive ? '#1A6FD4' : statusColor, flexShrink: 0 }}>
                      {PHASE_ICONS[phase.id] || <FileText size={15} />}
                    </span>

                    {/* Phase name + step */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        fontFamily: isActive ? 'Syne, sans-serif' : 'DM Sans, sans-serif',
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? '#E8EDF5' : '#8899AA',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {phase.title}
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif' }}>
                        Step {phase.stepNumber}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: statusColor, flexShrink: 0,
                    }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}

          {/* Prev / Next nav bar */}
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(26,111,212,0.15)',
            background: '#111f30',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            {prevPhase ? (
              <button
                onClick={() => navigate(`/projects/${projectId}/phases/${prevPhase.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(26,111,212,0.1)',
                  border: '1px solid rgba(26,111,212,0.25)',
                  borderRadius: '8px',
                  color: '#3d8fe0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <ChevronLeft size={14} />
                {prevPhase.title}
              </button>
            ) : <div />}

            <span style={{ fontSize: '12px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif' }}>
              {currentIndex + 1} / {phaseConfigs.length}
            </span>

            {nextPhase ? (
              <button
                onClick={() => navigate(`/projects/${projectId}/phases/${nextPhase.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                Continue to {nextPhase.title}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/projects/${projectId}/summary`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #F97316, #cc4900)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                }}
              >
                View Project Summary
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhasePageShell;
