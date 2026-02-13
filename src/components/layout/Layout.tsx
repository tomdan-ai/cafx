import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import FloatingMerlin from '../ui/FloatingMerlin';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 relative">
      <FloatingMerlin />
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
};