import axios from 'axios';
// import toast from 'react-hot-toast';

// Real API configuration
export const api = axios.create({
  baseURL: 'https://tradecafx.cafx.io/',
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
      // Removed window.location redirect to allow React state to handle it
    }
    return Promise.reject(error);
  }
);

// Real API functions
export const apiService = {
  // Authentication (Django requires trailing slashes)
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

  // User Management (Django requires trailing slashes)
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
    const response = await api.get('/api/bots', {
      params: spot ? { spot: 'true' } : undefined
    });
    // Add type property to each bot based on which array it came from
    const futuresBots = (response.data.futures || []).map((bot: any) => ({
      ...bot,
      type: 'futures',
      // Map fields to match expected frontend format
      profit_loss: bot.profit_loss || 0,
      status: bot.is_running ? 'running' : 'stopped',
      created_at: bot.date_created,
      updated_at: bot.date_updated,
      meta: bot.meta
    }));

    const spotBots = (response.data.spot || []).map((bot: any) => ({
      ...bot,
      type: 'spot',
      // Map fields to match expected frontend format
      profit_loss: bot.profit_loss || 0,
      status: bot.is_running ? 'running' : 'stopped',
      created_at: bot.date_created,
      updated_at: bot.date_updated,
      meta: bot.meta
    }));

    return { futures: futuresBots, spot: spotBots };
  },

  getFuturesBots: async (active?: boolean, exchange?: string) => {
    const params: Record<string, any> = {};
    if (active !== undefined) params.active = active.toString();
    if (exchange) params.exchange = exchange;

    // Make sure this is using the real API call, not mock data
    const response = await api.get('/api/futures/bots', { params });
    return response.data;
  },

  startFuturesBot: async (botConfig: {
    mode?: 'auto' | 'manual';
    symbol: string;
    grid_size: number;
    upper_price?: number;
    lower_price?: number;
    investment_amount: number;
    leverage?: number;
    strategy_type?: string;
    run_hours?: number;
    exchange: string;
    api_key?: string;
    api_secret?: string;
  }) => {
    const { api_key, api_secret, ...config } = botConfig;
    const credentials = {
      api_key: api_key || localStorage.getItem('exchange_api_key') || '',
      api_secret: api_secret || localStorage.getItem('exchange_api_secret') || ''
    };

    // Build request payload - only include fields that have values
    const payload: Record<string, any> = {
      ...credentials,
      symbol: config.symbol,
      grid_size: Number(config.grid_size),
      investment_amount: Number(config.investment_amount),
      exchange: config.exchange,
    };

    // Add optional fields only if they have values (for auto mode support)
    if (config.mode) payload.mode = config.mode;
    if (config.upper_price !== undefined) payload.upper_price = Number(config.upper_price);
    if (config.lower_price !== undefined) payload.lower_price = Number(config.lower_price);
    if (config.leverage !== undefined) payload.leverage = Number(config.leverage);
    if (config.strategy_type) payload.strategy_type = config.strategy_type;
    if (config.run_hours !== undefined) payload.run_hours = Number(config.run_hours);

    if (config.run_hours !== undefined) payload.run_hours = Number(config.run_hours);

    console.log('🚀 Sending startFuturesBot payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/api/futures/start-bot', payload);
    console.log('🚀 startFuturesBot FULL response:', response);
    console.log('🚀 startFuturesBot response.data:', response.data);
    if (response.data?.meta) {
      console.log('📦 Found META object:', response.data.meta);
    } else {
      console.log('⚠️ No META object found in response.data');
    }
    return response.data;
  },

  stopFuturesBot: async (task_id: string) => {
    const response = await api.post('/api/futures/stop-bot/', { task_id });
    console.log('🛑 stopFuturesBot API response:', response.data);
    return response.data;
  },

  getSpotBots: async (active?: boolean, exchange?: string) => {
    const params: Record<string, any> = {};
    if (active !== undefined) params.active = active.toString();
    if (exchange) params.exchange = exchange;

    // Make sure this is using the real API call, not mock data
    const response = await api.get('/api/spot/bots', { params });
    return response.data;
  },

  startSpotBot: async (botConfig: {
    mode?: 'auto' | 'manual';
    symbol: string;
    grid_size: number;
    upper_price?: number;
    lower_price?: number;
    investment_amount: number;
    run_hours?: number;
    exchange: string;
    api_key?: string;
    api_secret?: string;
  }) => {
    const { api_key, api_secret, ...config } = botConfig;
    const credentials = {
      api_key: api_key || localStorage.getItem('exchange_api_key') || '',
      api_secret: api_secret || localStorage.getItem('exchange_api_secret') || ''
    };

    // Build request payload - only include fields that have values
    const payload: Record<string, any> = {
      ...credentials,
      symbol: config.symbol,
      grid_size: Number(config.grid_size),
      investment_amount: Number(config.investment_amount),
      exchange: config.exchange,
    };

    // Add optional fields only if they have values (for auto mode support)
    if (config.mode) payload.mode = config.mode;
    if (config.upper_price !== undefined) payload.upper_price = Number(config.upper_price);
    if (config.lower_price !== undefined) payload.lower_price = Number(config.lower_price);
    if (config.run_hours !== undefined) payload.run_hours = Number(config.run_hours);

    if (config.run_hours !== undefined) payload.run_hours = Number(config.run_hours);

    console.log('🚀 Sending startSpotBot payload:', JSON.stringify(payload, null, 2));
    // Use correct spot endpoint (with trailing slash for Django)
    const response = await api.post('/api/spot/start-spot/', payload);
    console.log('🚀 startSpotBot FULL response:', response);
    console.log('🚀 startSpotBot response.data:', response.data);
    if (response.data?.meta) {
      console.log('📦 Found META object:', response.data.meta);
    } else {
      console.log('⚠️ No META object found in response.data');
    }
    return response.data;
  },

  stopSpotBot: async (task_id: string) => {
    // Use correct spot stop endpoint
    const response = await api.post('/api/spot/stop-spot/', { task_id });
    console.log('🛑 stopSpotBot API response:', response.data);
    return response.data;
  },

  // Delete bot functions
  deleteFuturesBot: async (taskId: string) => {
    console.log('🗑️ Deleting futures bot:', taskId);
    // Use DELETE method with task_id in the body
    const response = await api.delete('/api/futures/delete-bot/', { data: { task_id: taskId } });
    console.log('✅ Delete futures bot response:', response.data);
    return response.data;
  },

  deleteSpotBot: async (taskId: string) => {
    console.log('🗑️ Deleting spot bot:', taskId);
    // Use DELETE method with task_id in the body
    const response = await api.delete('/api/spot/delete-spot/', { data: { task_id: taskId } });
    console.log('✅ Delete spot bot response:', response.data);
    return response.data;
  },

  // Exchange and Trading Pairs
  getExchanges: async () => {
    try {
      const response = await api.get('/api/get-exchanges');

      // Ensure the response matches the expected format
      if (Array.isArray(response.data)) {
        return response.data.map((exchange: any) => ({
          value: exchange.value || exchange.name || '',
          label: exchange.label || exchange.name || '',
          image: exchange.image || `https://cryptologos.cc/logos/${(exchange.value || exchange.name || '').toLowerCase()}-logo.png`
        }));
      }

      // Fallback to default exchanges if response format is unexpected
      console.warn('Unexpected API response format for exchanges');
      return [
        { value: 'binance', label: 'Binance', image: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
        { value: 'bybit', label: 'Bybit', image: 'https://cryptologos.cc/logos/bybit-exchange-token-bytedance-token-logo.png' },
        { value: 'bitget', label: 'Bitget', image: 'https://cryptologos.cc/logos/bitget-token-bgb-logo.png' },
      ];
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      // Return default exchanges if API fails
      return [
        { value: 'binance', label: 'Binance', image: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
        { value: 'bybit', label: 'Bybit', image: 'https://cryptologos.cc/logos/bybit-exchange-token-bytedance-token-logo.png' },
        { value: 'bitget', label: 'Bitget', image: 'https://cryptologos.cc/logos/bitget-token-bgb-logo.png' },
      ];
    }
  },

  getConnectedExchanges: async () => {
    try {
      const response = await api.get('/api/get-connected-exchanges');

      // Handle the expected response format
      if (response.data && 'exchanges' in response.data && 'count' in response.data) {
        return response.data.exchanges.map((exchange: any) => ({
          name: exchange.name || '',
          connected: exchange.connected || false,
          image: exchange.image || `https://cryptologos.cc/logos/${(exchange.name || '').toLowerCase()}-logo.png`
        }));
      }

      // Fallback if the response doesn't match the expected format
      console.warn('Unexpected API response format for connected exchanges');
      return [];

    } catch (error) {
      console.error('Error fetching connected exchanges:', error);
      // Return empty array if API fails
      return [];
    }
  },

  getPairs: async () => {
    try {
      const response = await api.get('/api/get-pairs');

      // Ensure the response matches the expected format
      if (Array.isArray(response.data)) {
        return response.data.map((pair: any) => ({
          value: pair.value || pair.symbol || '',
          label: pair.label || pair.symbol || ''
        }));
      }

      // Fallback to default pairs if response format is unexpected
      console.warn('Unexpected API response format for trading pairs');
      return [
        { value: 'BTCUSDT', label: 'BTC/USDT' },
        { value: 'ETHUSDT', label: 'ETH/USDT' },
        { value: 'BNBUSDT', label: 'BNB/USDT' },
      ];

    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      // Return default pairs if API fails
      return [
        { value: 'BTCUSDT', label: 'BTC/USDT' },
        { value: 'ETHUSDT', label: 'ETH/USDT' },
        { value: 'BNBUSDT', label: 'BNB/USDT' },
      ];
    }
  },

  getBotRunHours: async () => {
    try {
      const response = await api.get('/api/get-bot-run-hours');

      // Ensure the response matches the expected format
      if (response.data && Array.isArray(response.data.hours)) {
        return response.data.hours;
      }

      // Fallback to default hours if response format is unexpected
      console.warn('Unexpected API response format for bot run hours');
      return [24, 48, 72];

    } catch (error) {
      console.error('Error fetching bot run hours:', error);
      // Return default hours if API fails
      return [24, 48, 72];
    }
  },

  connectExchange: async (exchange: string, api_key: string, api_secret: string) => {
    // Validate input format first
    if (!api_key || !api_secret || api_key.trim().length === 0 || api_secret.trim().length === 0) {
      throw new Error('API key and secret are required');
    }

    // Basic format validation for API keys (should not look like email/password)
    if (api_key.includes('@') || api_key.includes(' ') || api_secret.includes('@') || api_secret.includes(' ')) {
      throw new Error('Invalid API key format. Please provide valid exchange API credentials, not email/password.');
    }

    // API keys should typically be longer than typical passwords
    if (api_key.length < 16 || api_secret.length < 16) {
      throw new Error('API key and secret appear to be too short. Please verify you are using exchange API credentials.');
    }

    // Function to test the connection by starting and stopping a test bot
    const testConnection = async () => {
      try {
        // Create a test bot configuration
        const testConfig = {
          exchange: exchange.toLowerCase(),
          symbol: 'BTCUSDT',
          grid_size: 5,
          upper_price: 90000,
          lower_price: 85000,
          investment_amount: 10,
          leverage: 1,
          strategy_type: 'long',
          run_hours: 1, // Minimum run time
          api_key: api_key.trim(),
          api_secret: api_secret.trim()
        };

        // Test the credentials by starting a bot
        const botResult = await apiService.startFuturesBot(testConfig);

        if (!botResult?.task_id) {
          throw new Error('Failed to start test bot - invalid response from server');
        }

        // Try to stop the test bot immediately
        try {
          await apiService.stopFuturesBot(botResult.task_id);
        } catch (stopError) {
          console.warn('Warning: Could not stop test bot:', stopError);
          // Continue even if we can't stop the bot - the main goal was to validate credentials
        }

        // Store the connection info in local storage
        const connectedExchanges = JSON.parse(localStorage.getItem('connectedExchanges') || '[]');
        const existingIndex = connectedExchanges.findIndex((ex: any) =>
          ex.name.toLowerCase() === exchange.toLowerCase()
        );

        const connectionInfo = {
          name: exchange,
          connected: true,
          api_key: api_key.trim(),
          timestamp: Date.now()
        };

        if (existingIndex >= 0) {
          connectedExchanges[existingIndex] = connectionInfo;
        } else {
          connectedExchanges.push(connectionInfo);
        }

        localStorage.setItem('connectedExchanges', JSON.stringify(connectedExchanges));

        return {
          success: true,
          message: `Successfully connected to ${exchange}`,
          exchange: connectionInfo
        };

      } catch (error: any) {
        console.error('Exchange connection test failed:', error);

        // Parse error message from API response if available
        let errorMessage = 'Failed to connect to exchange';

        if (error.response?.data) {
          const responseData = error.response.data;
          if (responseData.detail) {
            errorMessage = responseData.detail;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Provide more user-friendly error messages for common issues
        if (errorMessage.includes('API key') || errorMessage.includes('signature')) {
          errorMessage = 'Invalid API key or secret. Please verify your credentials.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('IP')) {
          errorMessage = 'API key permissions are insufficient. Please enable trading permissions and check IP restrictions.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Network error connecting to the exchange. Please check your connection and try again.';
        }

        throw new Error(errorMessage);
      }
    };

    // Try the direct connection endpoint first (in case it gets implemented in the future)
    try {
      const response = await api.post('/api/exchanges/connect', {
        exchange: exchange.toLowerCase(),
        api_key: api_key.trim(),
        api_secret: api_secret.trim()
      });

      // If we get here, the endpoint worked (not expected with current backend)
      console.log('Direct connection endpoint is available');
      return response.data;

    } catch (error: any) {
      // If it's a 404, fall back to our test connection method
      if (error.response?.status === 404) {
        console.log('Direct connection endpoint not available, using test connection method');
        return testConnection();
      }

      // For other errors, log them and try the test connection as a fallback
      console.warn('Direct connection failed, falling back to test connection:', error);
      return testConnection();
    }
  }, subscribe: async (subscription_slug: string) => {
    const response = await api.post('/api/subscriptions/subscribe/', { subscription_slug });
    return response.data;
  },

  // Add new method for getting subscription status if needed
  getSubscriptionStatus: async () => {
    const response = await api.get('/api/subscriptions/status/');
    return response.data;
  },

  // Add method to resend invoice if needed
  resendInvoice: async () => {
    const response = await api.post('/api/subscriptions/resend-invoice/');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/api/subscriptions/cancel/');
    return response.data;
  }
};

// Mock API functions for fallback/development
// Mock API functions for fallback/development
export const mockApi = {
  login: async (email: string) => {
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

  signup: async (email: string, username: string) => {
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