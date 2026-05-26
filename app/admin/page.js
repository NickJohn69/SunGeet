'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Users, Music, ListMusic, TrendingUp, Activity, Database, Globe, Crown, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { isSuperAdmin, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isSuperAdmin()) {
      router.push('/');
    }
    if (mounted && isSuperAdmin()) {
      fetchAdminStats();
    }
  }, [mounted]);

  const fetchAdminStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_stats');
      if (rpcError) throw rpcError;
      setStats(data);
    } catch (err) {
      console.error('Admin stats error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isSuperAdmin()) return null;

  const statCards = stats ? [
    { label: "Total Users", value: stats.total_users || 0, icon: <Users size={20} />, color: "from-blue-500/20 to-blue-600/5" },
    { label: "Total Playlists", value: stats.total_playlists || 0, icon: <ListMusic size={20} />, color: "from-purple-500/20 to-purple-600/5" },
    { label: "Saved Songs", value: stats.total_songs || 0, icon: <Music size={20} />, color: "from-pink-500/20 to-pink-600/5" },
    { label: "Premium Users", value: stats.premium_users || 0, icon: <Crown size={20} />, color: "from-[#fa2d48]/20 to-[#fa2d48]/5" },
  ] : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 lg:p-12 animate-fade-in pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <div className="flex items-center gap-2 text-[#fa2d48] mb-2">
               <ShieldCheck size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Authority</span>
            </div>
            <h1 className="text-[44px] font-black tracking-tight leading-none">Master Control</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAdminStats}
              disabled={loading}
              className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
              title="Refresh data"
            >
              <RefreshCw size={18} className={`text-white/40 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 shadow-2xl">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fa2d48] to-[#ff453a] flex items-center justify-center text-white font-black">
                  {user?.email?.[0].toUpperCase()}
               </div>
               <div className="pr-4">
                  <p className="text-xs font-bold leading-none">{user?.email}</p>
                  <p className="text-[10px] text-white/40 mt-1 uppercase font-black tracking-widest">Super Admin</p>
               </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
            Failed to load stats: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 size={40} className="animate-spin text-[#fa2d48] mx-auto mb-4" />
              <p className="text-white/40 text-sm font-bold">Loading platform data...</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {!loading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {statCards.map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/5 p-8 rounded-[2.5rem] group hover:border-[#fa2d48]/30 transition-all shadow-xl`}>
                   <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-[#fa2d48] transition-colors">
                         {stat.icon}
                      </div>
                   </div>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                   <h3 className="text-3xl font-black tracking-tighter">{stat.value.toLocaleString()}</h3>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               
               {/* Users Table - Takes 2 columns */}
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-8">
                     <h2 className="text-xl font-black mb-8 flex items-center gap-2">
                        <Users size={20} className="text-[#fa2d48]" /> All Users
                        <span className="ml-auto text-[10px] font-black text-white/20 uppercase tracking-widest">
                          {stats.user_plan_details?.length || 0} total
                        </span>
                     </h2>

                     {/* Table Header */}
                     <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                        <span className="w-8">#</span>
                        <span className="flex-1">User</span>
                        <span className="w-24 text-center">Plan</span>
                        <span className="w-28">Joined</span>
                        <span className="w-24">Last Seen</span>
                     </div>

                     {/* User Rows */}
                     <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                       {stats.user_plan_details?.map((u, i) => (
                         <div key={u.user_id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                            <span className="w-8 text-[11px] font-black text-white/20">{i + 1}</span>
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                               <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 ${
                                 u.plan === 'premium' 
                                   ? 'bg-gradient-to-br from-[#fa2d48] to-[#af52de]' 
                                   : 'bg-white/10'
                               }`}>
                                  {(u.display_name || u.email)?.[0]?.toUpperCase() || '?'}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-sm font-bold truncate group-hover:text-[#fa2d48] transition-colors">
                                    {u.display_name || 'Unnamed'}
                                  </p>
                                  <p className="text-[10px] text-white/30 truncate">{u.email}</p>
                               </div>
                            </div>
                            <div className="w-24 flex justify-center">
                              {u.plan === 'premium' ? (
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#fa2d48]/20 to-[#af52de]/20 text-[#fa2d48] px-2.5 py-1 rounded-full">
                                  <Crown size={10} />
                                  <span className="text-[8px] font-black uppercase tracking-wider">Premium</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/25 bg-white/5 px-2.5 py-1 rounded-full">Free</span>
                              )}
                            </div>
                            <span className="w-28 text-[11px] text-white/30 font-medium">{formatDate(u.created_at)}</span>
                            <span className="w-24 text-[11px] text-white/20 font-medium">{formatTime(u.last_sign_in_at)}</span>
                         </div>
                       ))}
                       {(!stats.user_plan_details || stats.user_plan_details.length === 0) && (
                         <div className="py-12 text-center text-white/20 text-sm">No users found</div>
                       )}
                     </div>
                  </div>
               </div>

               {/* Right Column */}
               <div className="space-y-6">
                  
                  {/* Plan Distribution */}
                  <div className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-8">
                     <h2 className="text-base font-black mb-6 flex items-center gap-2">
                        <Crown size={18} className="text-[#fa2d48]" /> Plan Distribution
                     </h2>
                     <div className="space-y-4">
                        <div>
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-white/60">Free</span>
                              <span className="text-xs font-black text-white/40">{stats.free_users || 0}</span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white/20 rounded-full transition-all duration-1000"
                                style={{ width: `${stats.total_users ? ((stats.free_users || 0) / stats.total_users * 100) : 0}%` }}
                              />
                           </div>
                        </div>
                        <div>
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#fa2d48]">Premium</span>
                              <span className="text-xs font-black text-[#fa2d48]/60">{stats.premium_users || 0}</span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#fa2d48] to-[#af52de] rounded-full transition-all duration-1000"
                                style={{ width: `${stats.total_users ? ((stats.premium_users || 0) / stats.total_users * 100) : 0}%` }}
                              />
                           </div>
                        </div>
                     </div>
                     <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] font-black text-white/15 uppercase tracking-widest">
                          Revenue Est: NPR {((stats.premium_users || 0) * 100).toLocaleString()}/mo
                        </p>
                     </div>
                  </div>

                  {/* Database Card */}
                  <div className="bg-[#fa2d48] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                        <Database size={120} />
                     </div>
                     <h2 className="text-xl font-black mb-4 relative z-10">Database Sync</h2>
                     <p className="text-sm font-medium opacity-80 mb-3 relative z-10">
                       Supabase Primary is online. All records synchronized.
                     </p>
                     <div className="flex items-center gap-2 mb-6 relative z-10">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Live</span>
                     </div>
                     <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                           <p className="text-lg font-black">{stats.total_playlists || 0}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Playlists</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                           <p className="text-lg font-black">{stats.total_songs || 0}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Songs</p>
                        </div>
                     </div>
                  </div>

                  {/* Deployment Status */}
                  <div className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
                     <Globe size={32} className="text-white/20 mb-4" />
                     <h3 className="font-bold text-sm mb-2">Global Deployment</h3>
                     <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed">System is active in <br />Central Asia South-1</p>
                     <div className="flex items-center gap-2 mt-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Operational</span>
                     </div>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
