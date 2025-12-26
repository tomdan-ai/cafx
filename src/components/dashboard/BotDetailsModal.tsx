import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  Settings,
  Zap,
  Target,
  Layers,
  Calendar,
  RefreshCw,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Gauge
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, isAuthError } from '../../utils/errorUtils';
import { getBotConfig } from '../../utils/botStorage';

interface BotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: {
    id: string;
    name: string;
    type: 'spot' | 'futures';
    exchange: string;
    pair: string;
    status: 'active' | 'inactive' | 'paused';
    profit_loss: number;
    created_at: string;
    task_id?: string;
  };
  onStopBot: () => Promise<void>;
  onDeleteBot?: () => void;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'purple' | 'blue' | 'cyan' | 'green' | 'orange';
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-3 sm:p-4 border backdrop-blur-sm`}>
      <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
        <span className={`${colorClasses[color].split(' ').pop()} [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4`}>{icon}</span>
        <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-base sm:text-xl font-bold text-white">{value}</p>
    </div>
  );
};

export const BotDetailsModal: React.FC<BotDetailsModalProps> = ({
  isOpen,
  onClose,
  bot,
  onStopBot,
  onDeleteBot
}) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (isOpen && bot.id) {
      loadBotConfig();
    }
  }, [isOpen, bot.id]);

  const loadBotConfig = () => {
    setLoading(true);
    const storedConfig = getBotConfig(bot.id) || getBotConfig(bot.task_id || '');
    
    if (storedConfig) {
      setConfig(storedConfig);
    } else {
      setConfig({
        bot_id: bot.id,
        task_id: bot.task_id,
        name: bot.name,
        type: bot.type,
        exchange: bot.exchange,
        symbol: bot.pair,
        created_at: bot.created_at,
        ...(bot as any).__raw
      });
    }
    setLoading(false);
  };

  const handleStopBot = async () => {
    if (!bot.task_id) {
      toast.error('No task ID available');
      return;
    }
    if (!window.confirm('Stop this bot? All open positions will be closed.')) {
      return;
    }
    setStopping(true);
    try {
      await onStopBot();
      toast.success('Bot stopped successfully!');
      onClose();
    } catch (error: any) {
      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Bot not found.');
        onClose();
      } else {
        toast.error(getErrorMessage(error, 'Failed to stop bot.'));
      }
    } finally {
      setStopping(false);
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return '—';
    const num = Number(price);
    return isNaN(num) ? '—' : `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateShort = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-500/20 border-t-purple-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>
      ) : config ? (
        <div className="space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-cyan-600/30 p-4 sm:p-5 border border-white/10">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${
                    bot.status === 'active' 
                      ? 'from-green-500/30 to-emerald-500/20 border-green-500/40' 
                      : 'from-gray-500/30 to-gray-600/20 border-gray-500/40'
                  } border-2 flex items-center justify-center backdrop-blur-sm`}>
                    <img src="/MERLIN.png" alt="Bot" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-800 ${
                    bot.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">
                    {config.name || config.symbol || bot.pair}
                  </h2>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                      bot.type === 'futures' 
                        ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40' 
                        : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                    }`}>
                      {bot.type}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      {config.exchange || bot.exchange}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">P&L</p>
                <div className={`text-xl sm:text-2xl font-bold flex items-center justify-end ${
                  bot.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {bot.profit_loss >= 0 ? <ArrowUpRight className="w-5 h-5 mr-0.5" /> : <ArrowDownRight className="w-5 h-5 mr-0.5" />}
                  {bot.profit_loss >= 0 ? '+' : ''}${Math.abs(bot.profit_loss).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={<DollarSign />} label="Investment" value={formatPrice(config.investment_amount)} color="purple" />
            <StatCard icon={<Layers />} label="Grid Size" value={config.grid_size || '—'} color="blue" />
            <StatCard icon={<Clock />} label="Duration" value={config.run_hours ? `${config.run_hours}h` : '—'} color="cyan" />
            <StatCard icon={<Gauge />} label="Mode" value={config.mode === 'auto' ? 'Auto' : 'Manual'} color="green" />
          </div>

          {/* Price Range */}
          {(config.upper_price || config.lower_price) && (
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white">Price Range</h3>
              </div>
              <div className="relative">
                <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-2.5">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Lower</p>
                    <p className="text-sm sm:text-base font-bold text-red-400">{formatPrice(config.lower_price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Upper</p>
                    <p className="text-sm sm:text-base font-bold text-green-400">{formatPrice(config.upper_price)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Futures Details */}
          {bot.type === 'futures' && (config.leverage || config.strategy_type) && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {config.leverage && (
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-xl p-3 sm:p-4 border border-orange-500/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium">Leverage</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-400">{config.leverage}x</p>
                </div>
              )}
              {config.strategy_type && (
                <div className={`bg-gradient-to-br rounded-xl p-3 sm:p-4 border backdrop-blur-sm ${
                  config.strategy_type === 'long' 
                    ? 'from-green-500/20 to-emerald-500/10 border-green-500/30' 
                    : 'from-red-500/20 to-pink-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center space-x-2 mb-1.5">
                    {config.strategy_type === 'long' ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium">Strategy</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold capitalize ${config.strategy_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {config.strategy_type}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* API Response Details */}
          {config.api_response && (
            <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white">Status</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {config.api_response.is_running !== undefined && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.api_response.is_running ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">State</p>
                      <p className={`text-xs font-medium ${config.api_response.is_running ? 'text-green-400' : 'text-gray-400'}`}>
                        {config.api_response.is_running ? 'Running' : 'Stopped'}
                      </p>
                    </div>
                  </div>
                )}
                {config.api_response.end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">Ends</p>
                      <p className="text-xs font-medium text-white truncate">{formatDateShort(config.api_response.end_date)}</p>
                    </div>
                  </div>
                )}
                {config.api_response.date_updated && (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">Updated</p>
                      <p className="text-xs font-medium text-white truncate">{formatDateShort(config.api_response.date_updated)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 px-1">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3 h-3" />
              <span>Created {formatDateShort(config.created_at || bot.created_at)}</span>
            </div>
            {bot.task_id && (
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3 h-3" />
                <span>ID: {bot.task_id.substring(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* Status Alert */}
          {bot.status === 'inactive' && (
            <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-300">Bot Inactive</p>
                  <p className="text-[10px] text-amber-200/70">Completed or stopped. Delete to clean up.</p>
                </div>
              </div>
            </div>
          )}

          {/* No Config Warning */}
          {!config.mode && !config.grid_size && !config.api_response && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-gray-700 rounded-lg flex-shrink-0">
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-300">Limited Data</p>
                  <p className="text-[10px] text-gray-500">Created before config storage.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium">
              Close
            </Button>
            {bot.status === 'active' ? (
              <Button
                variant="ghost"
                onClick={handleStopBot}
                loading={stopping}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30"
              >
                {stopping ? 'Stopping...' : 'Stop Bot'}
              </Button>
            ) : (
              onDeleteBot && (
                <Button
                  variant="ghost"
                  onClick={() => { onClose(); onDeleteBot(); }}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-red-500/20 hover:text-red-400 border border-gray-600"
                >
                  Delete Bot
                </Button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="p-4 bg-gray-800 rounded-full">
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400">No configuration details available</p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      )}
    </Modal>
  );
};
