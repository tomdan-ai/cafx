import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { apiService } from '../../utils/api';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ChartData {
  name: string;
  profit: number;
  investment: number;
  type: string;
}

export const PerformanceChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const [futuresResponse, spotResponse] = await Promise.all([
          apiService.getFuturesBots(),
          apiService.getSpotBots()
        ]);

        const futuresBots = Array.isArray(futuresResponse) ? futuresResponse : [];
        const spotBots = Array.isArray(spotResponse) ? spotResponse : [];
        const allBots = [
          ...futuresBots.map((b: any) => ({ ...b, type: 'futures' })),
          ...spotBots.map((b: any) => ({ ...b, type: 'spot' }))
        ];

        // Build chart data from active bots
        const activeBots = allBots.filter((bot: any) => bot.is_running);

        let totalP = 0;
        let totalI = 0;

        const data: ChartData[] = activeBots.map((bot: any) => {
          const profit = bot.profit_loss || bot.total_profit || 0;
          const investment = parseFloat(bot.investment_amount) || 0;
          totalP += profit;
          totalI += investment;

          return {
            name: bot.symbol || bot.pair || 'Unknown',
            profit: Math.round(profit * 100) / 100,
            investment: Math.round(investment * 100) / 100,
            type: bot.type
          };
        });

        setChartData(data);
        setTotalProfit(Math.round(totalP * 100) / 100);
        setTotalInvestment(Math.round(totalI * 100) / 100);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  const maxProfit = Math.max(...chartData.map(d => Math.abs(d.profit)), 1);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Performance</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trading Performance</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No active trades to display</p>
          <p className="text-gray-500 text-sm mt-1">Start a trading bot to see performance data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Trading Performance</h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total P&L</p>
            <p className={`font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Invested</p>
            <p className="font-bold text-white">${totalInvestment.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const profitWidth = (Math.abs(item.profit) / maxProfit) * 100;
          const isPositive = item.profit >= 0;
          const roi = item.investment > 0 ? (item.profit / item.investment) * 100 : 0;

          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{item.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'futures' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">${item.investment}</span>
                  <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}${item.profit}
                  </span>
                  <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    ({roi.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-6 bg-gray-700/50 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all duration-500 ${isPositive
                    ? 'bg-gradient-to-r from-green-500/50 to-green-400'
                    : 'bg-gradient-to-r from-red-500/50 to-red-400'
                    }`}
                  style={{ width: `${Math.max(profitWidth, 3)}%` }}
                >
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-300/70" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-300/70" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400"></div>
          <span className="text-xs text-gray-400">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400"></div>
          <span className="text-xs text-gray-400">Loss</span>
        </div>
      </div>
    </Card>
  );
};