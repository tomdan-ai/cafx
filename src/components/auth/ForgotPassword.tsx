import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { apiService } from '../../utils/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});
 //chnages made
interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await apiService.forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset code sent to your email!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to send reset code';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              We've sent a password reset code to <span className="text-purple-400">{getValues('email')}</span>
            </p>
          </div>

          <Card className="mt-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Sent Successfully!</h3>
                <p className="text-sm text-gray-400">
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
              <Link to="/auth/reset-password" className="block">
                <Button variant="primary" className="w-full">
                  Enter Reset Code
                </Button>
              </Link>
              <Link to="/auth/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email address and we'll send you a reset code
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

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
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