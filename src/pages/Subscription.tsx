import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

const subscriptionPlans = [
	{
		slug: 'starter', // Changed from 'basic' to match API
		name: 'Basic Plan',
		label: 'built for beginners',
		price: '14 Days Free',
		features: [
			'Portfolio management',
			'14-days Free Trial',
			'Paper (simulated) trading',
			'Back testing',
			'Free access to trader community',
			'One open position/exchange',
			'24/7 market scanning',
			'Email and in-app notifications',
			'Spot trading',
		],
		buttonText: 'Start Free Trial',
		isHighlighted: false,
		isCurrent: false,
	},
	{
		slug: 'advanced',
		name: 'Advanced Plan',
		label: 'built for advanced traders',
		price: '14 Days Free',
		features: [
			'Portfolio management',
			'14-days Free Trial',
			'Paper (simulated) trading',
			'Back testing',
			'Free access to trader community',
			'Three open positions/exchange',
			'24/7 market scanning',
			'Email, in-app and WhatsApp notifications',
			'Spot trading',
			'Arbitrage trading',
		],
		buttonText: 'Start Free Trial',
		isHighlighted: true,
		isCurrent: false,
	},
	{
		slug: 'pro',
		name: 'Pro Plan',
		label: 'built for experts',
		price: '14 Days Free',
		features: [
			'Portfolio management',
			'14-days Free Trial',
			'Paper (simulated) trading',
			'Back testing',
			'Free access to trader community',
			'Ten open positions/exchange',
			'24/7 market scanning',
			'Email, in-app and WhatsApp notifications',
			'Spot trading',
			'Arbitrage trading',
			'Futures trading',
		],
		buttonText: 'Start Free Trial',
		isHighlighted: false,
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

	// Add this to the subscription page if needed
	const handleCancelSubscription = async () => {
		setLoading(true);
		try {
			await apiService.cancelSubscription();
			
			const updatedProfile = await apiService.getProfile();
			setUser(updatedProfile);
			
			toast.success('Subscription cancelled successfully!');
		} catch (error: any) {
			const errorMessage = error.response?.data?.detail || 'Cancellation failed.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black py-12 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="text-center space-y-4 mb-16">
					<h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
					<p className="text-lg text-gray-400">
						Unlock more features and power up your trading with a subscription.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{plans.map((plan, index) => (
						<div
							key={plan.slug}
							className={`relative ${
								plan.isHighlighted ? 'lg:scale-105 lg:z-10' : ''
							}`}
						>
							<div
								className={`rounded-2xl p-8 h-full flex flex-col ${
									plan.isHighlighted
										? 'bg-gradient-to-b from-purple-600 to-purple-700 text-white shadow-2xl shadow-purple-500/50'
										: 'bg-black border border-gray-800 text-white'
								}`}
							>
								{/* Header */}
								<div className="text-center mb-8">
									<h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
									<p className={`text-sm font-medium mb-4 ${
										plan.isHighlighted ? 'text-purple-200' : 'text-purple-400'
									}`}>
										{plan.label}
									</p>
									<div className="mb-6">
										<div className="text-3xl font-bold">{plan.price}</div>
									</div>
								</div>

								{/* Features */}
								<div className="flex-grow space-y-4 mb-8">
									{plan.features.map((feature, featureIndex) => (
										<div key={featureIndex} className="flex items-start space-x-3">
											<Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
												plan.isHighlighted ? 'text-white' : 'text-purple-400'
											}`} />
											<span className={`text-sm ${
												plan.isHighlighted ? 'text-white' : 'text-gray-300'
											}`}>
												{feature}
											</span>
										</div>
									))}
								</div>

								{/* CTA Button */}
								<div className="mt-auto">
									{plan.isHighlighted ? (
										<button
											onClick={() => handleSubscribe(plan.slug)}
											disabled={loading || plan.isCurrent}
											className="w-full py-3 px-6 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{loading && !plan.isCurrent ? (
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											) : null}
											{plan.isCurrent ? 'Current Plan' : plan.buttonText}
										</button>
									) : (
										<button
											onClick={() => handleSubscribe(plan.slug)}
											disabled={loading || plan.isCurrent}
											className="w-full py-3 px-6 bg-black border-2 border-purple-500 text-purple-500 rounded-lg font-semibold hover:bg-purple-500 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{loading && !plan.isCurrent ? (
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											) : null}
											{plan.isCurrent ? 'Current Plan' : plan.buttonText}
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="text-center text-gray-500 mt-12 text-sm">
					Note: This is a simulation. A real implementation would integrate a payment provider.
				</div>
			</div>
		</div>
	);
};