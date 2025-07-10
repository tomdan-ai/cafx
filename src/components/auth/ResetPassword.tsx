import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  otp_code: yup.string().required('Reset code is required').min(4, 'Code must be at least 4 characters'),
  new_password: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirm_password: yup.string().oneOf([yup.ref('new_password')], 'Passwords must match').required('Confirm password is required'),
});

interface ResetPasswordFormData {
  email: string;
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      await apiService.setNewPassword(data.email, data.otp_code, data.new_password, data.confirm_password);
      toast.success('Password reset successfully!');
      navigate('/auth/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <img
              src="/cAFXlogo.png"
              alt="CAFX Terminal Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter the reset code and your new password
          </p>
        </div>

        <Card className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Reset Code"
              type="text"
              icon={<Shield className="w-5 h-5 text-gray-400" />}
              placeholder="Enter reset code"
              error={errors.otp_code?.message}
              {...register('otp_code')}
            />

            <Input
              label="New Password"
              type="password"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              placeholder="Enter new password"
              error={errors.new_password?.message}
              {...register('new_password')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              placeholder="Confirm new password"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};