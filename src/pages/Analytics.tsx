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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-4">Analytics</h1>
        <p className="text-lg text-gray-300">Analytics page coming soon!</p>
      </div>
    </div>
  );
};
