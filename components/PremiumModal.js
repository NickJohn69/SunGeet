'use client';

import { X, Check, Sparkles, Zap, ShieldCheck, Headphones, Download, Clock } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function PremiumModal({ isOpen, onClose }) {
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const plans = [
    {
      name: "Free",
      price: "0",
      accent: "white/20",
      icon: <Headphones size={24} />,
      features: [
        "Standard Audio Quality",
        "Visual Advertisements",
        "Public Mixes only",
        "Limited Skip limits"
      ],
      current: true
    },
    {
      name: "Premium",
      price: "100",
      accent: "#fa2d48",
      icon: <Sparkles size={24} className="text-[#fa2d48]" />,
      features: [
        "High-Fidelity Sound",
        "Zero Advertisements",
        "Unlimited Playlists",
        "Unlimited Skips",
        "Exclusive Gold Theme",
        "Priority Support"
      ],
      recommended: true
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0c0c0d] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors z-50">
           <X size={20} />
        </button>

        <div className="p-10 md:p-16">
           <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fa2d48]/10 text-[#fa2d48] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                 <Sparkles size={14} /> SunGeet Pro
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">Experience music <br />without limits.</h2>
              <p className="text-white/40 font-medium max-w-sm mx-auto">Select a plan that fits your listening style. Upgrade or cancel anytime.</p>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.name}
                  className={`relative p-8 rounded-[2rem] border transition-all duration-300 ${plan.recommended ? 'bg-white/5 border-[#fa2d48]/30 shadow-[0_20px_50px_rgba(250,45,72,0.1)] scale-105' : 'bg-transparent border-white/5 opacity-60'}`}
                >
                   {plan.recommended && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#fa2d48] rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                        Recommended
                     </div>
                   )}
                   
                   <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                         {plan.icon}
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-black uppercase tracking-widest text-white/20">Monthly</span>
                         <p className="text-2xl font-black text-white">NPR {plan.price}</p>
                      </div>
                   </div>

                   <h3 className="text-xl font-bold mb-6">{plan.name}</h3>
                   
                   <div className="space-y-4 mb-10">
                      {plan.features.map(feat => (
                        <div key={feat} className="flex items-center gap-3 text-sm font-medium text-white/50">
                           <Check size={16} className={plan.recommended ? 'text-[#fa2d48]' : 'text-white/20'} />
                           <span>{feat}</span>
                        </div>
                      ))}
                   </div>

                   <button 
                     className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg ${plan.recommended ? 'bg-[#fa2d48] text-white hover:bg-[#fa2d48]/90' : 'bg-white/5 text-white/30 cursor-default'}`}
                   >
                      {plan.current ? 'Current Plan' : 'Grab Premium'}
                   </button>
                </div>
              ))}
           </div>
           
           <p className="mt-12 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <ShieldCheck size={12} /> Secure 256-bit Transaction
           </p>
        </div>
      </div>
    </div>
  );
}
