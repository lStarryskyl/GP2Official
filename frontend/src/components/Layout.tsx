import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { LogOut, MessageCircle, UserCircle2 } from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';
import { AcornLogo } from '@/components/AcornLogo';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-amber-200/50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/projects" className="hover:scale-105 transition-transform">
              <AcornLogo size={40} />
            </Link>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">
                    {user.role_label} · {user.organization || 'Private workspace'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  <UserCircle2 className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-5 lg:px-8 py-6">{children}</main>

      {/* Persistent assistant bubble */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        <Button
          className="shadow-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          onClick={() => activeProjectId && setAssistantOpen(true)}
          disabled={!activeProjectId}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Project Assistant
        </Button>
        {assistantOpen && activeProjectId && (
          <ConversationalDock
            projectId={activeProjectId}
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
          />
        )}
      </div>

    </div>
  );
};
