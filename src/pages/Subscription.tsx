import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Check, X, Mail, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlan, SubscriptionStatus } from '../types';

const subscriptionPlans: SubscriptionPlan[] = [
    {
        slug: 'starter',
        name: 'Starter Plan',
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
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [plans, setPlans] = useState<SubscriptionPlan[]>(subscriptionPlans);
    const [loading, setLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');

    useEffect(() => {
        const updatedPlans = subscriptionPlans.map((plan) => ({
            ...plan,
            isCurrent: plan.slug === user?.subscription_tier,
        }));
        setPlans(updatedPlans);
        
        // Fetch subscription status to check for pending invoices
        fetchSubscriptionStatus();
    }, [user]);

    const fetchSubscriptionStatus = async () => {
        try {
            const status = await apiService.getSubscriptionStatus();
            setSubscriptionStatus(status);
        } catch (error) {
            // Status endpoint might not exist yet, that's okay
            console.log('Subscription status not available');
        }
    };

    const handleSubscribe = async (slug: string) => {
        if (user?.subscription_tier === slug) {
            toast('This is already your current plan.');
            return;
        }

        setLoading(true);
        setSelectedPlan(slug);
        
        try {
            // Send subscription request to backend
            const response = await apiService.subscribe(slug);
            
            // Show success state
            setShowSuccess(true);
            toast.success('Invoice generated successfully! Please check your email for payment instructions.');
            
            // Update UI to show email instructions
            setTimeout(() => {
                setShowSuccess(false);
            }, 10000); // Hide success message after 10 seconds
            
        } catch (error: any) {
            const status = error.response?.status;
            const data = error.response?.data;
            const detail = data?.detail || data?.error || '';

            // Handle different error scenarios as per documentation
            if (status === 400) {
                toast.error(detail || 'Invalid subscription plan');
            } else if (status === 401) {
                toast.error('Authentication required. Please log in again.');
                navigate('/auth/login');
            } else if (status === 409) {
                toast.error('You already have an active subscription');
                // Refresh user profile
                try {
                    const updatedProfile = await apiService.getProfile();
                    setUser(updatedProfile);
                } catch {
                    // Ignore profile refresh error
                }
            } else if (status >= 500) {
                toast.error('Server error. Please try again in a moment.');
            } else {
                toast.error(detail || 'Unable to process subscription request');
            }
        } finally {
            setLoading(false);
            setSelectedPlan('');
        }
    };

    const handleResendInvoice = async () => {
        try {
            await apiService.resendInvoice();
            toast.success('Invoice resent to your email!');
        } catch (error) {
            toast.error('Failed to resend invoice. Please try again.');
        }
    };

    const PendingPaymentNotice = () => (
        subscriptionStatus?.pending_payment && (
            <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-yellow-400 font-semibold mb-1">Pending Payment</h3>
                        <p className="text-gray-300 text-sm mb-3">
                            You have a pending invoice for your subscription renewal. 
                            {subscriptionStatus.days_remaining && 
                                ` You have ${subscriptionStatus.days_remaining} days remaining to complete payment.`
                            }
                        </p>
                        <button
                            onClick={handleResendInvoice}
                            className="inline-flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Resend Invoice Email</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    const SuccessMessage = () => (
        showSuccess && (
            <div className="mb-8 p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-400 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-green-400 font-semibold text-lg mb-2">Invoice Generated Successfully!</h3>
                        <div className="text-gray-300 space-y-2">
                            <p>• A payment invoice has been sent to your registered email address</p>
                            <p>• Click the payment link in the email to complete your subscription</p>
                            <p>• Your subscription will be activated automatically after payment confirmation</p>
                            <p>• No need to return to this page - activation is automatic!</p>
                        </div>
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                            <p className="text-blue-300 text-sm flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                Please check your email inbox (and spam folder) for the payment link
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    return (
        <div className="min-h-screen bg-black py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="text-center space-y-4 mb-16">
                    <h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
                    <p className="text-lg text-gray-400">
                        Select a plan and receive a secure payment invoice via email.
                    </p>
                </div>

                {/* Pending Payment Notice */}
                <PendingPaymentNotice />

                {/* Success Message */}
                <SuccessMessage />

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
                                        ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500'
                                        : 'bg-gray-900/50 border border-gray-700'
                                } backdrop-blur-sm hover:bg-gray-800/60 transition-all duration-300`}
                            >
                                {/* Popular badge */}
                                {plan.isHighlighted && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="text-center mb-8">
                                    <h3 className={`text-2xl font-bold mb-2 ${
                                        plan.isHighlighted ? 'text-white' : 'text-gray-100'
                                    }`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm ${
                                        plan.isHighlighted ? 'text-purple-200' : 'text-gray-400'
                                    }`}>
                                        {plan.label}
                                    </p>
                                    <div className="mt-4">
                                        <span className={`text-3xl font-bold ${
                                            plan.isHighlighted ? 'text-white' : 'text-gray-100'
                                        }`}>
                                            {plan.price}
                                        </span>
                                    </div>
                                </div>

                                {/* Features list */}
                                <div className="flex-1">
                                    {plan.features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="flex items-center space-x-3 mb-3">
                                            <Check className={`w-5 h-5 flex-shrink-0 ${
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
                                            {loading && selectedPlan === plan.slug ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generating Invoice...
                                                </div>
                                            ) : (
                                                plan.isCurrent ? 'Current Plan' : plan.buttonText
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(plan.slug)}
                                            disabled={loading || plan.isCurrent}
                                            className="w-full py-3 px-6 bg-black border-2 border-purple-500 text-purple-500 rounded-lg font-semibold hover:bg-purple-500 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading && selectedPlan === plan.slug ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generating Invoice...
                                                </div>
                                            ) : (
                                                plan.isCurrent ? 'Current Plan' : plan.buttonText
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center text-gray-500 mt-12 text-sm">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Secure payment processing via BlockRadar invoicing system</span>
                    </div>
                    <p>Subscription activates automatically upon payment confirmation</p>
                </div>
            </div>
        </div>
    );
};