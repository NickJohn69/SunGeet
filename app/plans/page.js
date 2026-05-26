'use client';

import { useState, useEffect } from 'react';
import { Crown, Check, Zap, Music, Download, Radio, Headphones, Star, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function PlansPage() {
  const { user, userPlan, upgradePlan, downgradePlan } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleUpgrade = async () => {
    if (!user) return alert('Please sign in to upgrade.');
    setIsProcessing(true);
    try {
      await upgradePlan();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Failed to upgrade plan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await downgradePlan();
    } catch (err) {
      alert('Failed to change plan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Get started with the essentials',
      color: 'from-white/10 to-white/5',
      borderColor: 'border-white/10',
      accentColor: 'text-white/60',
      features: [
        { text: 'Stream unlimited songs', icon: Music },
        { text: 'Create up to 3 playlists', icon: Headphones },
        { text: 'Max 10 songs per playlist', icon: Radio },
        { text: 'Search & discover music', icon: Zap },
      ],
      cta: userPlan === 'free' ? 'Current Plan' : 'Downgrade',
      disabled: userPlan === 'free',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '100',
      period: '/month',
      description: 'The ultimate music experience',
      color: 'from-[#fa2d48]/20 to-[#af52de]/10',
      borderColor: 'border-[#fa2d48]/30',
      accentColor: 'text-[#fa2d48]',
      badge: 'MOST POPULAR',
      features: [
        { text: 'Everything in Free', icon: Check },
        { text: 'Unlimited playlists', icon: Star },
        { text: 'High-fidelity audio (320kbps)', icon: Headphones },
        { text: 'Offline downloads', icon: Download },
        { text: 'Ad-free experience', icon: Zap },
        { text: 'Lyrics & visualizer', icon: Sparkles },
      ],
      cta: userPlan === 'premium' ? 'Current Plan' : 'Upgrade Now',
      disabled: userPlan === 'premium',
    },
  ];

  return (
    <div className="animate-fade-in bg-black min-h-screen text-white pb-32">
      <div className="px-8 pt-12 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#fa2d48]/10 text-[#fa2d48] px-4 py-1.5 rounded-full mb-6">
            <Crown size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Choose Your Plan</span>
          </div>
          <h1 className="text-[44px] font-black tracking-tight leading-none mb-4">
            Unlock the Full<br />
            <span className="bg-gradient-to-r from-[#fa2d48] to-[#af52de] bg-clip-text text-transparent">SunGeet Experience</span>
          </h1>
          <p className="text-white/40 text-sm font-medium max-w-md mx-auto">
            Choose the plan that's right for you. Upgrade anytime to enjoy premium features.
          </p>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-[200] bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-2xl backdrop-blur-md">
            <Check size={20} />
            <span className="text-sm font-bold">Successfully upgraded to Premium!</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br ${plan.color} border ${plan.borderColor} rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group ${
                mounted && userPlan === plan.id ? 'ring-2 ring-[#fa2d48]/50' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-8 bg-gradient-to-r from-[#fa2d48] to-[#ff6b6b] text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}

              {/* Current Plan Indicator */}
              {mounted && userPlan === plan.id && (
                <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-[#fa2d48]/20 text-[#fa2d48] px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fa2d48] animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8 pt-2">
                <h3 className={`text-lg font-black uppercase tracking-wider ${plan.accentColor} mb-2`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-white/40 font-bold">NPR</span>
                  <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-sm text-white/30 font-medium">{plan.period}</span>
                </div>
                <p className="text-xs text-white/30 mt-3 font-medium">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center ${plan.accentColor} flex-shrink-0`}>
                      <feature.icon size={14} />
                    </div>
                    <span className="text-sm font-medium text-white/70">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => {
                  if (plan.id === 'premium' && userPlan !== 'premium') handleUpgrade();
                  if (plan.id === 'free' && userPlan !== 'free') handleDowngrade();
                }}
                disabled={plan.disabled || isProcessing}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  plan.disabled
                    ? 'bg-white/5 text-white/20 cursor-default'
                    : plan.id === 'premium'
                    ? 'bg-gradient-to-r from-[#fa2d48] to-[#ff453a] text-white shadow-lg shadow-[#fa2d48]/20 hover:shadow-[#fa2d48]/40'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    {!plan.disabled && <ArrowRight size={14} />}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-[10px] text-white/15 uppercase tracking-[0.3em] font-black mt-16">
          Plans can be changed at any time • No hidden fees
        </p>
      </div>
    </div>
  );
}
