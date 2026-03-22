import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  UserCircle,
  Settings,
  LogOut,
  Plus,
  Home,
  TreePine,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();

  const collapsed     = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = controlledToggle ?? (() => setInternalCollapsed(!internalCollapsed));

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) setInternalCollapsed(savedState === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      path: '/projects',
      matchPaths: ['/projects'],
      exactMatch: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircle,
      path: '/profile',
      matchPaths: ['/profile'],
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    const currentPath = location.pathname;
    if (item.exactMatch) return currentPath === item.path;
    return item.matchPaths.some(matchPath => currentPath.startsWith(matchPath));
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0f1f15] text-[#e8f5e0] flex flex-col transition-all duration-300 z-50 border-r border-[#1e4a28]/50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e4a28]/50">
        <Link to="/projects" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ade80] to-[#2d6a3f] rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-9 h-9 bg-gradient-to-br from-[#4ade80] to-[#3d8a55] rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-[#0a150e]" />
            </div>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-gradient-forest">
              Acorn
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[#1e4a28] transition-colors text-[#6b9e7a] hover:text-[#e8f5e0]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <button
          onClick={() => navigate('/projects/new')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#3d8a55] hover:from-[#86efac] hover:to-[#4ade80] transition-all text-[#0a150e] font-semibold shadow-lg shadow-[#4ade80]/20 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-[#6b9e7a] uppercase tracking-wider">
              Navigation
            </span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30'
                  : 'text-[#6b9e7a] hover:text-[#e8f5e0] hover:bg-[#1e4a28]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#4ade80]' : ''}`} />
              {!collapsed && (
                <span className={`font-medium ${active ? 'text-[#4ade80]' : ''}`}>
                  {item.label}
                </span>
              )}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#1e4a28]/50 p-3">
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e4a28] to-[#2d6a3f] flex items-center justify-center text-sm font-semibold text-[#4ade80] flex-shrink-0 border border-[#4ade80]/20">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#e8f5e0] truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-[#6b9e7a] truncate">
                  {user.organization || 'Personal'}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 mt-3 rounded-xl text-[#6b9e7a] hover:text-red-400 hover:bg-red-500/10 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
