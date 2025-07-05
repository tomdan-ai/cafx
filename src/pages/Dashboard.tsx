import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { Plus, BarChart3, Zap, TrendingUp, Link2 } from 'lucide-react';

interface DashboardStatsType {
  active_bots: number;
  total_profit: number;
  connected_exchanges: number;
  subscription_tier: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real data from multiple endpoints
        const [botsResponse, exchangesResponse] = await Promise.all([
          apiService.getAllBots(),
          apiService.getConnectedExchanges()
        ]);

        console.log('Bots Response:', botsResponse);
        console.log('Exchanges Response:', exchangesResponse);

        // Handle the API response structure: { futures: [], spot: [] }
        const allBots = [
          ...(botsResponse.futures || []),
          ...(botsResponse.spot || [])
        ];

        // Calculate active bots (is_running = true)
        const activeBots = allBots.filter((bot: any) => bot.is_running === true).length;

        // Calculate total profit (this would need to be implemented in the API)
        // For now, we'll simulate based on investment amounts
        const totalProfit = allBots.reduce((sum: number, bot: any) => {
          // This is a simulation - real profit calculation should come from API
          const profitRate = bot.is_running ? 0.05 : 0.02; // 5% for running, 2% for stopped
          return sum + (parseFloat(bot.investment_amount || 0) * profitRate);
        }, 0);

        // Get connected exchanges count
        const connectedExchanges = exchangesResponse.count || 0;

        setStats({
          active_bots: activeBots,
          total_profit: totalProfit,
          connected_exchanges: connectedExchanges,
          subscription_tier: user?.subscription_tier || 'starter'
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Fallback to default data
        setStats({
          active_bots: 0,
          total_profit: 0,
          connected_exchanges: 0,
          subscription_tier: user?.subscription_tier || 'starter'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleCreateBot = () => {
    navigate('/bots');
  };

  const handleViewAnalytics = () => {
    // TODO: Navigate to analytics page when implemented
    console.log('View analytics clicked');
  };

  const handleConnectExchange = () => {
    navigate('/exchanges');
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

  return (
    <div className="space-y-8 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-blue-500/5 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-600/3 rounded-full blur-2xl animate-float-slow"></div>
      </div>

      {/* Welcome Section */}
      <div className="text-center space-y-4 relative z-10">
        <div className="animate-fadeInUp">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center space-x-3">
            <span>Welcome back,</span>
            <span className="text-gradient">{user?.username}!</span>
            <TrendingUp className="w-8 h-8 text-purple-500 animate-glow" />
          </h1>
        </div>
        <div className="animate-fadeInUp animation-delay-200">
          <p className="text-lg text-gray-400">
            Your trading dashboard is ready. Monitor your bots and track your profits.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="animate-slideInUp animation-delay-400">
        {stats && <DashboardStats stats={stats} />}
      </div>

      {/* Quick Actions */}
      <Card web3 className="animate-slideInUp animation-delay-600">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
            <span>Quick Actions</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="web3" 
            className="flex items-center justify-center space-x-2 h-12"
            onClick={handleCreateBot}
          >
            <Plus className="w-5 h-5" />
            <span>Create New Bot</span>
          </Button>
          <Button 
            variant="web3" 
            className="flex items-center justify-center space-x-2 h-12"
            onClick={handleViewAnalytics}
          >
            <BarChart3 className="w-5 h-5" />
            <span>View Analytics</span>
          </Button>
          <Button 
            variant="web3" 
            className="flex items-center justify-center space-x-2 h-12"
            onClick={handleConnectExchange}
          >
            <Link2 className="w-5 h-5" />
            <span>Connect Exchange</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideInUp animation-delay-800">
        <RecentActivity />
        <Card web3>
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400 animate-pulse" />
            <span>Performance Chart</span>
          </h3>
          <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 cyber-grid opacity-30"></div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-400">Advanced chart visualization coming soon</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};