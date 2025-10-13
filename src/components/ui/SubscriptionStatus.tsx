import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface SubscriptionStatusProps {
  status: 'active' | 'pending' | 'expired';
  plan: string;
  daysRemaining?: number;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  status, 
  plan, 
  daysRemaining 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          text: `${plan} Plan - Active`,
          className: 'bg-green-900/20 border-green-500/30 text-green-400'
        };
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-400" />,
          text: `Payment Pending${daysRemaining ? ` - ${daysRemaining} days left` : ''}`,
          className: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
        };
      case 'expired':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          text: 'Subscription Expired',
          className: 'bg-red-900/20 border-red-500/30 text-red-400'
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-gray-400" />,
          text: 'Unknown Status',
          className: 'bg-gray-900/20 border-gray-500/30 text-gray-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${config.className}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};