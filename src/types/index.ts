export interface User {
  id: string;
  username: string;
  email: string;
  subscription_tier: 'starter' | 'advanced' | 'pro';
  created_at: string;
  is_verified?: boolean;
}

export interface Exchange {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'pending';
  supported_pairs: string[];
}

export interface TradingBot {
  id: string;
  name: string;
  type: 'spot' | 'futures';
  exchange: string;
  pair: string;
  status: 'active' | 'inactive' | 'paused';
  profit_loss: number;
  created_at: string;
  task_id?: string;
  grid_parameters?: {
    min_price: number;
    max_price: number;
    grid_count: number;
    investment_per_grid: number;
  };
}

export interface AuthState {
  setUser: any;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  needsVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  verifyEmail: (email: string, otp_code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export interface DashboardStats {
  active_bots: number;
  total_profit: number;
  connected_exchanges: number;
  subscription_tier: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BotConfig {
  api_key: string;
  api_secret: string;
  symbol: string;
  grid_size: number;
  upper_price: number;
  lower_price: number;
  investment_amount: number;
  run_hours: number;
  exchange: string;
  leverage?: number;
  strategy_type?: string;
}