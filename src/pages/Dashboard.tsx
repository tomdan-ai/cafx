import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { Plus, BarChart3, RefreshCw, Bot, TrendingUp } from 'lucide-react';
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

      const [spotBotsResponse, futuresBotsResponse, connectedExchangesResponse, userProfile] = await Promise.all([
        apiService.getSpotBots(),
        apiService.getFuturesBots(),
        apiService.getConnectedExchanges(),
        apiService.getProfile().catch(() => null)
      ]);

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

      const connectedExchangesData = connectedExchangesResponse || {};
      let exchangesArray: any[] = [];
      if (Array.isArray(connectedExchangesResponse)) {
        exchangesArray = connectedExchangesResponse as any[];
      } else if (Array.isArray((connectedExchangesData as any).exchanges)) {
        exchangesArray = (connectedExchangesData as any).exchanges;
      }

      const connectedCount = (connectedExchangesData as any).count ?? exchangesArray.filter((ex: any) => ex?.connected).length;
      const activeBotsData = allBots.filter((bot: any) => !!bot.is_running);
      const runningFuturesBots = activeBotsData.filter((bot: any) => bot.type === 'futures');
      const runningSpotBots = activeBotsData.filter((bot: any) => bot.type === 'spot');

      setActiveBots(activeBotsData);

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
        toast.success('Dashboard refreshed');
      }

    } catch (error) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="loader-premium" />
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
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.username}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's an overview of <span className="text-[var(--color-primary)] font-semibold">MERLIN's</span> Trading Performance
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Active Trades Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trades */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Active Trades</h2>
              {stats.active_bots > 0 && (
                <span className="badge badge-green">{stats.active_bots} Running</span>
              )}
            </div>

            {stats.active_bots > 0 ? (
              <div className="space-y-3">
                {activeBots.slice(0, 5).map((bot: any, index: number) => {
                  const displayProfit = bot.profit_loss || 0;
                  const isPositive = displayProfit >= 0;

                  return (
                    <div
                      key={bot.id || index}
                      className={`bot-card ${bot.status === 'active' ? 'bot-card-active' : 'bot-card-inactive'} cursor-pointer`}
                      onClick={() => navigate('/bots')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="status-dot status-dot-active" />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-[var(--color-primary)]" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {bot.pair || bot.name || `${bot.exchange} Bot`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {bot.exchange} • <span className={bot.type === 'futures' ? 'text-yellow-400' : 'text-blue-400'}>{bot.type}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isPositive ? 'pnl-positive' : 'pnl-negative'}`}>
                            {isPositive ? '+' : ''}${displayProfit.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">P&L</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stats.active_bots > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/bots')}
                    >
                      View All {stats.active_bots} Active Bots
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="empty-state-title">No Active Trades</h3>
                <p className="empty-state-description">
                  Start a trading bot to see your active trades here
                </p>
                <Button onClick={() => navigate('/bots?create=true')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Trading Bot
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/bots?create=true')}
                className="w-full p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Create Bot</p>
                    <p className="text-sm text-gray-500">Start automated trading</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="w-full p-4 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] hover:border-[var(--color-border-light)] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-secondary)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-[var(--color-secondary)]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Analytics</p>
                    <p className="text-sm text-gray-500">Track performance</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/subscription')}
                className="w-full p-4 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] hover:border-[var(--color-border-light)] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-[var(--color-warning)]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Upgrade Plan</p>
                    <p className="text-sm text-gray-500">Unlock more features</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};