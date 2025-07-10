import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { TrendingUp, User, LogOut, Settings, Zap, Menu, X, ChevronLeft, Home } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/exchanges', label: 'Exchanges', icon: TrendingUp },
    { path: '/bots', label: 'Trading Bots', icon: Zap },
    { path: '/subscription', label: 'Subscription', icon: Settings },
  ];

  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Back button (mobile) + Logo */}
            <div className="flex items-center space-x-3">
              {/* Back Navigation - Only show on mobile and not on dashboard */}
              {isAuthenticated && location.pathname !== '/dashboard' && (
                <button
                  onClick={handleBackNavigation}
                  className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <img 
                    src="/cAFXlogo.png" 
                    alt="TradeCafx Logo" 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain transform group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white tracking-tight">TradeCafx</span>
                  <span className="text-xs text-gray-400 font-medium">AI Trading Platform</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-6">
                <nav className="flex space-x-6">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.path) 
                          ? 'text-purple-400 bg-purple-500/10' 
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-300 truncate max-w-32">{user?.username}</span>
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
              <div className="hidden sm:flex items-center space-x-4">
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

            {/* Mobile Menu Button */}
            {isAuthenticated ? (
              <div className="md:hidden flex items-center space-x-2">
                <div className="flex items-center space-x-2 mr-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 truncate max-w-20">{user?.username}</span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="sm:hidden flex items-center space-x-2">
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

      {/* Mobile Navigation Overlay */}
      {isAuthenticated && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          
          {/* Mobile Menu */}
          <div className="fixed top-16 left-0 right-0 bg-gray-900/98 backdrop-blur-sm border-b border-gray-700 z-40 md:hidden">
            <div className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'text-purple-400 bg-purple-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Logout */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};