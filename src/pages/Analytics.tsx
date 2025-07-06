import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RefreshCw, Filter } from 'lucide-react';
import { apiService } from '../utils/api';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // State for various charts
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [botPerformanceData, setBotPerformanceData] = useState<any[]>([]);
  const [tradingPairsData, setTradingPairsData] = useState<any[]>([]);
  const [tradeSuccessData, setTradeSuccessData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch bots data to generate analytics
      const botsResponse = await apiService.getAllBots();
      const allBots = [...(botsResponse.futures || []), ...(botsResponse.spot || [])];
      
      // Generate performance data (this would come from API in production)
      generatePerformanceData(allBots);
      generateBotPerformanceData(allBots);
      generateTradingPairsData(allBots);
      generateTradeSuccessData(allBots);
      
      if (isRefresh) {
        toast.success('Analytics data refreshed!');
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Helper functions to generate sample data based on bots
  const generatePerformanceData = (bots: any[]) => {
    // Generate daily data points for the selected time range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
    const data = [];
    
    let cumulativeProfit = 0;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate daily profit based on running bots
      const runningBots = bots.filter(b => b.is_running);
      const dailyProfit = runningBots.length * (Math.random() * 50 + 10);
      cumulativeProfit += dailyProfit;
      
      data.push({
        date: date.toISOString().split('T')[0],
        profit: Math.round(cumulativeProfit * 100) / 100,
      });
    }
    
    setPerformanceData(data);
  };
  
  const generateBotPerformanceData = (bots: any[]) => {
    // Take top 5 bots by simulated performance
    const botData = bots.slice(0, 5).map(bot => ({
      name: bot.symbol || `Bot ${bot.id}`,
      profit: parseFloat((Math.random() * 500 + 100).toFixed(2)),
      trades: Math.floor(Math.random() * 50 + 10)
    }));
    
    setBotPerformanceData(botData.sort((a, b) => b.profit - a.profit));
  };
  
  const generateTradingPairsData = (bots: any[]) => {
    // Group bots by trading pair
    const pairsMap = new Map();
    bots.forEach(bot => {
      const pair = bot.symbol || 'Unknown';
      pairsMap.set(pair, (pairsMap.get(pair) || 0) + 1);
    });
    
    const pairsData = Array.from(pairsMap).map(([name, value]) => ({ name, value }));
    setTradingPairsData(pairsData);
  };
  
  const generateTradeSuccessData = (_bots: any[]) => {
    // Generate success/failure rates
    setTradeSuccessData([
      { name: 'Successful', value: 67 },
      { name: 'Failed', value: 24 },
      { name: 'Pending', value: 9 }
    ]);
  };
  
  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">
            Visualize your trading performance and portfolio metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="flex bg-gray-800 rounded-lg overflow-hidden">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm ${
                  timeRange === range
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
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
      </div>
      
      {/* Welcome Message */}
      {user && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user.username}!
          </h2>
        </div>
      )}
      
      {/* Portfolio Performance Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
                formatter={(value) => [`$${value}`, 'Profit']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#82ca9d"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Two-column layout for additional charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bot Performance Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bot Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={botPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                  formatter={(value) => [`$${value}`, 'Profit']}
                />
                <Legend />
                <Bar
                  dataKey="profit"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Trading Pairs Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Pairs Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                />
                <Legend />
                <Pie
                  data={tradingPairsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#82ca9d"
                  label
                >
                  {tradingPairsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Success Rates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trade Success Rates</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tradeSuccessData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
                formatter={(value) => [`$${value}`, 'Profit']}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
