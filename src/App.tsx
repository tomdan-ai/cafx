import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import EmailVerification from './components/auth/EmailVerification';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { TradingBots } from './pages/TradingBots';
import { Subscription } from './pages/Subscription';
import { Analytics } from './pages/Analytics';

function App() {
  const { initialize, isAuthenticated, needsVerification, user, isInitializing } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Debug logging
  useEffect(() => {
    console.log('App state:', { isAuthenticated, needsVerification, isInitializing, user: !!user });
  }, [isAuthenticated, needsVerification, isInitializing, user]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<LoginForm />} />
        <Route path="/auth/signup" element={<SignupForm />} />
        <Route path="/auth/verify" element={<EmailVerification />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Layout />}>
          <Route index element={
            isAuthenticated && !needsVerification ? (
              <Navigate to="/dashboard" replace />
            ) : needsVerification ? (
              <Navigate to="/auth/verify" replace />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/bots" element={
            <ProtectedRoute>
              <TradingBots />
            </ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;