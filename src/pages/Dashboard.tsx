import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
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
        apiService.getConnectedExchanges(),
        apiService.getProfile().catch(() => null) // Optional user profile
      ]);

      console.log('Bots Response:', botsResponse);
      console.log('Exchanges Response:', exchangesResponse);
      console.log('User Profile:', userProfile);

      // Process bots data
      const futuresBots: BotData[] = botsResponse.futures || [];
      const spotBots: BotData[] = botsResponse.spot || [];
      const allBots = [...futuresBots, ...spotBots];

      // Calculate active bots
      const activeBots = allBots.filter(bot => bot.is_running === true);
      const runningFuturesBots = futuresBots.filter(bot => bot.is_running === true);
      const runningSpotBots = spotBots.filter(bot => bot.is_running === true);

      // Calculate total profit (simulation based on investment and running time)
      const calculateProfit = (bots: BotData[]) => {
        return bots.reduce((total, bot) => {
          const investment = parseFloat(bot.investment_amount || '0');
          
          // Calculate days running
          const createdDate = new Date(bot.date_created);
          const currentDate = new Date();
          const daysRunning = Math.max(1, Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          // Simulate profit based on strategy and running status
          let dailyRate = 0;
          if (bot.is_running) {
            // Higher rates for running bots
            dailyRate = bot.strategy_type === 'long' ? 0.008 : 0.006; // 0.8% or 0.6% daily
          } else {
            // Lower rates for stopped bots (past profits)
            dailyRate = bot.strategy_type === 'long' ? 0.004 : 0.003; // 0.4% or 0.3% daily
          }
          
          const botProfit = investment * dailyRate * daysRunning;
          return total + botProfit;
        }, 0);
      };

      const totalProfit = calculateProfit(allBots);

      // Get connected exchanges count
      const connectedCount = exchangesResponse.exchanges?.filter((ex: any) => ex.connected).length || 0;

      // Get subscription tier from user profile or fallback to user object
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
      
      if (!isRefresh) {
        // Fallback to default data only on initial load
        setStats({
          active_bots: 0,
          total_profit: 0,
          connected_exchanges: 0,
          subscription_tier: user?.subscription_tier || 'starter',
          total_bots: 0,
          running_futures_bots: 0,
          running_spot_bots: 0
        });
      }
      
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 60 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const handleCreateBot = () => {
    navigate('/bots');
  };

  const handleViewAnalytics = () => {
    // TODO: Navigate to analytics page when implemented
    toast.info('Analytics page coming soon!');
  };

  const handleConnectExchange = () => {
    navigate('/exchanges');
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-500 animate-spin animation-delay-200"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400 mt-1">
            Here's an overview of your trading performance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          loading={refreshing}
          disabled={refreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateBot}
            className="flex flex-col items-center p-6 h-auto"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">Create Bot</span>
            <span className="text-sm opacity-80">Start automated trading</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleViewAnalytics}
            className="flex flex-col items-center p-6 h-auto"
          >
            <BarChart3 className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">View Analytics</span>
            <span className="text-sm opacity-80">Track your performance</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleConnectExchange}
            className="flex flex-col items-center p-6 h-auto"
          >
            <Link2 className="w-8 h-8 mb-2" />
            <span className="text-lg font-medium">Connect Exchange</span>
            <span className="text-sm opacity-80">Add trading platforms</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};