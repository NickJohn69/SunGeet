'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-black text-white p-6 text-center animate-fade-in">
      <h1 className="text-6xl font-black mb-4 tracking-tighter">404</h1>
      <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-8">This page got lost in the mix.</p>
      <Link 
        href="/" 
        className="px-8 py-3 bg-[#fa2d48] text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-[#fa2d48]/20"
      >
        Go Home
      </Link>
    </div>
  );
}
