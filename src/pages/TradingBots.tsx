import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { PairSelector } from '../components/ui/PairSelector';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { BotDetailsModal } from '../components/dashboard/BotDetailsModal';
import { GridPreview } from '../components/dashboard/GridPriceVisualization';
import { PriceChart } from '../components/ui/PriceChart';
import { apiService } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Plus, TrendingUp, TrendingDown, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, isAuthError, isPermissionError, isValidationError, isServerError } from '../utils/errorUtils';
import { saveBotConfig, deleteBotConfig, hideBot, isBotHidden, cleanupHiddenBots } from '../utils/botStorage';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [supportedExchanges, setSupportedExchanges] = useState<SupportedExchange[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);
  const [runHours, setRunHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(searchParams.get('create') === 'true');
  const [activeTab, setActiveTab] = useState<'all' | 'spot' | 'futures'>('all');
  const [creating, setCreating] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [gridSizeError, setGridSizeError] = useState('');
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [botToDelete, setBotToDelete] = useState<TradingBot | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Minimum investment state
  const [minInvestment, setMinInvestment] = useState<{ amount: string; currency: string } | null>(null);
  const [minInvestmentLoading, setMinInvestmentLoading] = useState(false);
  const [minInvestmentError, setMinInvestmentError] = useState('');

  // Bot termination lock - tracks which bots are currently being stopped
  const [stoppingBots, setStoppingBots] = useState<Set<string>>(new Set());

  const [botForm, setBotForm] = useState({
    name: '',
    mode: 'auto' as 'auto' | 'manual',
    type: 'futures' as 'spot' | 'futures',
    exchange: '',
    api_key: '',
    api_secret: '',
    symbol: '',
    grid_size: '5',
    upper_price: '',
    lower_price: '',
    investment_amount: '',
    run_hours: '24',
    leverage: '5',
    strategy_type: 'long',
    loss_threshold: '10',
    acceptable_loss_per_grid: '1.5',
    enable_grid_stop_loss: true
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

  // Fetch minimum investment whenever pair, grid size, exchange, or leverage changes
  useEffect(() => {
    const fetchMinInvestment = async () => {
      // Need at least exchange, symbol, and valid grid_size
      if (!botForm.exchange || !botForm.symbol || !botForm.grid_size) {
        setMinInvestment(null);
        setMinInvestmentError('');
        return;
      }

      const gridSize = parseInt(botForm.grid_size);
      if (isNaN(gridSize) || gridSize <= 0 || gridSize > 50) {
        setMinInvestment(null);
        return;
      }

      setMinInvestmentLoading(true);
      setMinInvestmentError('');

      try {
        const result = await apiService.getMinInvestment({
          exchange: botForm.exchange,
          symbol: botForm.symbol,
          grid_size: gridSize,
          leverage: botForm.type === 'futures' ? parseInt(botForm.leverage) || 1 : undefined,
        });
        setMinInvestment({ amount: result.min_investment, currency: result.currency });
      } catch (error: any) {
        console.warn('Failed to fetch min investment:', error);
        setMinInvestmentError('Could not calculate minimum investment');
        setMinInvestment(null);
      } finally {
        setMinInvestmentLoading(false);
      }
    };

    // Debounce the API call
    const timer = setTimeout(fetchMinInvestment, 500);
    return () => clearTimeout(timer);
  }, [botForm.exchange, botForm.symbol, botForm.grid_size, botForm.leverage, botForm.type]);

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
    meta: bot.meta || [], // Store meta data
    __raw: bot
  });

  const authUser = useAuthStore(state => state.user);

  // Clear URL param after modal state is initialized
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch only the authenticated user's bots using the unified endpoint
        const [botsResponse, supportedExchangesResponse, pairsResponse, runHoursResponse] = await Promise.all([
          apiService.getAllBots(), // Use unified endpoint which returns { futures: [], spot: [] }
          apiService.getExchanges(),
          apiService.getPairs(),
          apiService.getBotRunHours()
        ]);

        const futuresBots = Array.isArray(botsResponse.futures)
          ? botsResponse.futures.map((b: any) => normalizeBot(b, 'futures'))
          : [];
        const spotBots = Array.isArray(botsResponse.spot)
          ? botsResponse.spot.map((b: any) => normalizeBot(b, 'spot'))
          : [];

        // Clean up old hidden bots periodically
        cleanupHiddenBots();

        // Filter out hidden/deleted bots that the user has previously removed
        const combined = [...futuresBots, ...spotBots].filter((bot: any) =>
          !isBotHidden(String(bot.id), bot.task_id)
        );

        setBots(combined as unknown as TradingBot[]);

        setSupportedExchanges(supportedExchangesResponse || []);
        setPairs(Array.isArray(pairsResponse) ? pairsResponse : []);
        setRunHours(Array.isArray(runHoursResponse) ? runHoursResponse : [24, 48, 72, 168]);
      } catch (error: any) {

        if (isAuthError(error)) {
          toast.error('Session expired. Please log in again.');
          setTimeout(() => navigate('/auth/login'), 2000);
        } else if (isServerError(error)) {
          toast.error('Unable to load bots. Please refresh the page.');
        } else {
          const message = getErrorMessage(error, 'Failed to load data. Please refresh the page.');
          toast.error(message);
        }
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

    // Validate investment amount against minimum
    if (minInvestment) {
      const minAmount = parseFloat(minInvestment.amount);
      const investmentAmount = parseFloat(botForm.investment_amount);
      if (!isNaN(minAmount) && !isNaN(investmentAmount) && investmentAmount < minAmount) {
        toast.error(`Investment amount must be at least ${minAmount} ${minInvestment.currency} for ${botForm.grid_size} grids on this pair`);
        return;
      }
    }

    setCreating(true);

    try {
      let botConfig: any;

      if (botForm.mode === 'auto') {
        // Auto mode - AI handles price ranges but user controls duration, grid size and trading pair
        botConfig = {
          mode: 'auto',
          symbol: botForm.symbol,
          grid_size: gridSize,
          upper_price: parseFloat(botForm.upper_price) || 0,
          lower_price: parseFloat(botForm.lower_price) || 0,
          exchange: botForm.exchange,
          investment_amount: parseFloat(botForm.investment_amount),
          run_hours: parseInt(botForm.run_hours),
          api_key: botForm.api_key.trim(),
          api_secret: botForm.api_secret.trim(),
          leverage: parseInt(botForm.leverage) || 5,
          strategy_type: botForm.strategy_type,
          loss_threshold: parseFloat(botForm.loss_threshold) || 10,
          acceptable_loss_per_grid: parseFloat(botForm.acceptable_loss_per_grid) || 1.5,
          enable_grid_stop_loss: botForm.enable_grid_stop_loss
        };
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
          leverage: parseInt(botForm.leverage) || 5,
          strategy_type: botForm.strategy_type,
          loss_threshold: parseFloat(botForm.loss_threshold) || 10,
          acceptable_loss_per_grid: parseFloat(botForm.acceptable_loss_per_grid) || 1.5,
          enable_grid_stop_loss: botForm.enable_grid_stop_loss
        };
      }

      console.log('🛠️ handleCreateBot - Prepared botConfig:', botConfig);

      if (botForm.type === 'futures') {
        const response = await apiService.startFuturesBot(botConfig);

        console.log('🚀 Futures bot created - API response:', response);
        console.log('📝 Form values - mode:', botForm.mode, 'run_hours:', botForm.run_hours);

        // Save complete bot details from API response to localStorage
        if (response && response.bot_id) {
          const configToSave = {
            bot_id: String(response.bot_id),
            task_id: response.task_id || response.task || '',
            name: botForm.name || response.name || `${botForm.symbol} Bot`,
            mode: botForm.mode, // Always use form value
            type: 'futures' as const,
            exchange: response.exchange || botForm.exchange,
            symbol: response.symbol || botForm.symbol,
            grid_size: response.grid_size || gridSize,
            upper_price: response.upper_price || botConfig.upper_price,
            lower_price: response.lower_price || botConfig.lower_price,
            investment_amount: response.investment_amount || parseFloat(botForm.investment_amount),
            run_hours: parseInt(botForm.run_hours), // Always use form value
            leverage: response.leverage || botConfig.leverage,
            strategy_type: response.strategy_type || botConfig.strategy_type,
            created_at: response.date_created || response.created_at || new Date().toISOString(),
            api_response: response
          };
          console.log('💾 Saving config to localStorage:', configToSave);
          saveBotConfig(configToSave);
        }
      } else {
        const response = await apiService.startSpotBot(botConfig);

        console.log('🚀 Spot bot created - API response:', response);
        console.log('📝 Form values - mode:', botForm.mode, 'run_hours:', botForm.run_hours);

        // Save complete bot details from API response to localStorage
        if (response && response.bot_id) {
          const configToSave = {
            bot_id: String(response.bot_id),
            task_id: response.task_id || response.task || '',
            name: botForm.name || response.name || `${botForm.symbol} Bot`,
            mode: botForm.mode, // Always use form value
            type: 'spot' as const,
            exchange: response.exchange || botForm.exchange,
            symbol: response.symbol || botForm.symbol,
            grid_size: response.grid_size || gridSize,
            upper_price: response.upper_price || botConfig.upper_price,
            lower_price: response.lower_price || botConfig.lower_price,
            investment_amount: response.investment_amount || parseFloat(botForm.investment_amount),
            run_hours: parseInt(botForm.run_hours), // Always use form value
            created_at: response.date_created || response.created_at || new Date().toISOString(),
            api_response: response
          };
          console.log('💾 Saving config to localStorage:', configToSave);
          saveBotConfig(configToSave);
        }
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
        mode: 'auto',
        type: 'futures',
        exchange: '',
        api_key: '',
        api_secret: '',
        symbol: '',
        grid_size: '5',
        upper_price: '',
        lower_price: '',
        investment_amount: '',
        run_hours: '24',
        leverage: '5',
        strategy_type: 'long',
        loss_threshold: '10',
        acceptable_loss_per_grid: '1.5',
        enable_grid_stop_loss: true
      });

      toast.success('Bot created and started successfully!');
    } catch (error: any) {

      // Enhanced error handling with better user guidance
      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => navigate('/auth/login'), 2000);
      } else if (isPermissionError(error)) {
        const message = getErrorMessage(error);
        if (message.toLowerCase().includes('subscription')) {
          const confirmUpgrade = window.confirm(
            `${message}\n\nWould you like to upgrade your subscription?`
          );
          if (confirmUpgrade) {
            navigate('/subscription');
          }
        } else {
          toast.error(message);
        }
      } else if (isValidationError(error)) {
        const message = getErrorMessage(error);
        toast.error(message, { duration: 5000 });
      } else if (isServerError(error)) {
        toast.error('Server error. Our team has been notified. Please try again in a moment.');
      } else {
        const message = getErrorMessage(error, 'Failed to create bot. Please check your settings and try again.');
        toast.error(message, { duration: 4000 });
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

    const botKey = String(bot.id);

    // Check if bot is already being stopped (lock check)
    if (stoppingBots.has(botKey)) {
      toast('Bot is already being stopped, please wait...', { icon: '⏳' });
      return;
    }

    // Acquire lock - mark bot as stopping
    setStoppingBots(prev => new Set(prev).add(botKey));

    try {
      toast('Stopping bot...', { icon: '🛑', duration: 2000 });

      if (bot.type === 'futures') {
        await apiService.stopFuturesBot(bot.task_id);

        // Poll for termination confirmation (up to 15 seconds)
        let confirmed = false;
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            const status = await apiService.getFuturesBotStatus(bot.id);
            if (!status.is_running) {
              confirmed = true;
              break;
            }
          } catch {
            // Status endpoint might fail, that's ok
            break;
          }
        }

        if (confirmed) {
          console.log('✅ Bot stop confirmed via polling');
        }
      } else {
        await apiService.stopSpotBot(bot.task_id);
        // Wait a moment for the backend to process the stop
        await new Promise(resolve => setTimeout(resolve, 2000));
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

      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
      } else if (isPermissionError(error)) {
        toast.error('You do not have permission to stop this bot.');
      } else {
        const message = getErrorMessage(error, 'Failed to stop bot. Please try again.');
        toast.error(message);
      }
    } finally {
      // Release lock - remove bot from stopping set
      setStoppingBots(prev => {
        const next = new Set(prev);
        next.delete(botKey);
        return next;
      });
    }
  };

  const handleViewDetails = (bot: TradingBot) => {
    setSelectedBot(bot);
    setShowDetailsModal(true);
  };


  const handleDeleteBot = async (bot: TradingBot) => {
    setBotToDelete(bot);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBot = async () => {
    if (!botToDelete) {
      toast.error('Cannot delete bot: No bot selected');
      setShowDeleteConfirm(false);
      return;
    }

    const botKey = String(botToDelete.id);

    // Check if bot is already being stopped (lock check)
    if (stoppingBots.has(botKey)) {
      toast('Bot is already being stopped, please wait...', { icon: '⏳' });
      return;
    }

    setDeleting(true);
    // Acquire lock
    setStoppingBots(prev => new Set(prev).add(botKey));

    try {
      console.log('🗑️ Deleting bot:', botToDelete.id, botToDelete.task_id);

      // Stop the bot if it has a task_id (running bot)
      if (botToDelete.task_id) {
        try {
          if (botToDelete.type === 'futures') {
            await apiService.stopFuturesBot(botToDelete.task_id);
          } else {
            await apiService.stopSpotBot(botToDelete.task_id);
          }
          // Wait for backend to process the stop before deleting
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('✅ Bot stopped successfully');
        } catch (stopError: any) {
          // Continue even if stop fails (bot might already be stopped)
          console.log('⚠️ Stop error (continuing):', stopError.response?.status);
        }
      }

      // For futures bots, call the backend API to delete
      if (botToDelete.type === 'futures') {
        if (!botToDelete.task_id) {
          toast.error('Cannot delete: Missing task ID');
          return;
        }

        await apiService.deleteFuturesBot(botToDelete.task_id);

        // Also cleanup local storage just in case
        deleteBotConfig(String(botToDelete.id));
        if (botToDelete.task_id) {
          deleteBotConfig(botToDelete.task_id);
        }

        // We don't need to hide futures bots anymore as they are permanently deleted from backend
      } else {
        // For spot bots, call the backend API to delete if we have a task_id
        if (botToDelete.task_id) {
          await apiService.deleteSpotBot(botToDelete.task_id);
        } else {
          // If no task_id (e.g. old bot or error state), just hide it
          hideBot(String(botToDelete.id), botToDelete.task_id);
        }

        // Always cleanup local storage
        deleteBotConfig(String(botToDelete.id));
        if (botToDelete.task_id) {
          deleteBotConfig(botToDelete.task_id);
        }
      }

      // Remove from local state immediately
      setBots(prevBots => prevBots.filter(b => b.id !== botToDelete.id && b.task_id !== botToDelete.task_id));

      toast.success('Bot deleted successfully!');
      setShowDeleteConfirm(false);
      setBotToDelete(null);
    } catch (error: any) {
      console.log('❌ Delete error:', error.response?.status, error.response?.data);

      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
      } else {
        const message = getErrorMessage(error, 'Failed to delete bot.');
        toast.error(message);
      }
    } finally {
      setDeleting(false);
      // Release lock
      if (botToDelete) {
        setStoppingBots(prev => {
          const next = new Set(prev);
          next.delete(String(botToDelete.id));
          return next;
        });
      }
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loader-premium" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading Bots</h1>
          <p className="text-gray-500 mt-1">
            Manage your automated trading strategies
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        {['all', 'spot', 'futures'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Bots Grid */}
      {filteredBots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBots.map((bot) => (
            <div
              key={bot.id}
              className={`bot-card ${bot.status === 'active' ? 'bot-card-active' : 'bot-card-inactive'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center">
                    <img src="/MERLIN.png" alt="Bot" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{bot.name || `${bot.pair || 'Unknown'} Bot`}</h3>
                    <p className="text-sm text-gray-500">{bot.exchange || 'Unknown'} • {bot.pair || 'Unknown'}</p>
                  </div>
                </div>
                <span className={`bot-type-badge ${bot.type === 'spot' ? 'bot-type-spot' : 'bot-type-futures'}`}>
                  {bot.type?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`status-dot ${bot.status === 'active' ? 'status-dot-active' : 'status-dot-inactive'}`} />
                    <span className="text-sm text-white capitalize">{bot.status || 'unknown'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">P&L</span>
                  <div className="flex items-center gap-1.5">
                    {(bot.profit_loss ?? 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />
                    )}
                    <span className={`text-sm font-semibold ${(bot.profit_loss ?? 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                      ${(bot.profit_loss ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(bot)}
                  >
                    View Details
                  </Button>
                  {bot.status === 'active' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStopBot(bot)}
                      disabled={stoppingBots.has(String(bot.id))}
                    >
                      {stoppingBots.has(String(bot.id)) ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Stopping
                        </span>
                      ) : (
                        'Stop'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBot(bot)}
                      title="Delete inactive bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <img src="/MERLIN.png" alt="No bots" className="w-8 h-8 object-contain" />
          </div>
          <h3 className="empty-state-title">No Bots Yet</h3>
          <p className="empty-state-description">
            Create your first trading bot to get started with automated trading
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Bot
          </Button>
        </div>
      )}

      {/* Bot Details Modal */}
      {selectedBot && (
        <BotDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBot(null);
          }}
          bot={selectedBot}
          onStopBot={async () => {
            await handleStopBot(selectedBot);
          }}
          onDeleteBot={() => handleDeleteBot(selectedBot)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBotToDelete(null);
        }}
        onConfirm={confirmDeleteBot}
        title="Remove Bot"
        message={`Are you sure you want to remove "${botToDelete?.name || botToDelete?.pair || 'this bot'}"? This will stop the bot and remove it from your list.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

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
                <PairSelector
                  pairs={pairs}
                  selectedPair={botForm.symbol}
                  onSelect={(pair) => setBotForm({ ...botForm, symbol: pair })}
                />

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

              {/* Price Chart - Auto Mode */}
              {botForm.symbol && (
                <div className="bg-[var(--color-surface-dark)] rounded-xl p-4">
                  <PriceChart
                    symbol={botForm.symbol}
                    height={140}
                    showToggle={true}
                    showStats={true}
                  />
                </div>
              )}

              {/* Run Hours - for Auto Mode */}
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
                <p className="text-xs text-gray-400">
                  How long the bot should run before automatically stopping
                </p>
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
                <PairSelector
                  pairs={pairs}
                  selectedPair={botForm.symbol}
                  onSelect={(pair) => setBotForm({ ...botForm, symbol: pair })}
                />
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

              {/* Price Chart - Manual Mode */}
              {botForm.symbol && (
                <div className="bg-[var(--color-surface-dark)] rounded-xl p-4">
                  <PriceChart
                    symbol={botForm.symbol}
                    height={140}
                    showToggle={true}
                    showStats={true}
                  />
                </div>
              )}

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

              {/* Grid Preview */}
              {botForm.upper_price && botForm.lower_price && parseInt(botForm.grid_size) > 0 && (
                <GridPreview
                  upperPrice={parseFloat(botForm.upper_price)}
                  lowerPrice={parseFloat(botForm.lower_price)}
                  gridSize={parseInt(botForm.grid_size) || 5}
                />
              )}

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
          <div>
            <Input
              label="Investment Amount"
              type="number"
              step="0.01"
              min={minInvestment ? parseFloat(minInvestment.amount) : undefined}
              value={botForm.investment_amount}
              onChange={(e) => setBotForm({ ...botForm, investment_amount: e.target.value })}
              placeholder={minInvestment ? `Min: ${parseFloat(minInvestment.amount).toFixed(2)} ${minInvestment.currency}` : 'Investment amount'}
              required
            />
            {/* Min investment hint */}
            {minInvestmentLoading && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                Calculating minimum investment...
              </p>
            )}
            {minInvestment && !minInvestmentLoading && (
              <p className="text-xs text-emerald-400 mt-1">
                💰 Minimum investment for {botForm.grid_size} grids: <span className="font-semibold">{parseFloat(minInvestment.amount).toFixed(2)} {minInvestment.currency}</span>
              </p>
            )}
            {minInvestmentError && !minInvestmentLoading && (
              <p className="text-xs text-yellow-400 mt-1">⚠️ {minInvestmentError}</p>
            )}
            {minInvestment && botForm.investment_amount && parseFloat(botForm.investment_amount) < parseFloat(minInvestment.amount) && (
              <p className="text-xs text-red-400 mt-1">
                ❌ Amount is below the minimum. The bot may fail to place orders.
              </p>
            )}
          </div>

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
  );
};