import { create } from 'zustand';
import { AuthState, User } from '../types';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  needsVerification: false,

  login: async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      // Handle different response structures
      const accessToken = response.access || response.token;
      const refreshToken = response.refresh;
      const user = response.user || response;

      if (!accessToken) {
        throw new Error('No access token received');
      }

      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        token: accessToken, 
        refreshToken,
        user, 
        isAuthenticated: true,
        needsVerification: user.is_verified === false
      });
      
      if (user.is_verified === false) {
        toast.success('Login successful! Please verify your email.');
      } else {
        toast.success('Login successful!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  signup: async (email: string, username: string, password: string, confirmPassword: string) => {
    try {
      console.log('Starting signup process...');
      const response = await apiService.signup(email, username, password, confirmPassword);
      console.log('Signup response:', response);
      
      // Create user data for verification flow
      const userData = {
        id: response.user?.id || response.id || 'temp-id',
        username: username,
        email: email,
        subscription_tier: response.user?.subscription_tier || response.subscription_tier || 'starter',
        created_at: response.user?.created_at || response.created_at || new Date().toISOString(),
        is_verified: false
      };

      console.log('Setting user data:', userData);

      // Store user data for verification
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set state for verification flow
      set({ 
        user: userData, 
        needsVerification: true,
        isAuthenticated: false,
        token: null,
        refreshToken: null
      });
      
      console.log('State updated, needsVerification:', true);
      toast.success('Account created! Please check your email for verification code.');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Signup failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  verifyEmail: async (email: string, otp_code: string) => {
    try {
      console.log('Starting email verification...');
      const response = await apiService.verifyEmail(email, otp_code);
      console.log('Verification response:', response);
      
      // After successful verification, the API should return tokens
      const accessToken = response.access || response.token;
      const refreshToken = response.refresh;
      const user = response.user || response;

      if (accessToken) {
        // Store tokens and update user
        localStorage.setItem('token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        const verifiedUser = {
          ...get().user!,
          ...user,
          is_verified: true
        };
        
        localStorage.setItem('user', JSON.stringify(verifiedUser));
        
        set({ 
          token: accessToken,
          refreshToken,
          user: verifiedUser, 
          needsVerification: false,
          isAuthenticated: true
        });
      } else {
        // Just update verification status
        const verifiedUser = {
          ...get().user!,
          is_verified: true
        };
        
        localStorage.setItem('user', JSON.stringify(verifiedUser));
        
        set({ 
          user: verifiedUser, 
          needsVerification: false,
          isAuthenticated: true
        });
      }
      
      console.log('Verification successful, redirecting to dashboard');
      toast.success('Email verified successfully!');
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Verification failed. Please check your code and try again.';
      toast.error(errorMessage);
      throw error;
    }
  },

  resendOtp: async (email: string) => {
    try {
      await apiService.resendOtp(email);
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to resend verification code';
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ 
      token: null, 
      refreshToken: null,
      user: null, 
      isAuthenticated: false,
      needsVerification: false
    });
    toast.success('Logged out successfully');
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    
    console.log('Initializing auth store...', { token: !!token, userStr: !!userStr });
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Found stored user with token:', user);
        
        // Try to get fresh user data
        try {
          const profileResponse = await apiService.getProfile();
          const freshUser = profileResponse.user || profileResponse;
          localStorage.setItem('user', JSON.stringify(freshUser));
          
          set({ 
            token, 
            refreshToken,
            user: freshUser, 
            isAuthenticated: true,
            needsVerification: freshUser.is_verified === false
          });
        } catch (error) {
          // If profile fetch fails, use stored user data
          set({ 
            token, 
            refreshToken,
            user, 
            isAuthenticated: true,
            needsVerification: user.is_verified === false
          });
        }
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    } else if (userStr) {
      // User exists but no token, might need verification
      try {
        const user = JSON.parse(userStr);
        console.log('Found stored user without token:', user);
        if (user.is_verified === false) {
          console.log('User needs verification');
          set({ 
            user, 
            needsVerification: true,
            isAuthenticated: false,
            token: null,
            refreshToken: null
          });
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  },
}));