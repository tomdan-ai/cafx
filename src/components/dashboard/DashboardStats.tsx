import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  Bot,
  Link as LinkIcon,
  Crown,
  Activity,
  BarChart3,
  DollarSign,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  Zap
} from 'lucide-react';
import { apiService } from '../../utils/api';
import { useNavigate, Link } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading,
  onClick,
  className = ""
}) => (
  <Card
    hover
    glow
    className={`group cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">{title}</p>
        {loading ? (
          <div className="h-6 sm:h-8 bg-gray-700 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{value}</p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-xs sm:text-sm ${trend.positive ? 'text-green-400' : 'text-red-400'
            }`}>
            {trend.positive ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div className={`p-2 sm:p-3 rounded-lg transition-colors ${loading ? 'bg-gray-700 animate-pulse' : 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20'
        }`}>
        {icon}
      </div>
    </div>
  </Card>
);

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

  const getSubscriptionIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium':
      case 'pro':
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Activity className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium':
      case 'pro':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-blue-500 to-purple-500';
    }
  };

  const statsCards = [
    {
      title: 'Total Bots',
      value: stats.total_bots.toString(),
      subtitle: `${stats.active_bots} active bots`,
      icon: <img src="/MERLIN.png" alt="Total Bots" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />,
      onClick: () => navigate('/bots'),
      trend: stats.total_bots > 0 ? {
        value: `${Math.round((stats.active_bots / Math.max(stats.total_bots, 1)) * 100)}% active`,
        positive: stats.active_bots > 0
      } : undefined
    },
    {
      title: 'Total Profit',
      value: formatCurrency(stats.total_profit),
      subtitle: 'All time earnings',
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
      onClick: () => navigate('/analytics'),
      trend: {
        value: stats.total_profit >= 0 ? '+12.5% this month' : '-5.2% this month',
        positive: stats.total_profit >= 0
      }
    },
    {
      title: 'Subscription',
      value: stats.subscription_tier.charAt(0).toUpperCase() + stats.subscription_tier.slice(1),
      subtitle: 'Current plan',
      icon: getSubscriptionIcon(stats.subscription_tier),
      onClick: () => navigate('/subscription'),
      className: `bg-gradient-to-br ${getSubscriptionColor(stats.subscription_tier)} border-0`
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      {/* Detailed Bot Stats */}
      {stats.active_bots > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Futures Bots</h3>
              <img src="/MERLIN.png" alt="Futures Bots" className="w-5 h-5 object-contain" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Active</span>
                <span className="text-lg sm:text-xl font-bold text-white">{stats.running_futures_bots}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.total_bots > 0 ? (stats.running_futures_bots / stats.total_bots) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {stats.total_bots > 0 ? Math.round((stats.running_futures_bots / stats.total_bots) * 100) : 0}% of total bots
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Spot Bots</h3>
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Active</span>
                <span className="text-lg sm:text-xl font-bold text-white">{stats.running_spot_bots}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.total_bots > 0 ? (stats.running_spot_bots / stats.total_bots) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {stats.total_bots > 0 ? Math.round((stats.running_spot_bots / stats.total_bots) * 100) : 0}% of total bots
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {stats.active_bots === 0 && (
        <Card className="p-6 sm:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/MERLIN.png" alt="No Bots" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Active Bots</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-6">
              Get started by creating your first trading bot.
            </p>
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={() => navigate('/bots')}
                className="flex items-center justify-center"
              >
                <img src="/MERLIN.png" alt="Create Bot" className="w-4 h-4 mr-2 object-contain" />
                Create Your First Bot
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};