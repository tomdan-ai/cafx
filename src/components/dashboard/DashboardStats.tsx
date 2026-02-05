import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Crown, Activity, Bot } from 'lucide-react';

interface DashboardStatsType {
  active_bots: number;
  total_profit: number;
  connected_exchanges: number;
  subscription_tier: string;
  total_bots: number;
  running_futures_bots: number;
  running_spot_bots: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isProfitPositive = stats.total_profit >= 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Bots */}
        <div
          className="stat-card stat-card-purple cursor-pointer"
          onClick={() => navigate('/bots')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Active Bots</p>
              <p className="stat-value">{stats.active_bots}</p>
              <p className="text-xs text-gray-500 mt-1">
                of {stats.total_bots} total
              </p>
            </div>
            <div className="stat-icon stat-icon-purple">
              <Bot className="w-6 h-6" />
            </div>
          </div>
          {stats.active_bots > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-accent)]">
              <div className="status-dot status-dot-active" />
              <span>{stats.running_futures_bots} futures, {stats.running_spot_bots} spot</span>
            </div>
          )}
        </div>

        {/* Total Profit */}
        <div
          className="stat-card stat-card-green cursor-pointer"
          onClick={() => navigate('/analytics')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Profit</p>
              <p className={`stat-value ${isProfitPositive ? 'pnl-positive' : 'pnl-negative'}`}>
                {formatCurrency(stats.total_profit)}
              </p>
            </div>
            <div className="stat-icon stat-icon-green">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-1 text-sm ${isProfitPositive ? 'pnl-positive' : 'pnl-negative'}`}>
            {isProfitPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>All time earnings</span>
          </div>
        </div>

        {/* Subscription */}
        <div
          className="stat-card stat-card-yellow cursor-pointer"
          onClick={() => navigate('/subscription')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Subscription</p>
              <p className="stat-value capitalize">{stats.subscription_tier}</p>
            </div>
            <div className="stat-icon stat-icon-yellow">
              {stats.subscription_tier?.toLowerCase() === 'pro' || stats.subscription_tier?.toLowerCase() === 'premium' ? (
                <Crown className="w-6 h-6" />
              ) : (
                <Activity className="w-6 h-6" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <span className="badge badge-yellow">Current Plan</span>
          </div>
        </div>

        {/* Bot Performance Summary */}
        <div className="stat-card stat-card-blue">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label">Bot Distribution</p>
            </div>
          </div>

          {stats.total_bots > 0 ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Futures</span>
                  <span className="text-white font-medium">{stats.running_futures_bots}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-dark)] rounded-full h-1.5">
                  <div
                    className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.total_bots > 0 ? (stats.running_futures_bots / stats.total_bots) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Spot</span>
                  <span className="text-white font-medium">{stats.running_spot_bots}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-dark)] rounded-full h-1.5">
                  <div
                    className="bg-[var(--color-secondary)] h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.total_bots > 0 ? (stats.running_spot_bots / stats.total_bots) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-500 text-sm">No bots created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};