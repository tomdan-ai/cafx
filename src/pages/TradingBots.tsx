import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiService } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Play, Pause, Square, Plus, TrendingUp, TrendingDown, Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

interface TradingBot {
  id: string;
  name: string;
  type: 'spot' | 'futures';
  exchange: string;
  pair: string;
  status: 'active' | 'inactive' | 'paused';
  profit_loss: number;
  created_at: string;
  task_id?: string;
}

interface SupportedExchange {
  value: string;
  label: string;
  image?: string;
}

export const TradingBots: React.FC = () => {
  const navigate = useNavigate();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [supportedExchanges, setSupportedExchanges] = useState<SupportedExchange[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);
  const [runHours, setRunHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'spot' | 'futures'>('all');
  const [creating, setCreating] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [gridSizeError, setGridSizeError] = useState('');

  const [botForm, setBotForm] = useState({
    name: '',
    mode: 'manual' as 'auto' | 'manual',
    type: 'spot' as 'spot' | 'futures',
    exchange: '',
    api_key: '',
    api_secret: '',
    symbol: '',
    grid_size: '',
    upper_price: '',
    lower_price: '',
    investment_amount: '',
    run_hours: '',
    leverage: '',
    strategy_type: 'long'
  });

  const handleGridSizeChange = (value: string) => {
    setBotForm({ ...botForm, grid_size: value });
    const n = parseInt(value || '0', 10);
    if (!value) {
      setGridSizeError('');
      return;
    }
    if (isNaN(n) || n <= 0) {
      setGridSizeError('Please enter a valid number');
    } else if (n > 50) {
      setGridSizeError('Grid size must be 50 or less');
    } else {
      setGridSizeError('');
    }
  };

  const normalizeBot = (bot: any, type: 'spot' | 'futures') => ({
    id: bot.id ?? bot.pk ?? bot._id ?? String(bot.task_id || bot.taskId || Math.random()),
    name: bot.name || bot.pair || `${type.toUpperCase()} Bot`,
    type,
    exchange: bot.exchange || bot.exchange_name || bot.exchange_id || 'Unknown',
    pair: bot.pair || bot.symbol || bot.pair_symbol || '',
    status: bot.is_running || bot.status === 'running' || bot.status === 'active' ? 'active' : 'inactive',
    profit_loss: bot.profit_loss ?? bot.profit ?? 0,
    created_at: bot.date_created || bot.created_at || bot.created || new Date().toISOString(),
    task_id: bot.task_id || bot.taskId || bot.task || undefined,
    __raw: bot
  });

  const authUser = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch only the authenticated user's bots using the spot/futures endpoints
        const [spotBotsResponse, futuresBotsResponse, supportedExchangesResponse, pairsResponse, runHoursResponse] = await Promise.all([
          apiService.getSpotBots(),
          apiService.getFuturesBots(),
          apiService.getExchanges(),
          apiService.getPairs(),
          apiService.getBotRunHours()
        ]);

        const futuresBots = Array.isArray(futuresBotsResponse) ? futuresBotsResponse.map((b: any) => normalizeBot(b, 'futures')) : [];
        const spotBots = Array.isArray(spotBotsResponse) ? spotBotsResponse.map((b: any) => normalizeBot(b, 'spot')) : [];

        // API endpoints now properly scope to user, so we can directly combine the bots
        const combined = [...futuresBots, ...spotBots];
        setBots(combined as unknown as TradingBot[]);

        setSupportedExchanges(supportedExchangesResponse || []);
        setPairs(Array.isArray(pairsResponse) ? pairsResponse : []);
        setRunHours(Array.isArray(runHoursResponse) ? runHoursResponse : [24, 48, 72, 168]);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast.error(getErrorMessage(error, 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  const filteredBots = bots.filter(bot => {
    if (activeTab === 'all') return true;
    return bot.type === activeTab;
  }).filter(bot => bot.type);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate API credentials
    if (!botForm.api_key.trim() || !botForm.api_secret.trim()) {
      toast.error('Please provide both API key and secret');
      return;
    }

    // Validate API key format
    if (botForm.api_key.includes('@') || botForm.api_key.length < 16) {
      toast.error('Please enter a valid exchange API key (not email/password)');
      return;
    }

    if (botForm.api_secret.includes('@') || botForm.api_secret.length < 16) {
      toast.error('Please enter a valid exchange API secret');
      return;
    }

    // Validate symbol selection
    if (!botForm.symbol.trim()) {
      toast.error('Please select a trading pair');
      return;
    }

    // Validate grid size for both modes
    if (!botForm.grid_size.trim()) {
      toast.error('Please specify grid size');
      return;
    }

    const gridSize = parseInt(botForm.grid_size);
    if (isNaN(gridSize) || gridSize <= 0) {
      toast.error('Please enter a valid grid size');
      return;
    }

    if (gridSize > 50) {
      toast.error('Grid size must be 50 or less');
      return;
    }

    setCreating(true);

    try {
      let botConfig: any;

      if (botForm.mode === 'auto') {
        // Auto mode - AI handles most parameters but user controls grid size and trading pair
        // No duration specified - bot runs continuously until manually stopped
        botConfig = {
          mode: 'auto',
          symbol: botForm.symbol,
          grid_size: gridSize, // User-controlled grid size
          exchange: botForm.exchange,
          investment_amount: parseFloat(botForm.investment_amount),
          api_key: botForm.api_key.trim(),
          api_secret: botForm.api_secret.trim(),
        };

        if (botForm.type === 'futures') {
          // Only include leverage if it's provided and valid
          if (botForm.leverage && botForm.leverage.trim() !== '') {
            const leverageValue = parseInt(botForm.leverage);
            if (!isNaN(leverageValue) && leverageValue >= 1) {
              botConfig.leverage = leverageValue;
            }
          }
          // Strategy type is auto-decided by the bot based on market analysis
        }
      } else {
        // Manual mode - full config
        botConfig = {
          mode: 'manual',
          symbol: botForm.symbol,
          grid_size: gridSize,
          upper_price: parseFloat(botForm.upper_price),
          lower_price: parseFloat(botForm.lower_price),
          investment_amount: parseFloat(botForm.investment_amount),
          run_hours: parseInt(botForm.run_hours),
          exchange: botForm.exchange,
          api_key: botForm.api_key.trim(),
          api_secret: botForm.api_secret.trim(),
        };

        if (botForm.type === 'futures') {
          // Only include leverage if it's provided and valid
          // If not provided, backend will decide automatically
          if (botForm.leverage && botForm.leverage.trim() !== '') {
            const leverageValue = parseInt(botForm.leverage);
            if (!isNaN(leverageValue) && leverageValue >= 1) {
              botConfig.leverage = leverageValue;
            }
          }
          // Strategy type is auto-decided by the bot based on market analysis
        }
      }

      if (botForm.type === 'futures') {
        await apiService.startFuturesBot(botConfig);
      } else {
        await apiService.startSpotBot(botConfig);
      }

      // Refresh bots list (user scoped)
      const [refreshedSpot, refreshedFutures] = await Promise.all([
        apiService.getSpotBots(),
        apiService.getFuturesBots(),
      ]);
      const refreshed = [
        ...(Array.isArray(refreshedFutures) ? refreshedFutures.map((b: any) => normalizeBot(b, 'futures')) : []),
        ...(Array.isArray(refreshedSpot) ? refreshedSpot.map((b: any) => normalizeBot(b, 'spot')) : [])
      ];
      setBots(refreshed as unknown as TradingBot[]);

      setShowModal(false);
      setBotForm({
        name: '',
        mode: 'manual',
        type: 'spot',
        exchange: '',
        api_key: '',
        api_secret: '',
        symbol: '',
        grid_size: '',
        upper_price: '',
        lower_price: '',
        investment_amount: '',
        run_hours: '',
        leverage: '',
        strategy_type: 'long'
      });

      toast.success('Bot created and started successfully!');
    } catch (error: any) {
      const status = error.response?.status;
      const detail = (error.response?.data?.detail || error.response?.data?.message || '').toString();

      // Enhanced error handling with better user guidance
      if (status === 403 && detail.toLowerCase().includes('subscription')) {
        const prompt = `${detail}\n\nOpen subscription page to upgrade/manage?`;
        if (window.confirm(prompt)) {
          navigate('/subscription');
        } else {
          toast.error(getErrorMessage(error, detail || 'Action not allowed'));
        }
      } else if (status === 400) {
        // Handle validation errors better
        toast.error(getErrorMessage(error, 'Please check your input values'));
      } else if (status === 401) {
        toast.error('Invalid API credentials. Please check your exchange API key and secret.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again in a moment.');
      } else {
        toast.error(getErrorMessage(error, 'Failed to create bot'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStopBot = async (bot: TradingBot) => {
    if (!bot.task_id) {
      toast.error('No task ID found for this bot');
      return;
    }

    try {
      if (bot.type === 'futures') {
        await apiService.stopFuturesBot(bot.task_id);
      } else {
        await apiService.stopSpotBot(bot.task_id);
      }

      // Refresh bots list (user scoped)
      const [refreshedSpot2, refreshedFutures2] = await Promise.all([
        apiService.getSpotBots(),
        apiService.getFuturesBots(),
      ]);
      const refreshed2 = [
        ...(Array.isArray(refreshedFutures2) ? refreshedFutures2.map((b: any) => normalizeBot(b, 'futures')) : []),
        ...(Array.isArray(refreshedSpot2) ? refreshedSpot2.map((b: any) => normalizeBot(b, 'spot')) : [])
      ];
      setBots(refreshed2 as unknown as TradingBot[]);

      toast.success('Bot stopped successfully!');
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to stop bot'));
    }
  };

  const getStatusIcon = (status: TradingBot['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'inactive':
        return <Square className="w-4 h-4 text-red-400" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-500 animate-spin animation-delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative min-h-screen">
      {/* Background MERLIN logo - very subtle */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative">
          <img
            src="/MERLIN.png"
            alt="Background"
            className="w-96 h-96 opacity-5 animate-spin-slow object-contain"
            style={{
              animation: 'spin 20s linear infinite, bounce 3s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Trading Bots</h1>
            <p className="text-lg text-gray-400 mt-2">
              Manage your automated trading strategies
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Bot</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {['all', 'spot', 'futures'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <Card key={bot.id} hover glow className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <img src="/MERLIN.png" alt="Trading Bot" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{bot.name || `${bot.pair || 'Unknown'} Bot`}</h3>
                    <p className="text-sm text-gray-400">{bot.exchange || 'Unknown'} • {bot.pair || 'Unknown'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${bot.type === 'spot' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                  {bot.type?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(bot.status)}
                    <span className="text-sm text-white capitalize">{bot.status || 'unknown'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">P&L</span>
                  <div className="flex items-center space-x-1">
                    {(bot.profit_loss ?? 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${(bot.profit_loss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                      ${(bot.profit_loss ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  {bot.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleStopBot(bot)}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Bot Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Trading Bot"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateBot} className="space-y-6">
            {/* Bot Mode and Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Bot Mode</label>
                <select
                  value={botForm.mode}
                  onChange={(e) => setBotForm({ ...botForm, mode: e.target.value as 'auto' | 'manual' })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="manual">Manual Mode</option>
                  <option value="auto">Auto Mode</option>
                </select>
                <p className="text-xs text-gray-400">
                  {botForm.mode === 'auto'
                    ? 'AI will handle all trading parameters automatically'
                    : 'Configure all trading parameters manually'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Bot Type</label>
                <select
                  value={botForm.type}
                  onChange={(e) => setBotForm({ ...botForm, type: e.target.value as 'spot' | 'futures' })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="spot">Spot Trading</option>
                  <option value="futures">Futures Trading</option>
                </select>
              </div>
            </div>

            {/* Exchange Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Exchange</label>
              <select
                value={botForm.exchange}
                onChange={(e) => setBotForm({ ...botForm, exchange: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select Exchange</option>
                {supportedExchanges.map((exchange) => (
                  <option key={exchange.value} value={exchange.value}>
                    {exchange.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Credentials Section */}
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-yellow-400 text-xs font-bold">!</span>
                  </div>
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">Exchange API Credentials Required</p>
                    <p className="text-xs text-yellow-300/80">
                      Enter your exchange API key and secret. These credentials are used only for this bot and are not stored permanently.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="API Key"
                type="text"
                value={botForm.api_key}
                onChange={(e) => setBotForm({ ...botForm, api_key: e.target.value })}
                placeholder="Enter your exchange API key"
                icon={<Key className="w-5 h-5 text-gray-400" />}
                required
              />
              {botForm.api_key && (botForm.api_key.includes('@') || botForm.api_key.length < 16) && (
                <p className="text-red-400 text-xs mt-1">
                  ⚠️ This doesn't look like a valid API key. Please use your exchange API credentials.
                </p>
              )}

              <div className="relative">
                <Input
                  label="API Secret"
                  type={showApiSecret ? "text" : "password"}
                  value={botForm.api_secret}
                  onChange={(e) => setBotForm({ ...botForm, api_secret: e.target.value })}
                  placeholder="Enter your exchange API secret"
                  icon={<Key className="w-5 h-5 text-gray-400" />}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {botForm.api_secret && (botForm.api_secret.includes('@') || botForm.api_secret.length < 16) && (
                <p className="text-red-400 text-xs mt-1">
                  ⚠️ This doesn't look like a valid API secret. Please use your exchange API credentials.
                </p>
              )}
            </div>

            {/* Bot Name */}
            <Input
              label="Bot Name (Optional)"
              type="text"
              value={botForm.name}
              onChange={(e) => setBotForm({ ...botForm, name: e.target.value })}
              placeholder="Enter a name for your bot"
            />

            {/* Auto Mode Notice */}
            {botForm.mode === 'auto' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <img src="/MERLIN.png" alt="AI Mode" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">AI Auto Mode Enabled</h4>
                    <p className="text-xs text-gray-300">
                      MERLIN AI will automatically optimize price ranges and execution parameters.
                      You control the trading pair and grid size based on your risk preference.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Mode Controls */}
            {botForm.mode === 'auto' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Trading Pair</label>
                    <select
                      value={botForm.symbol}
                      onChange={(e) => setBotForm({ ...botForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select Pair</option>
                      {pairs.map((pair) => (
                        <option key={pair.value} value={pair.value}>
                          {pair.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400">
                      Choose the trading pair for AI optimization
                    </p>
                  </div>

                  <div>
                    <Input
                      label="Grid Size"
                      type="number"
                      value={botForm.grid_size}
                      onChange={(e) => handleGridSizeChange(e.target.value)}
                      placeholder="Number of grids"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Controls risk and leverage. Higher grid = lower leverage, safer trading (max 50)
                    </p>
                    {gridSizeError && (
                      <p className="text-xs text-red-400 mt-1">{gridSizeError}</p>
                    )}
                  </div>
                </div>

                {/* Futures-specific fields for Auto Mode */}
                {botForm.type === 'futures' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Input
                        label="Leverage (Optional)"
                        type="number"
                        min="1"
                        value={botForm.leverage}
                        onChange={(e) => setBotForm({ ...botForm, leverage: e.target.value })}
                        placeholder="Leave empty for auto"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to let AI decide, or enter a value ≥ 1
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-xs text-purple-300">
                        <span className="font-medium">🤖 Auto Strategy:</span> The bot will automatically determine the optimal position direction (Long/Short) based on real-time market analysis.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Manual Mode Fields */}
            {botForm.mode === 'manual' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Trading Pair</label>
                    <select
                      value={botForm.symbol}
                      onChange={(e) => setBotForm({ ...botForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select Pair</option>
                      {pairs.map((pair) => (
                        <option key={pair.value} value={pair.value}>
                          {pair.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Grid Size"
                      type="number"
                      value={botForm.grid_size}
                      onChange={(e) => handleGridSizeChange(e.target.value)}
                      placeholder="Number of grids"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Specify number of grid levels (max 50).</p>
                    {gridSizeError && (
                      <p className="text-xs text-red-400 mt-1">{gridSizeError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Lower Price"
                    type="number"
                    step="0.01"
                    value={botForm.lower_price}
                    onChange={(e) => setBotForm({ ...botForm, lower_price: e.target.value })}
                    placeholder="Minimum price"
                    required
                  />
                  <Input
                    label="Upper Price"
                    type="number"
                    step="0.01"
                    value={botForm.upper_price}
                    onChange={(e) => setBotForm({ ...botForm, upper_price: e.target.value })}
                    placeholder="Maximum price"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Run Hours</label>
                  <select
                    value={botForm.run_hours}
                    onChange={(e) => setBotForm({ ...botForm, run_hours: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Duration</option>
                    {Array.isArray(runHours) && runHours.length > 0 ? (
                      runHours.map((hour) => (
                        <option key={hour.toString()} value={hour}>
                          {hour} hours
                        </option>
                      ))
                    ) : (
                      [24, 48, 72, 168].map((hour) => (
                        <option key={hour.toString()} value={hour}>
                          {hour} hours
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Futures-specific fields */}
                {botForm.type === 'futures' && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Leverage (Optional)"
                        type="number"
                        min="1"
                        value={botForm.leverage}
                        onChange={(e) => setBotForm({ ...botForm, leverage: e.target.value })}
                        placeholder="Leave empty for auto"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to let AI decide, or enter a value ≥ 1
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-xs text-purple-300">
                        <span className="font-medium">🤖 Auto Strategy:</span> The bot will automatically determine the optimal position direction (Long/Short) based on real-time market analysis.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Investment Amount - Always visible */}
            <Input
              label="Investment Amount"
              type="number"
              step="0.01"
              value={botForm.investment_amount}
              onChange={(e) => setBotForm({ ...botForm, investment_amount: e.target.value })}
              placeholder="Investment amount"
              required
            />

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={creating}
                disabled={!!gridSizeError}
                className="flex-1"
              >
                {creating ? 'Creating...' : `Create ${botForm.mode === 'auto' ? 'AI' : 'Manual'} Bot`}
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
      `}</style>
    </div>
  );
};