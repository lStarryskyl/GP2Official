import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LogOut, MessageCircle, FolderKanban, Settings, Bell, Search,
  Menu, X, ChevronRight, ChevronLeft, Plus, Sparkles, User,
  HelpCircle, BarChart3, Kanban, FileText, Users, CreditCard,
  Zap, BookOpen,
} from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';
import { AIDebatePanel } from '@/components/AIDebatePanel';

interface LayoutProps { children: React.ReactNode; }

const navItems = [
  { id: 'projects',  icon: FolderKanban, label: 'Projects',  path: '/projects' },
  { id: 'analytics', icon: BarChart3,    label: 'Analytics', path: '/analytics' },
  { id: 'docs',      icon: BookOpen,     label: 'Docs',      path: '/docs' },
  { id: 'profile',   icon: User,         label: 'Profile',   path: '/profile' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout }          = useAuthStore();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [assistantOpen, setAssistantOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);

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
  // AIChatAssistant (Athena) handles chat on phase pages — don't show ConversationalDock there
  const onPhasePage = location.pathname.includes('/phases/');

  useEffect(() => { if (!activeProjectId) setAssistantOpen(false); }, [activeProjectId]);

  // Ctrl+K opens AI chat on any project page
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && activeProjectId && !onPhasePage) {
        e.preventDefault();
        setAssistantOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeProjectId, onPhasePage]);

  const isActive = (path: string) => {
    if (path === '/projects') return location.pathname === path || location.pathname.startsWith('/projects/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarW = sidebarCollapsed ? '72px' : '240px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-900)', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Background grid */}
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
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', borderBottom: '1px solid rgba(26,111,212,0.18)',
          flexShrink: 0,
        }}>
          <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                borderRadius: '10px', filter: 'blur(6px)', opacity: 0.5,
              }} />
              <div style={{
                position: 'relative', width: '38px', height: '38px',
                background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={18} color="#fff" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Acorn
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px' }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* New Project button */}
        <div style={{ padding: '12px' }}>
          <button
            onClick={() => navigate('/projects/new')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: sidebarCollapsed ? '10px' : '10px 16px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: 'linear-gradient(135deg, #F97316, #cc4900)',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Plus size={16} />
            {!sidebarCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>
              Navigation
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
                  gap: '12px', padding: '10px 12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(26,111,212,0.15)' : 'transparent',
                  borderLeft: active ? '3px solid #1A6FD4' : '3px solid transparent',
                  color: active ? 'var(--blue-300)' : 'var(--text-muted)',
                  fontFamily: active ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                  fontWeight: active ? 600 : 400, fontSize: '14px',
                  marginBottom: '2px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(26,111,212,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <Icon size={17} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {active && !sidebarCollapsed && (
                  <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#1A6FD4' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ borderTop: '1px solid rgba(26,111,212,0.15)', padding: '12px', flexShrink: 0 }}>
          {user && !sidebarCollapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              background: 'rgba(26,111,212,0.08)',
              marginBottom: '8px',
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(26,111,212,0.3), rgba(13,43,82,0.5))',
                border: '1px solid rgba(26,111,212,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--blue-300)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
              }}>
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {user.full_name || user.email?.split('@')[0]}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.organization || user.role_label || 'Member'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '10px', padding: '10px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={16} />
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
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, paddingTop: '60px',
          background: 'rgba(13,27,42,0.97)', backdropFilter: 'blur(16px)',
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
                    padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(26,111,212,0.15)' : 'transparent',
                    color: active ? 'var(--blue-300)' : 'var(--text-muted)',
                    fontSize: '16px', fontFamily: "'DM Sans', sans-serif", marginBottom: '4px',
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(26,111,212,0.15)', marginTop: '8px' }}>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#f87171', fontSize: '16px',
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
        flex: 1,
        marginLeft: 0,
        paddingTop: '60px',
        position: 'relative', zIndex: 10,
      }}
        className="lg:pt-0"
        // inline style override for desktop via CSS var
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

      {/* ── AI Chat FAB (hidden on phase pages where Athena is already shown) ── */}
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
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,111,212,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,111,212,0.45)'; }}
            >
              <MessageCircle size={22} color="#fff" />
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#1A6FD4', border: '2px solid var(--brand-900)',
                animation: 'pulse-ring 2s infinite',
              }} />
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
    </div>
  );
};

export default Layout;
