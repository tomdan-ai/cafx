import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { CheckCircle, Star } from 'lucide-react';

const subscriptionPlans = [
	{
		slug: 'starter',
		name: 'Starter',
		price: 'Free',
		features: [
			'1 Active Trading Bot',
			'Basic Analytics',
			'Limited Exchange Integrations',
			'Community Support',
		],
		isCurrent: false,
	},
	{
		slug: 'advanced',
		name: 'Advanced',
		price: '$29/mo',
		features: [
			'10 Active Trading Bots',
			'Advanced Analytics & Insights',
			'All Exchange Integrations',
			'Priority Support',
			'Auto-Trader Access',
		],
		isCurrent: false,
	},
	{
		slug: 'pro',
		name: 'Pro',
		price: '$99/mo',
		features: [
			'Unlimited Trading Bots',
			'Full Analytics Suite',
			'All Exchange Integrations',
			'Dedicated 24/7 Support',
			'API Access for Custom Bots',
		],
		isCurrent: false,
	},
];

export const Subscription: React.FC = () => {
	const user = useAuthStore((state) => state.user);
	const setUser = useAuthStore((state) => state.setUser);
	const [plans, setPlans] = useState(subscriptionPlans);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const updatedPlans = plans.map((plan) => ({
			...plan,
			isCurrent: plan.slug === user?.subscription_tier,
		}));
		setPlans(updatedPlans);
	}, [user, plans]);

	const handleSubscribe = async (slug: string) => {
		if (user?.subscription_tier === slug) {
			toast('This is already your current plan.');
			return;
		}

		setLoading(true);
		try {
			await apiService.subscribe(slug);

			const updatedProfile = await apiService.getProfile();
			setUser(updatedProfile);

			toast.success(`Successfully subscribed to the ${slug} plan!`);
		} catch (error: any) {
			const errorMessage = error.response?.data?.detail || 'Subscription failed.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
				<p className="text-lg text-gray-400">
					Unlock more features and power up your trading with a subscription.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				{plans.map((plan) => (
					<Card
						key={plan.slug}
						className={`flex flex-col ${plan.isCurrent ? 'border-purple-500' : ''}`}
						hover={!plan.isCurrent}
						glow={plan.isCurrent}
					>
						<div className="p-6">
							<h3 className="text-2xl font-bold text-white">{plan.name}</h3>
							<p className="text-4xl font-extrabold text-white my-4">{plan.price}</p>
							<p className="text-sm text-gray-400">
								{plan.slug === 'starter'
									? 'Perfect for getting started.'
									: 'For serious traders.'}
							</p>
						</div>
						<div className="p-6 flex-grow space-y-4">
							{plan.features.map((feature, index) => (
								<div key={index} className="flex items-center space-x-3">
									<CheckCircle className="w-5 h-5 text-green-400" />
									<span className="text-gray-300">{feature}</span>
								</div>
							))}
						</div>
						<div className="p-6">
							<Button
								variant={plan.isCurrent ? 'outline' : 'primary'}
								className="w-full"
								onClick={() => handleSubscribe(plan.slug)}
								disabled={loading}
								loading={loading && !plan.isCurrent}
							>
								{plan.isCurrent ? 'Current Plan' : 'Choose Plan'}
							</Button>
						</div>
					</Card>
				))}
			</div>
			<div className="text-center text-gray-500 mt-4 text-sm">
				Note: This is a simulation. A real implementation would integrate a payment provider.
			</div>
		</div>
	);
};