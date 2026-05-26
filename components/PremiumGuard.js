'use client';

import { Crown, Sparkles, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function PremiumGuard({ isOpen, onClose, featureName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div 
        className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#fa2d48] to-[#af52de] rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-[0_0_40px_rgba(250,45,72,0.4)] animate-bounce-slow">
            <Crown size={40} />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fa2d48] mb-4">Premium Feature</p>
          <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Unlock {featureName}</h2>
          
          <p className="text-sm font-medium text-white/40 mb-10 leading-relaxed">
            Upgrade to SunGeet Premium to access {featureName}, unlimited playlists, and an ad-free experience.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => {
                // Logic to start upgrade flow or redirect to plans
                window.location.href = '/plans';
              }}
              className="w-full py-4 bg-[#fa2d48] rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-[#fa2d48]/90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Get Premium
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 text-white/20 font-black uppercase tracking-widest text-[9px] hover:text-white transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
