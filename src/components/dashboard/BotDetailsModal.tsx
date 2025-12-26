import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiService } from '../../utils/api';
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, isAuthError, isServerError } from '../../utils/errorUtils';

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
  onStopBot: () => void;
  onDeleteBot?: () => void;
}

interface BotDetails {
  task_id: string;
  symbol: string;
  exchange: string;
  status: string;
  profit_loss: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  grid_size: number;
  upper_price?: number;
  lower_price?: number;
  investment_amount: number;
  leverage?: number;
  strategy_type?: string;
  run_hours?: number;
  started_at: string;
  last_trade_at?: string;
  current_price?: number;
  trades?: Array<{
    id: string;
    type: 'buy' | 'sell';
    price: number;
    amount: number;
    profit_loss: number;
    timestamp: string;
  }>;
}

export const BotDetailsModal: React.FC<BotDetailsModalProps> = ({
  isOpen,
  onClose,
  bot,
  onStopBot,
  onDeleteBot
}) => {
  const [details, setDetails] = useState<BotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (isOpen && bot.task_id) {
      fetchBotDetails();
    }
  }, [isOpen, bot.task_id]);

  const fetchBotDetails = async () => {
    if (!bot.task_id) {
      toast.error('No task ID available for this bot');
      setLoading(false);
      return;
    }

    console.log('📊 Fetching bot details for:', bot.task_id);
    setLoading(true);

    try {
      let response;
      if (bot.type === 'futures') {
        response = await apiService.getFuturesBotDetails(bot.task_id);
      } else {
        response = await apiService.getSpotBotDetails(bot.task_id);
      }

      console.log('✅ Bot details loaded:', response);
      setDetails(response);
    } catch (error: any) {
      console.error('❌ Failed to fetch bot details:', error);
      
      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Bot details not available. This feature may not be implemented yet.');
      } else if (isServerError(error)) {
        toast.error('Unable to load bot details. Please try again.');
      } else {
        const message = getErrorMessage(error, 'Failed to load bot details.');
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async () => {
    if (!bot.task_id) {
      toast.error('No task ID available');
      return;
    }

    if (!window.confirm('Are you sure you want to stop this bot? All open positions will be closed.')) {
      return;
    }

    setStopping(true);
    console.log('🛑 Stopping bot:', bot.task_id);

    try {
      if (bot.type === 'futures') {
        await apiService.stopFuturesBot(bot.task_id);
      } else {
        await apiService.stopSpotBot(bot.task_id);
      }

      console.log('✅ Bot stopped successfully');
      toast.success('Bot stopped successfully!');
      onStopBot();
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to stop bot:', error);
      
      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('Bot not found. It may have already been stopped.');
        onClose();
      } else {
        const message = getErrorMessage(error, 'Failed to stop bot. Please try again.');
        toast.error(message);
      }
    } finally {
      setStopping(false);
    }
  };

  const winRate = details && details.total_trades > 0
    ? ((details.winning_trades / details.total_trades) * 100).toFixed(1)
    : '0.0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${bot.name} - Details`}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-500 animate-spin animation-delay-200"></div>
          </div>
        </div>
      ) : details ? (
        <div className="space-y-6">
          {/* Bot Status Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  bot.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{details.symbol}</h3>
                  <p className="text-sm text-gray-400">{details.exchange} • {bot.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  details.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {details.profit_loss >= 0 ? '+' : ''}${details.profit_loss.toFixed(2)}
                </div>
                <p className="text-xs text-gray-400">Total P&L</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Trades</span>
              </div>
              <p className="text-xl font-bold text-white">{details.total_trades}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Win Rate</span>
              </div>
              <p className="text-xl font-bold text-green-400">{winRate}%</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Grid Size</span>
              </div>
              <p className="text-xl font-bold text-white">{details.grid_size}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Investment</span>
              </div>
              <p className="text-xl font-bold text-white">${details.investment_amount}</p>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {details.upper_price && (
                <div>
                  <span className="text-gray-400">Upper Price:</span>
                  <span className="text-white ml-2">${details.upper_price.toFixed(2)}</span>
                </div>
              )}
              {details.lower_price && (
                <div>
                  <span className="text-gray-400">Lower Price:</span>
                  <span className="text-white ml-2">${details.lower_price.toFixed(2)}</span>
                </div>
              )}
              {details.current_price && (
                <div>
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white ml-2">${details.current_price.toFixed(2)}</span>
                </div>
              )}
              {details.leverage && (
                <div>
                  <span className="text-gray-400">Leverage:</span>
                  <span className="text-white ml-2">{details.leverage}x</span>
                </div>
              )}
              {details.strategy_type && (
                <div>
                  <span className="text-gray-400">Strategy:</span>
                  <span className="text-white ml-2 capitalize">{details.strategy_type}</span>
                </div>
              )}
              {details.run_hours && (
                <div>
                  <span className="text-gray-400">Run Duration:</span>
                  <span className="text-white ml-2">{details.run_hours}h</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Started: {new Date(details.started_at).toLocaleString()}</span>
              </div>
              {details.last_trade_at && (
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                  <Activity className="w-3 h-3" />
                  <span>Last Trade: {new Date(details.last_trade_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Trades */}
          {details.trades && details.trades.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Recent Trades</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {details.trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'buy'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white">${trade.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{trade.amount} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {bot.status === 'active' ? (
              <Button
                variant="ghost"
                onClick={handleStopBot}
                loading={stopping}
                className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {stopping ? 'Stopping...' : 'Stop Bot'}
              </Button>
            ) : (
              onDeleteBot && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onClose();
                    onDeleteBot();
                  }}
                  className="flex-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  Delete Bot
                </Button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-400" />
          <p className="text-gray-400">No details available for this bot</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};
