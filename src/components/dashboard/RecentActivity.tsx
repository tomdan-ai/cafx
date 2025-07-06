import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Clock, TrendingUp, TrendingDown, Link2, Bot } from 'lucide-react';
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

        // Process exchange data
        const connectedExchanges = exchangesResponse.exchanges?.filter((ex: any) => ex.connected) || [];
        
        connectedExchanges.forEach((ex: any) => {
            // The API doesn't provide a connection timestamp, so we can't reliably add it to the timeline.
            // If a `date_connected` field were available, we would add it here.
            // For now, we will omit exchanges from the activity feed to avoid showing incorrect timestamps.
        });

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

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {loading ? (
            <div className="text-center text-gray-400">Loading activities...</div>
        ) : activity.length > 0 ? (
          activity.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
              <div className="flex-shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.message}</p>
                <p className="text-xs text-gray-400">{item.timestamp}</p>
              </div>
              {item.amount && (
                <div className="flex-shrink-0">
                  <span className={`text-sm font-medium ${item.type === 'profit' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.type === 'profit' ? '+' : '-'}${item.amount}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
            <div className="text-center text-gray-400">No recent activity.</div>
        )}
      </div>
    </Card>
  );
};