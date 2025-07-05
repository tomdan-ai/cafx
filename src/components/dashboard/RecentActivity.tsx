import React from 'react';
import { Card } from '../ui/Card';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'bot_started' | 'bot_stopped' | 'profit' | 'loss';
  message: string;
  timestamp: string;
  amount?: number;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'profit',
    message: 'BTC/USDT Grid Bot generated profit',
    timestamp: '2 hours ago',
    amount: 45.67
  },
  {
    id: '2',
    type: 'bot_started',
    message: 'ETH/USDT Futures Bot started',
    timestamp: '4 hours ago'
  },
  {
    id: '3',
    type: 'profit',
    message: 'BNB/USDT Spot Bot generated profit',
    timestamp: '6 hours ago',
    amount: 23.45
  },
  {
    id: '4',
    type: 'bot_stopped',
    message: 'ADA/USDT Grid Bot stopped',
    timestamp: '8 hours ago'
  }
];

export const RecentActivity: React.FC = () => {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'profit':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'loss':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
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
        {mockActivity.map((item) => (
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
                <span className="text-sm font-medium text-green-400">
                  +${item.amount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};