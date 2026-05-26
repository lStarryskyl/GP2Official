import React from 'react';
import { useNavigate } from 'react-router-dom';
import { phaseConfigs } from '@/constants/phases';
import { CheckCircle2 } from 'lucide-react';

interface ProjectProgressBarProps {
  projectId: string;
  phaseStatus?: Record<string, string>;
  className?: string;
}

const COLOR_COMPLETED = '#1A6FD4';
const COLOR_IN_PROGRESS = '#F97316';
const COLOR_REMAINING = 'rgba(74,96,112,0.45)';

export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  projectId,
  phaseStatus = {},
  className,
}) => {
  const navigate = useNavigate();
  const total = phaseConfigs.length;

  const getStatus = (id: string) => (phaseStatus[id] || 'locked').toLowerCase();

  const isCompletedStatus = (s: string) => s === 'completed' || s === 'ready';
  const isInProgressStatus = (s: string) => s === 'in_progress' || s === 'active';

  const completedCount = phaseConfigs.filter((p) => isCompletedStatus(getStatus(p.id))).length;
  const inProgressCount = phaseConfigs.filter((p) => isInProgressStatus(getStatus(p.id))).length;
  const pct = Math.round((completedCount / total) * 100);
  const allDone = completedCount >= total;

  const nextIncomplete = allDone
    ? null
    : phaseConfigs.find((p) => isInProgressStatus(getStatus(p.id))) ||
      phaseConfigs.find((p) => !isCompletedStatus(getStatus(p.id))) ||
      null;

  const handleClick = () => {
    if (!projectId || !nextIncomplete) return;
    navigate(`/projects/${projectId}/phases/${nextIncomplete.id}`);
  };

  const tooltip = allDone
    ? 'All phases complete'
    : `Jump to next incomplete phase: ${nextIncomplete?.title || ''}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!nextIncomplete}
      title={tooltip}
      data-testid="project-progress-bar"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'rgba(13,27,42,0.55)',
        border: '1px solid rgba(26,111,212,0.25)',
        borderRadius: '14px',
        padding: '14px 18px',
        cursor: nextIncomplete ? 'pointer' : 'default',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {allDone && <CheckCircle2 size={16} color={COLOR_COMPLETED} />}
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
            }}
          >
            {completedCount} of {total} phases complete
          </span>
          {inProgressCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(249,115,22,0.15)',
                color: COLOR_IN_PROGRESS,
                border: '1px solid rgba(249,115,22,0.35)',
              }}
            >
              {inProgressCount} in progress
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '16px',
              color: COLOR_COMPLETED,
            }}
          >
            {pct}%
          </span>
          {!allDone && nextIncomplete && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              → {nextIncomplete.shortTitle || nextIncomplete.title}
            </span>
          )}
        </div>
      </div>

      {/* Segmented bar — one segment per phase */}
      <div style={{ display: 'flex', gap: '3px', width: '100%' }}>
        {phaseConfigs.map((phase) => {
          const s = getStatus(phase.id);
          const isCompleted = isCompletedStatus(s);
          const isInProgress = isInProgressStatus(s);
          const bg = isCompleted
            ? COLOR_COMPLETED
            : isInProgress
            ? COLOR_IN_PROGRESS
            : COLOR_REMAINING;
          return (
            <div
              key={phase.id}
              title={`${phase.stepNumber}. ${phase.title} — ${s.replace('_', ' ')}`}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '999px',
                background: bg,
                boxShadow: isCompleted
                  ? `0 0 6px ${COLOR_COMPLETED}66`
                  : isInProgress
                  ? `0 0 6px ${COLOR_IN_PROGRESS}66`
                  : 'none',
                transition: 'background 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </button>
  );
};

export default ProjectProgressBar;
