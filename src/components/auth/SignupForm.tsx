import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Mail, Lock, User } from 'lucide-react';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const SignupForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      console.log('Submitting signup form...');
      await signup(data.email, data.username, data.password, data.confirmPassword);
      console.log('Signup successful, navigating to verification...');
      // Navigate to verification page after successful signup
      navigate('/auth/verify');
    } catch (error) {
      console.error('Signup failed:', error);
      // Error is handled in the store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/5 rounded-full blur-2xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-blue-600/10 rounded-full blur-xl animate-float"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fadeInUp">
          <div className="flex justify-center">
            <img
              src="/cAFXlogo.png"
              alt="CAFX Terminal Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white animate-slideInUp">
            Join CAFX Terminal
          </h2>
          <p className="mt-2 text-sm text-gray-400 animate-slideInUp animation-delay-200">
            Create your account to start automated trading
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
                label="Username"
                type="text"
                icon={<User className="w-5 h-5 text-gray-400" />}
                placeholder="Choose a username"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>

            <div className="animate-slideInUp animation-delay-800">
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                placeholder="Create a password"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="animate-slideInUp animation-delay-900">
              <Input
                label="Confirm Password"
                type="password"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="animate-slideInUp animation-delay-1000">
              <Button
                type="submit"
                loading={loading}
                className="w-full relative overflow-hidden group"
                size="lg"
              >
                <span className="relative z-10">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center animate-slideInUp animation-delay-1100">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};