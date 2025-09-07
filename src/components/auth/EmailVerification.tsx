import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Mail, Shield, TrendingUp, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../utils/errorUtils';

const EmailVerification: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const { user, verifyEmail, resendOtp, needsVerification, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    console.log('EmailVerification mounted:', { user: !!user, needsVerification, isAuthenticated });
    
    // If no user, redirect to signup
    if (!user) {
      console.log('No user found, redirecting to signup');
      navigate('/auth/signup');
      return;
    }
    
    // If user is already verified and authenticated, redirect to dashboard
    if (isAuthenticated && !needsVerification) {
      console.log('User already verified, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [user, navigate, needsVerification, isAuthenticated]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    // Clear any previous error
    setError('');
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setError('No email found. Please try signing up again.');
      return;
    }
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('Submitting verification code:', otpCode);
      await verifyEmail(user.email, otpCode);
      console.log('Verification successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Verification failed:', error);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Enhanced error handling with user-friendly messages
      setError(getErrorMessage(error, 'Invalid verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!user?.email) return;
    
    try {
      setResending(true);
      setError('');
      await resendOtp(user.email);
    } catch (error: any) {
      // Enhanced error handling with user-friendly messages
      setError(getErrorMessage(error, 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirecting to signup...</p>
        </div>
      </div>
    );
  }

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
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-400 animate-slideInUp animation-delay-200">
            We've sent a 6-digit code to <span className="text-purple-400 font-medium">{user?.email}</span>
          </p>
        </div>

        <Card className="mt-8 animate-slideInUp animation-delay-400 backdrop-blur-xl bg-gray-800/30 border-gray-700/50">
          <div className="text-center mb-6 animate-slideInUp animation-delay-600">
            <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">
              Enter the 6-digit verification code sent to your email
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 animate-slideInUp">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="animate-slideInUp animation-delay-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                Verification Code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-12 text-center text-xl font-bold bg-gray-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 ${
                      error ? 'border-red-500' : 'border-gray-600'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))}
              </div>
            </div>

            <div className="animate-slideInUp animation-delay-900">
              <Button
                type="submit"
                loading={loading}
                disabled={!isComplete}
                className="w-full relative overflow-hidden group"
                size="lg"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2" />
                  {loading ? 'Verifying...' : 'Verify Email'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-4 animate-slideInUp animation-delay-1000">
            <p className="text-sm text-gray-400">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResendOtp}
              loading={resending}
              className="w-full"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </Button>
            
            <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Signup
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;