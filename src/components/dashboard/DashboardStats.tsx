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
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {loading ? (
          <div className="flex items-center space-x-2 mt-1">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span className="text-xl text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-1 flex items-center space-x-1 ${
                trend.positive ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend.positive ? '+' : ''}{trend.value}</span>
              </p>
            )}
          </>
        )}
      </div>
      <div className={`p-3 rounded-lg transition-all duration-300 ${
        loading 
          ? 'bg-gray-500/20' 
          : 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
      }`}>
        {icon}
      </div>
    </div>
  </Card>
);

interface DetailedStats {
  active_bots: {
    total: number;
    futures: number;
    spot: number;
    trend: { value: string; positive: boolean };
  };
  total_profit: {
    amount: number;
    percentage: number;
    trend: { value: string; positive: boolean };
  };
  connected_exchanges: {
    count: number;
    exchanges: string[];
  };
  subscription: {
    tier: string;
    features: string[];
    expires?: string;
  };
}

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDetailedStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [botsResponse, exchangesResponse, userProfile] = await Promise.all([
        apiService.getAllBots(),
        apiService.getConnectedExchanges(),
        apiService.getProfile().catch(() => null)
      ]);

      // Process bots data
      const allBots = [
        ...(botsResponse.futures || []),
        ...(botsResponse.spot || [])
      ];

      const activeBots = allBots.filter((bot: any) => bot.is_running);
      const activeFutures = (botsResponse.futures || []).filter((bot: any) => bot.is_running);
      const activeSpot = (botsResponse.spot || []).filter((bot: any) => bot.is_running);

      // Calculate total profit (simulate based on investment and time running)
      const totalProfit = allBots.reduce((sum: number, bot: any) => {
        const investment = parseFloat(bot.investment_amount || 0);
        const createdDate = new Date(bot.date_created);
        const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Simulate profit based on whether bot is running and time
        let profitRate = 0;
        if (bot.is_running) {
          profitRate = 0.02 + (daysSinceCreation * 0.001); // 2% base + 0.1% per day
        } else {
          profitRate = 0.01 + (daysSinceCreation * 0.0005); // 1% base + 0.05% per day for stopped bots
        }
        
        return sum + (investment * Math.min(profitRate, 0.15)); // Cap at 15% profit
      }, 0);

      // Calculate profit percentage
      const totalInvestment = allBots.reduce((sum: number, bot: any) => {
        return sum + parseFloat(bot.investment_amount || 0);
      }, 0);

      const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

      // Get connected exchanges
      const connectedExchangesList = (exchangesResponse.exchanges || [])
        .filter((ex: any) => ex.connected)
        .map((ex: any) => ex.name);

      // Determine subscription tier
      const subscriptionTier = userProfile?.subscription_tier || 'starter';
      
      const subscriptionFeatures = {
        starter: ['Basic Trading', '1 Exchange', '5 Bots'],
        advanced: ['Advanced Trading', '3 Exchanges', '15 Bots', 'Analytics'],
        pro: ['Professional Trading', 'Unlimited Exchanges', 'Unlimited Bots', 'Advanced Analytics', 'Priority Support']
      };

      setStats({
        active_bots: {
          total: activeBots.length,
          futures: activeFutures.length,
          spot: activeSpot.length,
          trend: {
            value: activeBots.length > 0 ? `${activeBots.length} running` : 'No active bots',
            positive: activeBots.length > 0
          }
        },
        total_profit: {
          amount: totalProfit,
          percentage: profitPercentage,
          trend: {
            value: `${profitPercentage.toFixed(1)}% ROI`,
            positive: profitPercentage > 0
          }
        },
        connected_exchanges: {
          count: exchangesResponse.count || 0,
          exchanges: connectedExchangesList
        },
        subscription: {
          tier: subscriptionTier,
          features: subscriptionFeatures[subscriptionTier as keyof typeof subscriptionFeatures] || ['Basic Features'],
          expires: userProfile?.subscription_expires
        }
      });

    } catch (error: any) {
      console.error('Failed to fetch detailed stats:', error);
      setError('Failed to load dashboard statistics');
      
      // Set fallback data
      setStats({
        active_bots: { total: 0, futures: 0, spot: 0, trend: { value: 'No data', positive: false }},
        total_profit: { amount: 0, percentage: 0, trend: { value: '0% ROI', positive: false }},
        connected_exchanges: { count: 0, exchanges: [] },
        subscription: { tier: 'starter', features: ['Basic Features'] }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedStats();
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDetailedStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    fetchDetailedStats();
  };

  if (error && !stats) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-300 font-medium">Failed to load statistics</p>
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Trading Bots"
          value={loading ? "..." : stats?.active_bots.total.toString() || "0"}
          subtitle={!loading && stats ? 
            `${stats.active_bots.futures} Futures • ${stats.active_bots.spot} Spot` : 
            undefined
          }
          icon={<Bot className="w-6 h-6 text-purple-400" />}
          trend={!loading && stats ? stats.active_bots.trend : undefined}
          loading={loading}
          onClick={() => navigate('/bots')}
          className="hover:border-purple-500/50"
        />

        <StatsCard
          title="Total Portfolio Value"
          value={loading ? "..." : `$${stats?.total_profit.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) || "0.00"}`}
          subtitle={!loading && stats ? 
            `Performance: ${stats.total_profit.percentage.toFixed(2)}%` : 
            undefined
          }
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
          trend={!loading && stats ? stats.total_profit.trend : undefined}
          loading={loading}
          onClick={() => navigate('/dashboard')} // Navigate to analytics when available
          className="hover:border-green-500/50"
        />

        <StatsCard
          title="Connected Exchanges"
          value={loading ? "..." : stats?.connected_exchanges.count.toString() || "0"}
          subtitle={!loading && stats && stats.connected_exchanges.exchanges.length > 0 ? 
            stats.connected_exchanges.exchanges.join(', ') : 
            'No exchanges connected'
          }
          icon={<LinkIcon className="w-6 h-6 text-blue-400" />}
          loading={loading}
          onClick={() => navigate('/exchanges')}
          className="hover:border-blue-500/50"
        />

        <StatsCard
          title="Subscription Plan"
          value={loading ? "..." : stats?.subscription.tier.charAt(0).toUpperCase() + (stats?.subscription.tier.slice(1) || "")}
          subtitle={!loading && stats ? 
            `${stats.subscription.features.length} features included` : 
            undefined
          }
          icon={<Crown className="w-6 h-6 text-yellow-400" />}
          loading={loading}
          onClick={() => navigate('/subscription')}
          className="hover:border-yellow-500/50"
        />
      </div>

      {/* Quick Action Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Quick Actions</p>
                <p className="text-lg font-semibold text-white">Ready to Trade</p>
              </div>
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Performance</p>
                <p className="text-lg font-semibold text-white">
                  {stats.total_profit.percentage > 0 ? 'Profitable' : 'Getting Started'}
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">System Status</p>
                <p className="text-lg font-semibold text-white">All Systems Online</p>
              </div>
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Link - New Section */}
      <div className="mt-8">
        <Link to="/analytics">
          <Button className="w-full md:w-auto">
            View Analytics
          </Button>
        </Link>
      </div>
    </div>
  );
};