import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LogOut, MessageCircle, FolderKanban, Search,
  Menu, X, ChevronRight, ChevronLeft, Plus, Sparkles, User as UserIcon,
  BarChart3, Users, CreditCard, Zap, BookOpen, Bell, Layers,
  ChevronsUpDown, CheckCircle2, Circle, Loader2, Lock, Command,
  Archive,
} from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';
import { AIDebatePanel } from '@/components/AIDebatePanel';
import { CommandPalette } from '@/components/CommandPalette';
import { phaseConfigs } from '@/constants/phases';
import { api } from '@/lib/api';
import type { Project } from '@/types';

interface LayoutProps { children: React.ReactNode; }

const navItems = [
  { id: 'projects',  icon: FolderKanban, label: 'Projects',  path: '/projects' },
  { id: 'analytics', icon: BarChart3,    label: 'Analytics', path: '/analytics' },
  { id: 'docs',      icon: BookOpen,     label: 'Docs',      path: '/docs' },
  { id: 'profile',   icon: UserIcon,     label: 'Profile',   path: '/profile' },
];

const RECENTS_KEY = 'acorn_recent_projects';

const trackRecent = (id: string) => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...list.filter(x => x !== id)].slice(0, 5);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
};

const getRecents = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout }          = useAuthStore();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [assistantOpen, setAssistantOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [paletteOpen, setPaletteOpen]           = useState(false);
  const [switcherOpen, setSwitcherOpen]         = useState(false);
  const [projects, setProjects]                 = useState<Project[]>([]);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) setSidebarCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const projectMatch    = useMemo(() => location.pathname.match(/\/projects\/([^/]+)/), [location.pathname]);
  const activeProjectId = projectMatch && projectMatch[1]?.length > 6 ? projectMatch[1] : null;
  const phaseMatch      = useMemo(() => location.pathname.match(/\/phases\/([^/]+)/), [location.pathname]);
  const activePhaseId   = phaseMatch ? phaseMatch[1] : null;
  const onPhasePage     = !!activePhaseId;

  // Track recents
  useEffect(() => { if (activeProjectId) trackRecent(activeProjectId); }, [activeProjectId]);

  // Load projects for sidebar (lightly cached)
  useEffect(() => {
    if (!user) return;
    api.getProjects().then(setProjects).catch(() => { /* ignore */ });
  }, [user, activeProjectId]);

  const activeProject = useMemo(
    () => projects.find(p => (p.id || p.project_id) === activeProjectId),
    [projects, activeProjectId],
  );

  const recents = useMemo(() => {
    const ids = getRecents().filter(id => id !== activeProjectId);
    return ids
      .map(id => projects.find(p => (p.id || p.project_id) === id))
      .filter(Boolean)
      .slice(0, 4) as Project[];
  }, [projects, activeProjectId, location.pathname]);

  useEffect(() => { if (!activeProjectId) setAssistantOpen(false); }, [activeProjectId]);

  // Cmd/Ctrl + K opens command palette globally
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close switcher on outside click
  useEffect(() => {
    if (!switcherOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!switcherRef.current?.contains(e.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [switcherOpen]);

  const isActive = (path: string) => {
    if (path === '/projects') return location.pathname === path || location.pathname.startsWith('/projects/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarW = sidebarCollapsed ? '72px' : '264px';

  // Status indicator helpers for phase pips
  const phaseIcon = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed')   return { Icon: CheckCircle2, color: '#22c55e' };
    if (s === 'in_progress') return { Icon: Loader2,      color: '#F97316' };
    if (s === 'locked')      return { Icon: Lock,         color: '#5b6f80' };
    return { Icon: Circle, color: '#1A6FD4' };
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-900)', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
      <div className="glow-orb glow-orb-forest" style={{ width: '500px', height: '500px', top: '10%', left: '5%', opacity: 0.4 }} />

      {/* ── Sidebar Desktop ── */}
      <aside style={{
        display: 'none',
        position: 'fixed', left: 0, top: 0, height: '100vh', width: sidebarW,
        background: 'var(--brand-850)',
        borderRight: '1px solid rgba(26,111,212,0.18)',
        flexDirection: 'column',
        zIndex: 40,
        transition: 'width 0.3s var(--ease-out-expo)',
      }}
        className="lg:flex flex-col"
      >
        {/* Logo */}
        <div style={{
          height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', borderBottom: '1px solid rgba(26,111,212,0.18)', flexShrink: 0,
        }}>
          <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', borderRadius: '10px', filter: 'blur(6px)', opacity: 0.5 }} />
              <div style={{ position: 'relative', width: '34px', height: '34px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="#fff" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Acorn</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px' }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Command palette trigger */}
        <div style={{ padding: '10px 12px 6px' }}>
          <button
            onClick={() => setPaletteOpen(true)}
            title="Search (⌘K)"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '10px', padding: sidebarCollapsed ? '8px' : '8px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: 'rgba(26,111,212,0.08)',
              border: '1px solid rgba(26,111,212,0.18)',
              borderRadius: '10px', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Search size={14} />
            {!sidebarCollapsed && (
              <>
                <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
                <kbd style={{ fontSize: '10px', background: 'rgba(26,111,212,0.2)', borderRadius: '4px', padding: '2px 5px', color: 'var(--text-muted)' }}>⌘K</kbd>
              </>
            )}
          </button>
        </div>

        {/* Project switcher */}
        {!sidebarCollapsed && (
          <div ref={switcherRef} style={{ position: 'relative', padding: '4px 12px 6px' }}>
            <button
              onClick={() => setSwitcherOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '10px',
                background: switcherOpen ? 'rgba(26,111,212,0.15)' : 'rgba(26,111,212,0.05)',
                border: '1px solid rgba(26,111,212,0.18)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FolderKanban size={12} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Project
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeProject?.name || 'All Projects'}
                </div>
              </div>
              <ChevronsUpDown size={13} color="var(--text-muted)" />
            </button>
            {switcherOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: '12px', right: '12px',
                background: 'var(--brand-850)',
                border: '1px solid rgba(26,111,212,0.25)',
                borderRadius: '12px', padding: '6px',
                maxHeight: '280px', overflowY: 'auto',
                boxShadow: '0 12px 28px rgba(0,0,0,0.5)', zIndex: 50,
              }}>
                {projects.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    No projects yet
                  </div>
                )}
                {projects.slice(0, 12).map(p => {
                  const pid = p.id || p.project_id || '';
                  const isActiveProj = pid === activeProjectId;
                  return (
                    <button
                      key={pid}
                      onClick={() => { navigate(`/projects/${pid}`); setSwitcherOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: '8px',
                        background: isActiveProj ? 'rgba(26,111,212,0.18)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        color: isActiveProj ? 'var(--blue-300)' : 'var(--text-primary)',
                        fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                      }}
                      onMouseEnter={e => { if (!isActiveProj) e.currentTarget.style.background = 'rgba(26,111,212,0.08)'; }}
                      onMouseLeave={e => { if (!isActiveProj) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <FolderKanban size={12} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </button>
                  );
                })}
                <div style={{ height: '1px', background: 'rgba(26,111,212,0.15)', margin: '6px 4px' }} />
                <button
                  onClick={() => { navigate('/projects'); setSwitcherOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <FolderKanban size={12} /> View all projects
                </button>
                <button
                  onClick={() => { navigate('/projects/new'); setSwitcherOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'transparent', color: '#F97316', fontSize: '12px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <Plus size={12} /> New project
                </button>
              </div>
            )}
          </div>
        )}

        {/* New Project button */}
        <div style={{ padding: '6px 12px 10px' }}>
          <button
            onClick={() => navigate('/projects/new')}
            title="New project"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: sidebarCollapsed ? '9px' : '9px 14px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: 'linear-gradient(135deg, #F97316, #cc4900)',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Plus size={15} />
            {!sidebarCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Phase shortcuts (when inside a project) */}
        {activeProjectId && !sidebarCollapsed && (
          <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid rgba(26,111,212,0.12)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 4px' }}>
              Phases
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {phaseConfigs.map(ph => {
                const isActiveP = activePhaseId === ph.id;
                const status    = activeProject?.phase_status?.[ph.id];
                const { Icon, color } = phaseIcon(status);
                const isLocked  = status === 'locked';
                return (
                  <button
                    key={ph.id}
                    onClick={() => navigate(`/projects/${activeProjectId}/phases/${ph.id}`)}
                    disabled={isLocked}
                    title={ph.description}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 10px', borderRadius: '8px', border: 'none',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      background: isActiveP ? 'rgba(26,111,212,0.18)' : 'transparent',
                      borderLeft: isActiveP ? '2px solid #1A6FD4' : '2px solid transparent',
                      color: isActiveP ? 'var(--blue-300)' : isLocked ? 'var(--text-faint)' : 'var(--text-muted)',
                      fontSize: '12.5px', textAlign: 'left',
                      fontFamily: isActiveP ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                      fontWeight: isActiveP ? 600 : 400,
                      opacity: isLocked ? 0.55 : 1,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActiveP && !isLocked) e.currentTarget.style.background = 'rgba(26,111,212,0.08)'; }}
                    onMouseLeave={e => { if (!isActiveP && !isLocked) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'rgba(26,46,69,0.5)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
                    }}>{ph.stepNumber}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ph.shortTitle}</span>
                    <Icon size={12} color={color} className={status === 'in_progress' ? 'animate-spin' : ''} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recents (when not inside a project) */}
        {!activeProjectId && !sidebarCollapsed && recents.length > 0 && (
          <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid rgba(26,111,212,0.12)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 4px' }}>
              Recent
            </div>
            {recents.map(p => {
              const pid = p.id || p.project_id || '';
              return (
                <button
                  key={pid}
                  onClick={() => navigate(`/projects/${pid}`)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-muted)', fontSize: '12.5px',
                    textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <FolderKanban size={12} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 4px' }}>
              Workspace
            </p>
          )}
          {navItems.map(item => {
            const Icon   = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: '12px', padding: '9px 12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(26,111,212,0.15)' : 'transparent',
                  borderLeft: active ? '3px solid #1A6FD4' : '3px solid transparent',
                  color: active ? 'var(--blue-300)' : 'var(--text-muted)',
                  fontFamily: active ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                  fontWeight: active ? 600 : 400, fontSize: '13.5px',
                  marginBottom: '2px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(26,111,212,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <Icon size={16} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ borderTop: '1px solid rgba(26,111,212,0.15)', padding: '10px', flexShrink: 0 }}>
          {user && !sidebarCollapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '10px',
              background: 'rgba(26,111,212,0.08)', marginBottom: '6px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(26,111,212,0.3), rgba(13,43,82,0.5))',
                border: '1px solid rgba(26,111,212,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--blue-300)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
              }}>
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {user.full_name || user.email?.split('@')[0]}
                </p>
                <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.organization || (user as any).role_label || 'Member'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '10px', padding: '9px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={15} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: 'rgba(17,31,48,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(26,111,212,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 50,
      }} className="lg:hidden">
        <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>Acorn</span>
        </Link>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setPaletteOpen(true)}
            style={{ background: 'rgba(26,111,212,0.15)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, paddingTop: '60px',
          background: 'rgba(13,27,42,0.97)', backdropFilter: 'blur(16px)',
          overflowY: 'auto',
        }} className="lg:hidden animate-reveal-down">
          <nav style={{ padding: '16px' }}>
            {navItems.map(item => {
              const Icon   = item.icon;
              const active = isActive(item.path);
              return (
                <button key={item.id}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(26,111,212,0.15)' : 'transparent',
                    color: active ? 'var(--blue-300)' : 'var(--text-muted)',
                    fontSize: '15px', fontFamily: "'DM Sans', sans-serif", marginBottom: '4px',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {activeProjectId && (
              <>
                <div style={{ marginTop: '12px', padding: '10px 16px 6px', fontSize: '11px', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Phases
                </div>
                {phaseConfigs.map(ph => {
                  const status = activeProject?.phase_status?.[ph.id];
                  const isLocked = status === 'locked';
                  return (
                    <button key={ph.id}
                      onClick={() => { if (!isLocked) { navigate(`/projects/${activeProjectId}/phases/${ph.id}`); setMobileMenuOpen(false); } }}
                      disabled={isLocked}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '11px 16px', borderRadius: '10px', border: 'none',
                        cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1,
                        background: 'transparent', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left',
                      }}
                    >
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,46,69,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {ph.stepNumber}
                      </span>
                      <span>{ph.title}</span>
                    </button>
                  );
                })}
              </>
            )}
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(26,111,212,0.15)', marginTop: '8px' }}>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#f87171', fontSize: '15px',
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{
        flex: 1, marginLeft: 0, paddingTop: '60px',
        position: 'relative', zIndex: 10,
      }}
        className="lg:pt-0"
      >
        <style>{`@media (min-width:1024px) { main { margin-left: ${sidebarW}; padding-top: 0; } }`}</style>
        <div style={{ padding: '24px 32px' }}>
          {children}
        </div>
      </main>

      {/* ── AI Debate Panel (visible on any project page) ── */}
      {activeProjectId && (
        <AIDebatePanel projectId={activeProjectId} />
      )}

      {/* ── AI Chat FAB (hidden on phase pages where Athena is shown) ── */}
      {activeProjectId && !onPhasePage && (
        <>
          {!assistantOpen && (
            <button
              onClick={() => setAssistantOpen(true)}
              style={{
                position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(26,111,212,0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <MessageCircle size={22} color="#fff" />
            </button>
          )}
          {assistantOpen && (
            <div style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
              width: '380px', maxHeight: '580px',
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }} className="animate-reveal-up">
              <ConversationalDock
                projectId={activeProjectId}
                open={assistantOpen}
                onClose={() => setAssistantOpen(false)}
              />
            </div>
          )}
        </>
      )}

      {/* ── Command palette (global ⌘K) ── */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        activeProjectId={activeProjectId}
      />
    </div>
  );
};

export default Layout;
