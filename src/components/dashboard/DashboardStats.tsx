import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, Bot, Link as LinkIcon, Crown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => (
  <Card hover glow className="group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.positive ? '+' : ''}{trend.value}
          </p>
        )}
      </div>
      <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
        {icon}
      </div>
    </div>
  </Card>
);

interface DashboardStatsProps {
  stats: {
    active_bots: number;
    total_profit: number;
    connected_exchanges: number;
    subscription_tier: string;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Active Bots"
        value={stats.active_bots.toString()}
        icon={<Bot className="w-6 h-6 text-purple-400" />}
        trend={{ value: "2 this week", positive: true }}
      />
      <StatsCard
        title="Total Profit"
        value={`$${stats.total_profit.toLocaleString()}`}
        icon={<TrendingUp className="w-6 h-6 text-green-400" />}
        trend={{ value: "12.5%", positive: true }}
      />
      <StatsCard
        title="Connected Exchanges"
        value={stats.connected_exchanges.toString()}
        icon={<LinkIcon className="w-6 h-6 text-blue-400" />}
      />
      <StatsCard
        title="Subscription"
        value={stats.subscription_tier.charAt(0).toUpperCase() + stats.subscription_tier.slice(1)}
        icon={<Crown className="w-6 h-6 text-yellow-400" />}
      />
    </div>
  );
};