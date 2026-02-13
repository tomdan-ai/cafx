import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { RefreshCw, Wallet, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { apiService } from '../utils/api';
import TradingViewChart from '../components/ui/TradingViewChart';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chartSymbol, setChartSymbol] = useState('BTCUSDT');

  // State for various charts
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [botPerformanceData, setBotPerformanceData] = useState<any[]>([]);
  const [tradingPairsData, setTradingPairsData] = useState<any[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalProfit: 0,
    totalBots: 0,
    activeBots: 0,
  });

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

      const [botsResponse, profileData] = await Promise.all([
        apiService.getAllBots(),
        apiService.getProfile().catch((err) => {
          console.error('Failed to fetch profile for PnL:', err);
          return null;
        })
      ]);
      const allBots = [...(botsResponse.futures || []), ...(botsResponse.spot || [])];

      generatePerformanceData(allBots);
      generateBotPerformanceData(allBots);
      generateTradingPairsData(allBots);

      // Use cumulative_pnl from the profile API as the authoritative PnL
      const activeBots = allBots.filter((b: any) => b.is_running);
      const cumulativePnl = Number(profileData?.cumulative_pnl) || 0;
      const totalProfit = Math.round(cumulativePnl * 100) / 100;
      setPortfolioStats({
        totalValue: totalProfit,
        totalProfit: totalProfit,
        totalBots: allBots.length,
        activeBots: activeBots.length,
      });

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

  const generatePerformanceData = (bots: any[]) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
    const data = [];

    let cumulativeProfit = 0;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const runningBots = bots.filter(b => b.is_running);
      const dailyProfit = runningBots.length * (Math.random() * 50 + 10);
      cumulativeProfit += dailyProfit;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: Math.round(cumulativeProfit * 100) / 100,
      });
    }

    setPerformanceData(data);
  };

  const generateBotPerformanceData = (bots: any[]) => {
    const botData = bots.slice(0, 5).map(bot => ({
      name: bot.symbol || bot.pair || `Bot ${bot.id}`,
      profit: parseFloat((Math.random() * 500 + 100).toFixed(2)),
      trades: Math.floor(Math.random() * 50 + 10)
    }));

    setBotPerformanceData(botData.sort((a, b) => b.profit - a.profit));
  };

  const generateTradingPairsData = (bots: any[]) => {
    const pairsMap = new Map();
    bots.forEach(bot => {
      const pair = bot.symbol || bot.pair || 'Unknown';
      pairsMap.set(pair, (pairsMap.get(pair) || 0) + 1);
    });

    const pairsData = Array.from(pairsMap).map(([name, value]) => ({ name, value }));
    setTradingPairsData(pairsData);
  };

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  const COLORS = ['#7F5AF0', '#10B981', '#F59E0B', '#EF4444', '#2563EB', '#06B6D4'];
  const QUICK_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loader-premium" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header — fully responsive */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Portfolio</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Your trading performance & market overview
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-light)] transition-all flex items-center justify-center disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Time range pills — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${timeRange === range
                ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-purple-500/20'
                : 'bg-[var(--color-surface)] text-gray-400 border border-[var(--color-border)] hover:text-white hover:border-[var(--color-border-light)]'
                }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Portfolio Value</p>
          <p className="text-lg sm:text-xl font-bold text-white">${portfolioStats.totalValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Total Profit</p>
          <p className={`text-lg sm:text-xl font-bold ${portfolioStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolioStats.totalProfit >= 0 ? '+' : ''}${portfolioStats.totalProfit.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-secondary)]/15 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[var(--color-secondary)]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Total Bots</p>
          <p className="text-lg sm:text-xl font-bold text-white">{portfolioStats.totalBots}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-warning)]/15 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-[var(--color-warning)]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Active Bots</p>
          <p className="text-lg sm:text-xl font-bold text-white">{portfolioStats.activeBots}</p>
        </Card>
      </div>

      {/* TradingView Market Chart */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">Market Overview</h3>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {QUICK_SYMBOLS.map(sym => (
              <button
                key={sym}
                onClick={() => setChartSymbol(sym)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${chartSymbol === sym
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-surface-light)] text-gray-400 border border-transparent hover:text-white'
                  }`}
              >
                {sym.replace('USDT', '')}
              </button>
            ))}
          </div>
        </div>
        <TradingViewChart
          symbol={chartSymbol}
          height={window.innerWidth < 640 ? 300 : 420}
          interval="60"
          showToolbar={window.innerWidth >= 640}
        />
      </Card>

      {/* Portfolio Performance Chart */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                interval={Math.max(1, Math.floor(performanceData.length / 6))}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 26, 0.95)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
                formatter={(value) => [`$${value}`, 'Profit']}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#0f0f1a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-column layout — stacks on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Bot Performance Comparison */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bot Performance</h3>
          {botPerformanceData.length > 0 ? (
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={botPerformanceData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 15, 26, 0.95)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [`$${value}`, 'Profit']}
                  />
                  <Bar
                    dataKey="profit"
                    fill="#7F5AF0"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-500">
              <p>No bot data yet — create a bot to see performance</p>
            </div>
          )}
        </Card>

        {/* Trading Pairs Distribution */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Pairs</h3>
          {tradingPairsData.length > 0 ? (
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 15, 26, 0.95)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Pie
                    data={tradingPairsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={3}
                    label={({ name }) => name}
                  >
                    {tradingPairsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-500">
              <p>No trading pairs yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
