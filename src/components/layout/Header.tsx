import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { TrendingUp, User, LogOut, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold text-white">CAFX Terminal</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/exchanges"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/exchanges') 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Exchanges
                </Link>
                <Link
                  to="/bots"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/bots') 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Bots
                </Link>
                <Link
                  to="/subscription"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/subscription') 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Subscription
                </Link>
              </nav>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">{user?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};