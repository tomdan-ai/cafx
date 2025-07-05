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
import { Exchanges } from './pages/Exchanges';
import { TradingBots } from './pages/TradingBots';
import { Subscription } from './pages/Subscription';

function App() {
  const { initialize, isAuthenticated, needsVerification, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Debug logging
  useEffect(() => {
    console.log('App state:', { isAuthenticated, needsVerification, user: !!user });
  }, [isAuthenticated, needsVerification, user]);

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
          <Route path="/exchanges" element={
            <ProtectedRoute>
              <Exchanges />
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;