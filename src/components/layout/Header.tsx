import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { User, LogOut, Menu, X, ChevronLeft, Home, Bot, CreditCard } from 'lucide-react';

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
    { path: '/bots', label: 'Trading Bots', icon: Bot },
    { path: '/subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <>
      <header className="header-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Back button (mobile) + Logo */}
            <div className="flex items-center gap-3">
              {/* Back Navigation - Only show on mobile and not on dashboard */}
              {isAuthenticated && location.pathname !== '/dashboard' && (
                <button
                  onClick={handleBackNavigation}
                  className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src="/cAFXlogo.png"
                    alt="TradeCafx Logo"
                    className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                  />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full status-dot-active" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-bold text-white tracking-tight">CAFX</span>
                  <span className="text-xs text-gray-500 font-medium">Merlin Trading Terminal</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <nav className="flex items-center gap-1 mr-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item flex items-center gap-2 ${isActive(item.path) ? 'active' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-3 pl-6 border-l border-[var(--color-border)]">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-[var(--color-primary)]" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium truncate max-w-24">
                      {user?.username}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
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
              <div className="md:hidden flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--color-surface)]">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-[var(--color-primary)]" />
                  </div>
                  <span className="text-sm text-gray-300 truncate max-w-16">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="sm:hidden flex items-center gap-2">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />

          {/* Mobile Menu */}
          <div className="fixed top-16 left-0 right-0 bg-[var(--color-surface-dark)] border-b border-[var(--color-border)] z-40 md:hidden fade-in">
            <div className="px-4 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'text-gray-300 hover:text-white hover:bg-[var(--color-surface)]'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Logout */}
              <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
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