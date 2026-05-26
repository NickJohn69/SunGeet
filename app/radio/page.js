'use client';

import { Radio as RadioIcon, Play } from 'lucide-react';
import useStore from '../../store/useStore';
import { useEffect, useState } from 'react';

export default function RadioPage() {
  const [recommendations, setRecommendations] = useState([]);
  const { setCurrentSong } = useStore();

  useEffect(() => {
    fetch('/api/search?q=radio%20mix%20hits')
      .then(res => res.json())
      .then(data => setRecommendations(data.slice(0, 12)));
  }, []);

  return (
    <div className="px-8 pb-32 animate-fade-in bg-black min-h-screen text-white">
      <div className="pt-12 mb-10">
        <h1 className="text-[44px] font-black tracking-tight leading-none mb-4">Radio</h1>
        <div className="h-[1px] bg-white/10 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((song) => (
          <div 
            key={song.id} 
            className="relative aspect-video rounded-3xl overflow-hidden group cursor-pointer shadow-2xl"
            onClick={() => setCurrentSong(song)}
          >
            <img src={song.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-[#fa2d48] rounded-full flex items-center justify-center">
                    <RadioIcon size={20} />
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#fa2d48]">Live Radio</p>
              </div>
              <h3 className="text-xl font-bold">{song.title} Station</h3>
              <p className="text-sm text-white/60">Curated by SunGeet</p>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                  <Play size={28} fill="black" className="ml-1 text-black" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
