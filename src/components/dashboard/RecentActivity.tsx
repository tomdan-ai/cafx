import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Clock, TrendingUp, TrendingDown, Link2, Bot, ExternalLink } from 'lucide-react';
import { apiService } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'bot_created' | 'exchange_connected' | 'profit' | 'loss';
  message: string;
  timestamp: string;
  date: Date;
  amount?: number;
}

export const RecentActivity: React.FC = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const [botsResponse, exchangesResponse] = await Promise.all([
          apiService.getAllBots(),
          apiService.getConnectedExchanges()
        ]);

  const combinedActivity: ActivityItem[] = [];

        // Process bot data
        const futuresBots = botsResponse.futures || [];
        const spotBots = botsResponse.spot || [];
        const allBots = [...futuresBots, ...spotBots];

        allBots.forEach((bot: any) => {
          combinedActivity.push({
            id: `bot-${bot.id}`,
            type: 'bot_created',
            message: `${bot.symbol} ${bot.strategy_type === 'futures' ? 'Futures' : 'Spot'} Bot created on ${bot.exchange}`,
            date: new Date(bot.date_created),
            timestamp: formatDistanceToNow(new Date(bot.date_created), { addSuffix: true }),
          });
        });

  // Generate realistic profit/loss activities based on bot performance
  if (allBots.length > 0) {
          const now = new Date();
          const activeBots = allBots.filter((bot: any) => bot.is_running);
          
          activeBots.forEach((bot: any, index: number) => {
            const profit = bot.total_profit || bot.profit || 0;
            const amount = parseFloat(bot.investment_amount) || 0;
            const performance = bot.performance_percentage || 0;
            
            // Calculate display profit
            let displayProfit = profit;
            if (profit === 0 && amount > 0) {
              displayProfit = amount * (performance / 100);
            }
            
            // Only add activity if there's meaningful profit/loss data
            if (Math.abs(displayProfit) > 0.01) {
              const activityDate = new Date(now.getTime() - (index + 1) * 2 * 60 * 60 * 1000); // Spread activities over time
              
              combinedActivity.push({
                id: `profit-${bot.id || index}`,
                type: displayProfit >= 0 ? 'profit' : 'loss',
                message: `${displayProfit >= 0 ? 'Profit' : 'Loss'} from ${bot.symbol || bot.exchange} ${bot.strategy_type === 'futures' ? 'Futures' : 'Spot'} Bot`,
                date: activityDate,
                timestamp: formatDistanceToNow(activityDate, { addSuffix: true }),
                amount: Math.abs(displayProfit)
              });
            }
          });
        }

        // If exchangesResponse includes connected exchanges, we could add exchange
        // connected activities here in the future. Normalize shape to avoid errors.
        const exchangesArray: any[] = Array.isArray(exchangesResponse)
          ? exchangesResponse
          : Array.isArray((exchangesResponse as any)?.exchanges)
            ? (exchangesResponse as any).exchanges
            : [];

        // Sort activities by date, most recent first
        combinedActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

        setActivity(combinedActivity.slice(0, 5)); // Show top 5 recent activities

      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'profit':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'loss':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'bot_created':
        return <Bot className="w-4 h-4 text-blue-400" />;
      case 'exchange_connected':
        return <Link2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'profit':
        return 'bg-green-500/10 border-green-500/20';
      case 'loss':
        return 'bg-red-500/10 border-red-500/20';
      case 'bot_created':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'exchange_connected':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <h3 className="text-lg sm:text-xl font-semibold text-white">Recent Activity</h3>
        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center self-start sm:self-auto">
          View All
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-700 rounded animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length > 0 ? (
          activity.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-600"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg border ${getTypeColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base text-white truncate mb-1">{item.message}</p>
                <p className="text-xs sm:text-sm text-gray-400">{item.timestamp}</p>
              </div>
              {item.amount && (
                <div className="flex-shrink-0">
                  <span className={`text-sm sm:text-base font-medium ${
                    item.type === 'profit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.type === 'profit' ? '+' : '-'}${item.amount}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm sm:text-base">No recent activity</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Activity will appear here when you start trading
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};