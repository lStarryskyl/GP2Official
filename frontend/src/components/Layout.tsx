import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import { 
  LogOut, 
  MessageCircle, 
  FolderKanban,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';
import { AcornLogo } from '@/components/AcornLogo';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { id: 'projects', icon: FolderKanban, label: 'Projects', path: '/projects', exactMatch: true },
  { id: 'profile', icon: Settings, label: 'Settings', path: '/profile', exactMatch: false },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const projectMatch = useMemo(() => location.pathname.match(/\/projects\/([^/]+)/), [location.pathname]);
  const activeProjectId = projectMatch && projectMatch[1]?.length > 6 ? projectMatch[1] : null;
  
  useEffect(() => {
    if (!activeProjectId) {
      setAssistantOpen(false);
    }
  }, [activeProjectId]);

  const isActive = (item: typeof navItems[0]) => {
    if (item.exactMatch) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col bg-acorn-blue-600 text-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Logo */}
        <div className="p-4 border-b border-acorn-blue-500">
          <Link to="/projects" className="flex items-center gap-3">
            <AcornLogo size={36} />
            {sidebarOpen && <span className="font-bold text-lg">Acorn</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                isActive(item)
                  ? 'bg-acorn-orange-500 text-white'
                  : 'text-acorn-blue-100 hover:bg-acorn-blue-500'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-acorn-blue-500 text-acorn-blue-200 hover:text-white transition-colors flex items-center justify-center"
        >
          <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-acorn-blue-600 text-white animate-slideIn">
            <div className="p-4 border-b border-acorn-blue-500 flex items-center justify-between">
              <Link to="/projects" className="flex items-center gap-3">
                <AcornLogo size={36} />
                <span className="font-bold text-lg">Acorn</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="py-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                    isActive(item)
                      ? 'bg-acorn-orange-500 text-white'
                      : 'text-acorn-blue-100 hover:bg-acorn-blue-500'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left - Mobile Menu & Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="bg-transparent border-none outline-none text-sm flex-1"
                />
              </div>
            </div>

            {/* Right - User Actions */}
            {user && (
              <div className="flex items-center gap-3">
                <ThemeToggle variant="ghost" size="sm" />
                
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-acorn-orange-500 rounded-full"></span>
                </button>

                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                  <p className="text-xs text-gray-500">{user.organization || 'Personal'}</p>
                </div>

                <button
                  onClick={() => navigate('/profile')}
                  className="w-9 h-9 bg-acorn-blue-100 text-acorn-blue-600 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Persistent Assistant Bubble */}
      {activeProjectId && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            className="shadow-xl bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white rounded-full w-14 h-14 p-0"
            onClick={() => setAssistantOpen(true)}
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          {assistantOpen && (
            <ConversationalDock
              projectId={activeProjectId}
              open={assistantOpen}
              onClose={() => setAssistantOpen(false)}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};
