import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Mail, Lock, TrendingUp } from 'lucide-react';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse`}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/5 rounded-full blur-2xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-blue-600/10 rounded-full blur-xl animate-float"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fadeInUp">
          <div className="flex justify-center">
            <div className="relative">
              <TrendingUp className="w-12 h-12 text-purple-500 animate-glow" />
              <div className="absolute inset-0 w-12 h-12 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white animate-slideInUp">
            Welcome back to CAFX Terminal
          </h2>
          <p className="mt-2 text-sm text-gray-400 animate-slideInUp animation-delay-200">
            Sign in to your account to continue trading
          </p>
        </div>

        <Card className="mt-8 animate-slideInUp animation-delay-400 backdrop-blur-xl bg-gray-800/30 border-gray-700/50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="animate-slideInUp animation-delay-600">
              <Input
                label="Email"
                type="email"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="animate-slideInUp animation-delay-700">
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between animate-slideInUp animation-delay-800">
              <div className="text-sm">
                <Link to="/auth/forgot-password" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="animate-slideInUp animation-delay-900">
              <Button
                type="submit"
                loading={loading}
                className="w-full relative overflow-hidden group"
                size="lg"
              >
                <span className="relative z-10">
                  {loading ? 'Signing in...' : 'Sign In'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center animate-slideInUp animation-delay-1000">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};