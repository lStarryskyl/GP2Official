import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-amber-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/projects" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <img 
                  src="https://images.unsplash.com/photo-1569977562541-024dd41514fc?w=100&h=100&fit=crop" 
                  alt="Acorn" 
                  className="relative w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">Acorn</span>
            </Link>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-gray-500">{user.organization_name}</p>
                </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};
