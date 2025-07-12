import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiService } from '../utils/api';
import { Bot, Play, Pause, Square, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface ConnectedExchange {
  name: string;
  connected: boolean;
  image?: string;
}

export const TradingBots: React.FC = () => {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [exchanges, setExchanges] = useState<ConnectedExchange[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);
  const [runHours, setRunHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'spot' | 'futures'>('all');
  const [creating, setCreating] = useState(false);
  const [botForm, setBotForm] = useState({
    name: '',
    type: 'spot' as 'spot' | 'futures',
    exchange: '',
    symbol: '',
    grid_size: '',
    upper_price: '',
    lower_price: '',
    investment_amount: '',
    run_hours: '',
    leverage: '',
    strategy_type: 'long'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [botsResponse, connectedExchangesResponse, pairsResponse, runHoursResponse] = await Promise.all([
          apiService.getAllBots(),
          apiService.getConnectedExchanges(),
          apiService.getPairs(),
          apiService.getBotRunHours()
        ]);

        setBots(botsResponse.futures.concat(botsResponse.spot));
        
        const connected = connectedExchangesResponse.exchanges?.filter((ex: any) => ex.connected) || [];
        setExchanges(connected);

        setPairs(Array.isArray(pairsResponse) ? pairsResponse : []);
        // Ensure runHours is an array
        setRunHours(Array.isArray(runHoursResponse) ? runHoursResponse : [24, 48, 72, 168]); // Default values if not an array
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBots = bots.filter(bot => {
    if (activeTab === 'all') return true;
    return bot.type === activeTab;
  });

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const botConfig: any = {
        symbol: botForm.symbol,
        grid_size: parseInt(botForm.grid_size),
        upper_price: parseFloat(botForm.upper_price),
        lower_price: parseFloat(botForm.lower_price),
        investment_amount: parseFloat(botForm.investment_amount),
        run_hours: parseInt(botForm.run_hours),
        exchange: botForm.exchange,
      };

      if (botForm.type === 'futures') {
        botConfig.leverage = parseInt(botForm.leverage);
        botConfig.strategy_type = botForm.strategy_type;
      }

      let response;
      if (botForm.type === 'futures') {
        response = await apiService.startFuturesBot(botConfig);
      } else {
        response = await apiService.startSpotBot(botConfig);
      }

      // Refresh bots list
      const botsResponse = await apiService.getAllBots();
      setBots(botsResponse.futures.concat(botsResponse.spot));

      setShowModal(false);
      setBotForm({
        name: '',
        type: 'spot',
        exchange: '',
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
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to create bot';
      toast.error(errorMessage);
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

      // Refresh bots list
      const botsResponse = await apiService.getAllBots();
      setBots(botsResponse);
      
      toast.success('Bot stopped successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to stop bot';
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: TradingBot['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'inactive':
        return <Square className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Animated Background Image */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img 
            src="/MERLIN.png" 
            alt="Background" 
            className="w-96 h-96 opacity-5 animate-spin-slow object-contain"
            style={{
              animation: 'spin 20s linear infinite, bounce 3s ease-in-out infinite'
            }}
          />
        </div>
        {/* Additional floating images for more effect */}
        <div className="absolute top-20 right-20">
          <img 
            src="/MERLIN.png" 
            alt="Background" 
            className="w-32 h-32 opacity-3 animate-pulse object-contain"
          />
        </div>
        <div className="absolute bottom-20 left-20">
          <img 
            src="/MERLIN.png" 
            alt="Background" 
            className="w-24 h-24 opacity-3 animate-bounce object-contain"
          />
        </div>
      </div>

      {/* Main Content - with relative positioning to stay above background */}
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
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
                    <h3 className="text-lg font-semibold text-white">{bot.name || `${bot.pair} Bot`}</h3>
                    <p className="text-sm text-gray-400">{bot.exchange} • {bot.pair}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  bot.type === 'spot' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {bot.type.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(bot.status)}
                    <span className="text-sm text-white capitalize">{bot.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">P&L</span>
                  <div className="flex items-center space-x-1">
                    {bot.profit_loss >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      bot.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${bot.profit_loss.toLocaleString()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Bot Type</label>
                <select
                  value={botForm.type}
                  onChange={(e) => setBotForm({...botForm, type: e.target.value as 'spot' | 'futures'})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="spot">Spot Trading</option>
                  <option value="futures">Futures Trading</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Exchange</label>
                <select
                  value={botForm.exchange}
                  onChange={(e) => setBotForm({...botForm, exchange: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Connected Exchange</option>
                  {exchanges.map((exchange) => (
                    <option key={exchange.name} value={exchange.name.toLowerCase()}>
                      {exchange.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Trading Pair</label>
                <select
                  value={botForm.symbol}
                  onChange={(e) => setBotForm({...botForm, symbol: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Pair</option>
                  {pairs.map((pair) => (
                    <option key={pair.symbol} value={pair.symbol}>
                      {pair.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Grid Size"
                type="number"
                value={botForm.grid_size}
                onChange={(e) => setBotForm({...botForm, grid_size: e.target.value})}
                placeholder="Number of grids"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lower Price"
                type="number"
                step="0.01"
                value={botForm.lower_price}
                onChange={(e) => setBotForm({...botForm, lower_price: e.target.value})}
                placeholder="Minimum price"
                required
              />
              <Input
                label="Upper Price"
                type="number"
                step="0.01"
                value={botForm.upper_price}
                onChange={(e) => setBotForm({...botForm, upper_price: e.target.value})}
                placeholder="Maximum price"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Investment Amount"
                type="number"
                step="0.01"
                value={botForm.investment_amount}
                onChange={(e) => setBotForm({...botForm, investment_amount: e.target.value})}
                placeholder="Investment amount"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Run Hours</label>
                <select
                  value={botForm.run_hours}
                  onChange={(e) => setBotForm({...botForm, run_hours: e.target.value})}
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
                    // Default options if runHours is not available
                    [24, 48, 72, 168].map((hour) => (
                      <option key={hour.toString()} value={hour}>
                        {hour} hours
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {botForm.type === 'futures' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Leverage"
                  type="number"
                  value={botForm.leverage}
                  onChange={(e) => setBotForm({...botForm, leverage: e.target.value})}
                  placeholder="Leverage (e.g., 5)"
                  required
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Strategy Type</label>
                  <select
                    value={botForm.strategy_type}
                    onChange={(e) => setBotForm({...botForm, strategy_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
              </div>
            )}

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
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create & Start Bot'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
      `}</style>
    </div>
  );
};