import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { phaseConfigs } from '@/constants/phases';
import type { Project } from '@/types';
import {
  Search, FolderKanban, Layers, ArrowRight, BarChart3, User as UserIcon,
  BookOpen, Plus, Sparkles, Settings, FileText, CreditCard, Command,
  CornerDownLeft, Archive, Zap,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  activeProjectId?: string | null;
}

interface CmdItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ElementType;
  perform: () => void;
  keywords?: string;
}

const getStaticRoutes = (activeProjectId?: string | null): Array<Omit<CmdItem, 'perform'> & { path: string }> => [
  { id: 'r-projects', label: 'Projects', group: 'Navigate', icon: FolderKanban, path: '/projects', keywords: 'home dashboard list' },
  { id: 'r-new', label: 'New Project', group: 'Navigate', icon: Plus, path: '/projects/new', keywords: 'create start' },
  ...(activeProjectId ? [{ id: 'r-analytics', label: 'Analytics', group: 'Navigate', icon: BarChart3, path: `/projects/${activeProjectId}/analytics`, keywords: 'stats reports' }] : []),
  { id: 'r-docs', label: 'Documentation', group: 'Navigate', icon: BookOpen, path: '/docs', keywords: 'help guide' },
  { id: 'r-profile', label: 'Profile', group: 'Navigate', icon: UserIcon, path: '/profile', keywords: 'account user me' },
  { id: 'r-billing', label: 'Billing & Plan', group: 'Navigate', icon: CreditCard, path: '/billing', keywords: 'subscription pricing' },
  { id: 'r-trash', label: 'Archived Projects', group: 'Navigate', icon: Archive, path: '/projects?view=archived', keywords: 'trash deleted' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, activeProjectId }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load projects once
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const data = await api.getProjects();
        setProjects(data || []);
      } catch { /* ignore */ }
    })();
  }, [open]);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items: CmdItem[] = useMemo(() => {
    const list: CmdItem[] = [];

    // Routes
    getStaticRoutes(activeProjectId).forEach(r => list.push({
      id: r.id, label: r.label, group: r.group, icon: r.icon,
      keywords: r.keywords, perform: () => { navigate(r.path); onClose(); },
    }));

    // Recent projects
    projects.slice(0, 12).forEach(p => {
      const pid = p.id || p.project_id || '';
      list.push({
        id: `p-${pid}`,
        label: p.name,
        hint: p.description || 'Project',
        group: 'Projects',
        icon: FolderKanban,
        keywords: `${p.template_type || ''} ${p.status || ''}`,
        perform: () => { navigate(`/projects/${pid}`); onClose(); },
      });
    });

    // Phase shortcuts (only if inside a project)
    if (activeProjectId) {
      phaseConfigs.forEach(ph => {
        list.push({
          id: `ph-${ph.id}`,
          label: `Go to ${ph.title}`,
          hint: ph.description,
          group: 'Phases',
          icon: Layers,
          keywords: `phase ${ph.shortTitle}`,
          perform: () => { navigate(`/projects/${activeProjectId}/phases/${ph.id}`); onClose(); },
        });
      });
    }

    return list;
  }, [projects, activeProjectId, navigate, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      it.label.toLowerCase().includes(q) ||
      (it.hint?.toLowerCase().includes(q)) ||
      (it.keywords?.toLowerCase().includes(q)) ||
      it.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CmdItem[]>();
    filtered.forEach(it => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(a => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(a => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[active]?.perform();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active]);

  // Reset active on filter change
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  let runIdx = -1;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(8,15,28,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)', maxHeight: '70vh',
          background: 'linear-gradient(180deg, #122036 0%, #0d1b2a 100%)',
          border: '1px solid rgba(26,111,212,0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(26,111,212,0.08)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 18px', borderBottom: '1px solid rgba(26,111,212,0.18)',
        }}>
          <Search size={18} color="#1A6FD4" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, phases, pages…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '15px', fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <kbd style={{
            fontSize: '10px', color: 'var(--text-muted)', padding: '3px 7px',
            background: 'rgba(26,111,212,0.15)', borderRadius: '5px',
            border: '1px solid rgba(26,111,212,0.25)',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', padding: '8px 6px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Sparkles size={28} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              No matches for "{query}"
            </div>
          )}
          {grouped.map(([group, list]) => (
            <div key={group}>
              <div style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-faint)', fontWeight: 700, padding: '10px 14px 6px',
              }}>{group}</div>
              {list.map(it => {
                runIdx += 1;
                const itemIdx = runIdx;       // capture stable index for this item
                const isActive = itemIdx === active;
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    onClick={() => it.perform()}
                    onMouseEnter={() => setActive(itemIdx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', borderRadius: '10px',
                      background: isActive ? 'rgba(26,111,212,0.18)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      transition: 'background 0.1s',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#1A6FD4' : 'var(--text-muted)'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.label}
                      </div>
                      {it.hint && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.hint}
                        </div>
                      )}
                    </div>
                    {isActive && <CornerDownLeft size={13} color="#1A6FD4" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid rgba(26,111,212,0.18)',
          display: 'flex', alignItems: 'center', gap: '14px',
          fontSize: '11px', color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ background: 'rgba(26,111,212,0.15)', borderRadius: '4px', padding: '2px 5px' }}>↑↓</kbd> Navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ background: 'rgba(26,111,212,0.15)', borderRadius: '4px', padding: '2px 5px' }}>↵</kbd> Open
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={11} /> + K
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
