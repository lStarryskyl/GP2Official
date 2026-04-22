import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { phaseConfigs, getPrevPhase, getNextPhase } from '@/constants/phases';

interface PhaseStickyHeaderProps {
  projectId: string;
  projectName?: string;
  currentPhaseId: string;
  phaseStatus?: Record<string, string>;
}

export const PhaseStickyHeader: React.FC<PhaseStickyHeaderProps> = ({
  projectId, projectName, currentPhaseId, phaseStatus,
}) => {
  const navigate = useNavigate();
  const current  = phaseConfigs.find(p => p.id === currentPhaseId);
  const prev     = getPrevPhase(currentPhaseId);
  const next     = getNextPhase(currentPhaseId);

  if (!current) return null;

  const completedCount = phaseConfigs.filter(p => (phaseStatus?.[p.id] || '').toLowerCase() === 'completed').length;
  const overallPct     = Math.round((completedCount / phaseConfigs.length) * 100);
  const currentStatus  = (phaseStatus?.[currentPhaseId] || 'ready').toLowerCase();

  const statusMeta: Record<string, { color: string; label: string; Icon: React.ElementType }> = {
    completed:   { color: '#22c55e', label: 'Completed',   Icon: CheckCircle2 },
    in_progress: { color: '#F97316', label: 'In Progress', Icon: Loader2 },
    ready:       { color: '#1A6FD4', label: 'Ready',        Icon: Circle },
    locked:      { color: '#5b6f80', label: 'Locked',       Icon: Circle },
  };
  const meta = statusMeta[currentStatus] || statusMeta.ready;
  const StatusIcon = meta.Icon;

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(13,27,42,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(26,111,212,0.22)',
        padding: '12px 24px',
        marginBottom: '20px',
        marginLeft: '-24px', marginRight: '-32px', marginTop: '-24px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Back to project */}
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid rgba(26,111,212,0.25)',
            color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '12px',
          }}
          title={projectName || 'Project'}
        >
          <ChevronLeft size={14} /> {projectName ? (projectName.length > 18 ? projectName.slice(0, 18) + '…' : projectName) : 'Project'}
        </button>

        {/* Breadcrumb crumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Phase {current.stepNumber} / {phaseConfigs.length}
          </span>
          <span style={{ color: 'var(--text-faint)' }}>›</span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px',
            color: '#fff', minWidth: 0,
          }}>
            <Layers size={16} color="#1A6FD4" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.title}</span>
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 9px', borderRadius: '999px',
            background: `${meta.color}22`, color: meta.color,
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <StatusIcon size={11} className={currentStatus === 'in_progress' ? 'animate-spin' : ''} />
            {meta.label}
          </span>
        </div>

        {/* Overall project progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600 }}>Project</span>
              <span style={{ fontSize: '10px', color: '#1A6FD4', fontWeight: 700 }}>{overallPct}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(26,46,69,0.6)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${overallPct}%`,
                background: 'linear-gradient(to right, #1A6FD4, #F97316)',
                borderRadius: '999px', transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Prev / Next buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => prev && navigate(`/projects/${projectId}/phases/${prev.id}`)}
            disabled={!prev}
            title={prev ? `Previous: ${prev.title}` : 'No previous phase'}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 10px', borderRadius: '8px',
              background: 'rgba(26,111,212,0.1)',
              border: '1px solid rgba(26,111,212,0.25)',
              color: prev ? 'var(--text-primary)' : 'var(--text-faint)',
              cursor: prev ? 'pointer' : 'not-allowed',
              fontSize: '12px', opacity: prev ? 1 : 0.4,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => next && navigate(`/projects/${projectId}/phases/${next.id}`)}
            disabled={!next}
            title={next ? `Next: ${next.title}` : 'Last phase'}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px', borderRadius: '8px',
              background: next ? 'linear-gradient(135deg, #1A6FD4, #0d4a8f)' : 'rgba(26,111,212,0.1)',
              border: '1px solid rgba(26,111,212,0.4)',
              color: next ? '#fff' : 'var(--text-faint)',
              cursor: next ? 'pointer' : 'not-allowed',
              fontSize: '12px', fontWeight: 600,
              opacity: next ? 1 : 0.4,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Phase pip strip */}
      <div style={{
        display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap',
      }}>
        {phaseConfigs.map(ph => {
          const st = (phaseStatus?.[ph.id] || '').toLowerCase();
          const isCurrent = ph.id === currentPhaseId;
          const isDone = st === 'completed';
          const isProgress = st === 'in_progress';
          let bg = 'rgba(74,96,112,0.25)';
          if (isCurrent) bg = '#1A6FD4';
          else if (isDone) bg = '#22c55e';
          else if (isProgress) bg = '#F97316';
          return (
            <button
              key={ph.id}
              onClick={() => navigate(`/projects/${projectId}/phases/${ph.id}`)}
              title={`${ph.stepNumber}. ${ph.title}`}
              style={{
                flex: 1, minWidth: '20px', height: '4px', borderRadius: '999px',
                background: bg, border: 'none', cursor: 'pointer',
                opacity: isCurrent || isDone || isProgress ? 1 : 0.5,
                transition: 'all 0.2s', padding: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PhaseStickyHeader;
