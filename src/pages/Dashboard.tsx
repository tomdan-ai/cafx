import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { Plus, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, isAuthError, isServerError } from '../utils/errorUtils';

interface DashboardStatsType {
  active_bots: number;
  total_profit: number;
  connected_exchanges: number;
  subscription_tier: string;
  total_bots: number;
  running_futures_bots: number;
  running_spot_bots: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [activeBots, setActiveBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch data from multiple endpoints - use the same endpoints as TradingBots page
      const [spotBotsResponse, futuresBotsResponse, connectedExchangesResponse, userProfile] = await Promise.all([
        apiService.getSpotBots(),
        apiService.getFuturesBots(),
        apiService.getConnectedExchanges(),
        apiService.getProfile().catch(() => null)
      ]);

      // Normalize bot data - same logic as TradingBots page
      const normalizeBot = (bot: any, type: 'spot' | 'futures') => ({
        id: bot.id ?? bot.pk ?? bot._id ?? String(bot.task_id || bot.taskId || Math.random()),
        name: bot.name || bot.pair || `${type.toUpperCase()} Bot`,
        type,
        exchange: bot.exchange || bot.exchange_name || bot.exchange_id || 'Unknown',
        pair: bot.pair || bot.symbol || bot.pair_symbol || '',
        status: bot.is_running || bot.status === 'running' || bot.status === 'active' ? 'active' : 'inactive',
        is_running: bot.is_running || bot.status === 'running' || bot.status === 'active',
        profit_loss: bot.profit_loss ?? bot.profit ?? 0,
        investment_amount: bot.investment_amount || 0,
        created_at: bot.date_created || bot.created_at || bot.created || new Date().toISOString(),
        task_id: bot.task_id || bot.taskId || bot.task || undefined,
        strategy_type: type,
        __raw: bot
      });

      const futuresBots = Array.isArray(futuresBotsResponse)
        ? futuresBotsResponse.map((b: any) => normalizeBot(b, 'futures'))
        : [];
      const spotBots = Array.isArray(spotBotsResponse)
        ? spotBotsResponse.map((b: any) => normalizeBot(b, 'spot'))
        : [];

      const allBots = [...futuresBots, ...spotBots];

      // Normalize connected exchanges response
      const connectedExchangesData = connectedExchangesResponse || {};
      let exchangesArray: any[] = [];
      if (Array.isArray(connectedExchangesResponse)) {
        exchangesArray = connectedExchangesResponse as any[];
      } else if (Array.isArray((connectedExchangesData as any).exchanges)) {
        exchangesArray = (connectedExchangesData as any).exchanges;
      }

      const connectedCount = (connectedExchangesData as any).count ?? exchangesArray.filter((ex: any) => ex?.connected).length;

      // Calculate totals - filter by is_running field
      const activeBotsData = allBots.filter((bot: any) => !!bot.is_running);
      const runningFuturesBots = activeBotsData.filter((bot: any) => bot.type === 'futures');
      const runningSpotBots = activeBotsData.filter((bot: any) => bot.type === 'spot');

      // Store active bots in state for rendering
      setActiveBots(activeBotsData);

      // Calculate total profit from real bot data
      const totalProfit = activeBotsData.reduce((total: number, bot: any) => {
        const profit = bot.profit_loss || 0;
        return total + profit;
      }, 0);

      const subscriptionTier = userProfile?.subscription_tier || user?.subscription_tier || 'starter';

      const dashboardStats: DashboardStatsType = {
        active_bots: activeBotsData.length,
        total_profit: Math.round(totalProfit * 100) / 100,
        connected_exchanges: connectedCount,
        subscription_tier: subscriptionTier,
        total_bots: allBots.length,
        running_futures_bots: runningFuturesBots.length,
        running_spot_bots: runningSpotBots.length
      };

      setStats(dashboardStats);

      if (isRefresh) {
        toast.success('Dashboard data refreshed!');
      }

    } catch (error) {

      // Set default stats if API fails
      const defaultStats: DashboardStatsType = {
        active_bots: 0,
        total_profit: 0,
        connected_exchanges: 0,
        subscription_tier: user?.subscription_tier || 'starter',
        total_bots: 0,
        running_futures_bots: 0,
        running_spot_bots: 0
      };
      setStats(defaultStats);

      if (isRefresh) {
        if (isAuthError(error)) {
          toast.error('Session expired. Please log in again.');
        } else if (isServerError(error)) {
          toast.error('Unable to refresh data. Please try again.');
        } else {
          const message = getErrorMessage(error, 'Failed to refresh dashboard data.');
          toast.error(message);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleCreateBot = () => {
    navigate('/bots');
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-500 animate-spin animation-delay-200"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => fetchDashboardData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Here's an overview of <b>MERLIN'S</b>  Trading Performance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          loading={refreshing}
          disabled={refreshing}
          size="sm"
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Active Trades */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Active Trades</h2>
        {stats.active_bots > 0 ? (
          <div className="space-y-3">
            {/* This would be populated with actual active bot data */}
            <div className="text-sm text-gray-400 mb-3">
              {stats.active_bots} active trading bot{stats.active_bots !== 1 ? 's' : ''} running
            </div>
            <div className="grid gap-3">
              {/* Display actual active bot data */}
              {activeBots.slice(0, 5).map((bot: any, index: number) => {
                const displayProfit = bot.profit_loss || 0;
                const isPositive = displayProfit >= 0;

                return (
                  <div
                    key={bot.id || index}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
                    onClick={() => navigate('/trading-bots')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-green-400"></div>
                      <div className="flex items-center space-x-2">
                        <img src="/MERLIN.png" alt="Bot" className="w-6 h-6 object-contain" />
                        <div>
                          <div className="text-white font-medium">
                            {bot.pair || bot.name || `${bot.exchange} Bot`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bot.exchange} • {bot.type === 'futures' ? 'Futures' : 'Spot'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {isPositive ? '+' : ''}${displayProfit.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">P&L</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {stats.active_bots > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/trading-bots')}
                  className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
                >
                  View All {stats.active_bots} Active Bots
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active trades running</p>
              <p className="text-sm mt-1">Start a trading bot to see your active trades here</p>
            </div>
            <Button
              onClick={() => navigate('/trading-bots')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Trading Bot
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateBot}
            className="flex flex-col items-center p-4 sm:p-6 h-auto text-center"
          >
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <span className="text-base sm:text-lg font-medium">Create Bot</span>
            <span className="text-xs sm:text-sm opacity-80 mt-1">Start automated trading</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleViewAnalytics}
            className="flex flex-col items-center p-4 sm:p-6 h-auto text-center"
          >
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <span className="text-base sm:text-lg font-medium">Analytics</span>
            <span className="text-xs sm:text-sm opacity-80 mt-1">Track performance</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};