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
    try {
      const response = await api.get('/api/get-exchanges/');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch exchanges from API:', error);
      // Fallback to a basic list of supported exchanges when API fails
      return [
        { value: 'binance', label: 'Binance', image: '/exchanges/binance.png' },
        { value: 'bybit', label: 'Bybit', image: '/exchanges/bybit.png' },
        { value: 'okx', label: 'OKX', image: '/exchanges/okx.png' },
        { value: 'kucoin', label: 'KuCoin', image: '/exchanges/kucoin.png' },
        { value: 'gate', label: 'Gate.io', image: '/exchanges/gate.png' },
        { value: 'mexc', label: 'MEXC', image: '/exchanges/mexc.png' }
      ];
    }
  },

  getConnectedExchanges: async () => {
    try {
      const response = await api.get('/api/get-connected-exchanges/');
      const serverData = response.data;
      
      // Merge with locally stored connections (workaround for missing server endpoint)
      const localConnections = JSON.parse(localStorage.getItem('connectedExchanges') || '[]');
      
      if (localConnections.length > 0) {
        const mergedExchanges = serverData.exchanges.map((exchange: any) => {
          const localConnection = localConnections.find((local: any) => 
            local.name.toLowerCase() === exchange.name.toLowerCase()
          );
          
          return {
            ...exchange,
            connected: localConnection ? localConnection.connected : exchange.connected
          };
        });
        
        const connectedCount = mergedExchanges.filter((ex: any) => ex.connected).length;
        
        return {
          ...serverData,
          count: connectedCount,
          exchanges: mergedExchanges
        };
      }
      
      return serverData;
    } catch (error: any) {
      console.error('Failed to fetch connected exchanges from API:', error);
      // Fallback to locally stored connections when API fails
      const localConnections = JSON.parse(localStorage.getItem('connectedExchanges') || '[]');
      return { 
        count: localConnections.filter((ex: any) => ex.connected).length,
        exchanges: localConnections.map((local: any) => ({
          name: local.name,
          connected: local.connected,
          image: '' // No image data in local storage
        }))
      };
    }
  },

  getPairs: async () => {
    const response = await api.get('/api/get-pairs/');
    return response.data;
  },

  getBotRunHours: async () => {
    const response = await api.get('/api/get-bot-run-hours/');
    return response.data;
  },

  connectExchange: async (exchange: string, api_key: string, api_secret: string) => {
    try {
      // Try the dedicated connect endpoint first
      const response = await api.post('/api/exchanges/connect/', { 
        exchange, 
        api_key, 
        api_secret 
      });
      return response.data;
    } catch (error: any) {
      // If the dedicated endpoint doesn't exist, fall back to the test method
      console.log('Dedicated connect endpoint not available, using test method');
      
      const testConfig = {
        api_key,
        api_secret,
        symbol: 'BTCUSDT',
        grid_size: 5,
        upper_price: 90000,
        lower_price: 85000,
        investment_amount: 10,
        run_hours: 24,
        exchange,
      };
      
      // Test the credentials by starting a bot, then immediately stop it
      const botResult = await apiService.startSpotBot(testConfig);
      
      // If bot start was successful, try to stop it immediately
      if (botResult && botResult.task_id) {
        try {
          await apiService.stopSpotBot(botResult.task_id);
        } catch (stopError) {
          console.warn('Could not stop test bot:', stopError);
        }
      }
      
      // Store connection info locally since server doesn't have proper endpoint
      if (botResult) {
        const connectedExchanges = JSON.parse(localStorage.getItem('connectedExchanges') || '[]');
        const existingIndex = connectedExchanges.findIndex((ex: any) => ex.name.toLowerCase() === exchange.toLowerCase());
        
        if (existingIndex >= 0) {
          connectedExchanges[existingIndex] = { name: exchange, connected: true, api_key, timestamp: Date.now() };
        } else {
          connectedExchanges.push({ name: exchange, connected: true, api_key, timestamp: Date.now() });
        }
        
        localStorage.setItem('connectedExchanges', JSON.stringify(connectedExchanges));
      }
      
      return botResult;
    }
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