import axios from 'axios';
import toast from 'react-hot-toast';

// Real API configuration
export const api = axios.create({
  baseURL: 'https://tradecafx.onrender.com',
  timeout: 10000,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Real API functions
export const apiService = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await api.post('/api/users/login/', { email, password });
    return response.data;
  },

  signup: async (email: string, username: string, password: string, confirm_password: string) => {
    const response = await api.post('/api/users/signup/', { email, username, password, confirm_password });
    return response.data;
  },

  verifyEmail: async (email: string, otp_code: string) => {
    const response = await api.post('/api/users/verify-email/', { email, otp_code });
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await api.post('/api/users/resend-otp/', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/api/users/forgot-password/', { email });
    return response.data;
  },

  setNewPassword: async (email: string, otp_code: string, new_password: string, confirm_password: string) => {
    const response = await api.post('/api/users/set-new-password/', { 
      email, 
      otp_code, 
      new_password, 
      confirm_password 
    });
    return response.data;
  },

  refreshToken: async (refresh: string) => {
    const response = await api.post('/api/users/token/refresh/', { refresh });
    return response.data;
  },

  // User Management
  getProfile: async () => {
    const response = await api.get('/api/users/profile/');
    return response.data;
  },

  changeEmail: async (new_email: string, password: string) => {
    const response = await api.patch('/api/users/change-email/', { new_email, password });
    return response.data;
  },

  changePassword: async (old_password: string, new_password: string, confirm_password: string) => {
    const response = await api.patch('/api/users/change-password/', { 
      old_password, 
      new_password, 
      confirm_password 
    });
    return response.data;
  },

  changeUsername: async (new_username: string, password: string) => {
    const response = await api.patch('/api/users/change-username/', { new_username, password });
    return response.data;
  },

  // Bot Management
  getAllBots: async (spot?: boolean) => {
    const params = spot !== undefined ? { spot: spot.toString() } : {};
    const response = await api.get('/api/bots/', { params });
    return response.data;
  },

  getFuturesBots: async (active?: boolean, exchange?: string) => {
    const params: any = {};
    if (active !== undefined) params.active = active;
    if (exchange) params.exchange = exchange;
    const response = await api.get('/api/futures/bots/', { params });
    return response.data;
  },

  startFuturesBot: async (botConfig: {
    api_key: string;
    api_secret: string;
    symbol: string;
    grid_size: number;
    upper_price: number;
    lower_price: number;
    investment_amount: number;
    leverage: number;
    strategy_type: string;
    run_hours: number;
    exchange: string;
  }) => {
    const response = await api.post('/api/futures/start-bot/', botConfig);
    return response.data;
  },

  stopFuturesBot: async (task_id: string) => {
    const response = await api.post('/api/futures/stop-bot/', { task_id });
    return response.data;
  },

  getSpotBots: async (active?: boolean, exchange?: string) => {
    const params: any = {};
    if (active !== undefined) params.active = active;
    if (exchange) params.exchange = exchange;
    const response = await api.get('/api/spot/bots/', { params });
    return response.data;
  },

  startSpotBot: async (botConfig: {
    api_key: string;
    api_secret: string;
    symbol: string;
    grid_size: number;
    upper_price: number;
    lower_price: number;
    investment_amount: number;
    run_hours: number;
    exchange: string;
  }) => {
    const response = await api.post('/api/spot/start-spot/', botConfig);
    return response.data;
  },

  stopSpotBot: async (task_id: string) => {
    const response = await api.post('/api/spot/stop-spot/', { task_id });
    return response.data;
  },

  // Exchange and Trading Pairs
  getExchanges: async () => {
    const response = await api.get('/api/get-exchanges/');
    return response.data;
  },

  getConnectedExchanges: async () => {
    const response = await api.get('/api/get-connected-exchanges/');
    return response.data;
  },

  getPairs: async () => {
    const response = await api.get('/api/get-pairs/');
    return response.data;
  },

  getBotRunHours: async () => {
    const response = await api.get('/api/get-bot-run-hours/');
    return response.data;
  },

  // Subscription
  subscribe: async (subscription_slug: string) => {
    const response = await api.post('/api/subscriptions/subscribe/', { subscription_slug });
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/api/subscriptions/cancel/');
    return response.data;
  }
};

// Mock API functions for fallback/development
export const mockApi = {
  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        access: 'mock-jwt-token-' + Date.now(),
        refresh: 'mock-refresh-token-' + Date.now(),
        user: {
          id: '1',
          username: email.split('@')[0],
          email: email,
          subscription_tier: 'advanced',
          created_at: new Date().toISOString()
        }
      }
    };
  },

  signup: async (email: string, username: string, password: string, confirm_password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        access: 'mock-jwt-token-' + Date.now(),
        refresh: 'mock-refresh-token-' + Date.now(),
        user: {
          id: '1',
          username: username,
          email: email,
          subscription_tier: 'starter',
          created_at: new Date().toISOString(),
          is_verified: false
        }
      }
    };
  },

  getDashboardStats: async () => ({
    data: {
      active_bots: 12,
      total_profit: 2847.50,
      connected_exchanges: 3,
      subscription_tier: 'advanced'
    }
  }),

  getConnectedExchanges: async () => ({
    data: [
      { id: '1', name: 'Binance', logo: '/exchanges/binance.png', status: 'connected' },
      { id: '2', name: 'Coinbase', logo: '/exchanges/coinbase.png', status: 'connected' },
      { id: '3', name: 'Kraken', logo: '/exchanges/kraken.png', status: 'disconnected' }
    ]
  }),

  getTradingBots: async () => ({
    data: [
      {
        id: '1',
        name: 'BTC/USDT Grid',
        type: 'spot',
        exchange: 'Binance',
        pair: 'BTC/USDT',
        status: 'active',
        profit_loss: 1247.50,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'ETH/USDT Futures',
        type: 'futures',
        exchange: 'Binance',
        pair: 'ETH/USDT',
        status: 'active',
        profit_loss: 892.30,
        created_at: '2024-01-18T14:20:00Z'
      }
    ]
  })
};