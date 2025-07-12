import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { Plus, BarChart3, Zap, TrendingUp, Link2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStatsType {
  active_bots: number;
  total_profit: number;
  connected_exchanges: number;
  subscription_tier: string;
  total_bots: number;
  running_futures_bots: number;
  running_spot_bots: number;
}

interface BotData {
  id: number;
  exchange: string;
  symbol: string;
  investment_amount: string;
  is_running: boolean;
  date_created: string;
  strategy_type: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch data from multiple endpoints
      const [botsResponse, exchangesResponse, userProfile] = await Promise.all([
        apiService.getAllBots(),
        apiService.getExchanges(),
        apiService.getUserProfile().catch(() => null)
      ]);

      const allBots = botsResponse || [];
      const exchanges = exchangesResponse || [];
      const connectedCount = exchanges.filter(ex => ex.is_connected).length;

      // Calculate totals
      const activeBots = allBots.filter(bot => bot.is_running);
      const runningFuturesBots = activeBots.filter(bot => bot.strategy_type === 'futures');
      const runningSpotBots = activeBots.filter(bot => bot.strategy_type === 'spot');

      // Calculate total profit (this would normally come from the API)
      const totalProfit = activeBots.reduce((total, bot) => {
        // This is a placeholder calculation - in real implementation, 
        // you'd get actual profit data from the API
        const amount = parseFloat(bot.investment_amount) || 0;
        const randomProfit = amount * (Math.random() * 0.1 - 0.05); // ±5% random profit for demo
        return total + randomProfit;
      }, 0);

      const subscriptionTier = userProfile?.subscription_tier || user?.subscription_tier || 'starter';

      const dashboardStats: DashboardStatsType = {
        active_bots: activeBots.length,
        total_profit: Math.round(totalProfit * 100) / 100, // Round to 2 decimal places
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
      console.error('Failed to fetch dashboard data:', error);
      
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
        toast.error('Failed to refresh dashboard data');
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

  const handleConnectExchange = () => {
    navigate('/exchanges');
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
             Here's an overview of Merlins Trading Performancee
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

      {/* Quick Actions */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleConnectExchange}
            className="flex flex-col items-center p-4 sm:p-6 h-auto text-center sm:col-span-2 lg:col-span-1"
          >
            <Link2 className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <span className="text-base sm:text-lg font-medium">Connect Exchange</span>
            <span className="text-xs sm:text-sm opacity-80 mt-1">Add trading platforms</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};