import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Crown, Zap, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    icon: <Zap className="w-8 h-8 text-blue-400" />,
    features: [
      { text: 'Up to 3 trading bots', included: true },
      { text: '2 exchange connections', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced strategies', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
      { text: 'Custom indicators', included: false },
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 79,
    period: 'month',
    icon: <Crown className="w-8 h-8 text-purple-400" />,
    popular: true,
    features: [
      { text: 'Up to 10 trading bots', included: true },
      { text: '5 exchange connections', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Advanced strategies', included: true },
      { text: 'API access', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom indicators', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    period: 'month',
    icon: <Rocket className="w-8 h-8 text-orange-400" />,
    features: [
      { text: 'Unlimited trading bots', included: true },
      { text: 'Unlimited exchange connections', included: true },
      { text: 'Real-time analytics', included: true },
      { text: '24/7 priority support', included: true },
      { text: 'Advanced strategies', included: true },
      { text: 'Full API access', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom indicators', included: true },
    ]
  }
];

export const Subscription: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    setSelectedPlan(planId);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Subscription updated successfully!');
    } catch (error) {
      toast.error('Failed to update subscription');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-lg text-gray-400">
          Unlock the full potential of automated trading with our subscription tiers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-purple-500 shadow-purple-500/20' : ''}`}
            hover 
            glow={plan.popular}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {plan.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className={`w-5 h-5 ${feature.included ? 'text-green-400' : 'text-gray-600'}`} />
                  <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button
                onClick={() => handleSubscribe(plan.id)}
                loading={loading && selectedPlan === plan.id}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
              >
                {loading && selectedPlan === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="text-center">
        <h3 className="text-xl font-semibold text-white mb-4">Need a Custom Solution?</h3>
        <p className="text-gray-400 mb-6">
          Contact our team for enterprise plans and custom integrations
        </p>
        <Button variant="outline">
          Contact Sales
        </Button>
      </Card>
    </div>
  );
};