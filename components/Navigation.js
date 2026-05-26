'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { Search as SearchIcon, LogIn, ArrowRight, Settings, LogOut, X, User as UserIcon, Check, Loader2, Key, Crown, ShieldCheck, Menu } from 'lucide-react';
import useStore from '../store/useStore';
import LoginModal from './LoginModal';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, logout, updateProfile, resetPassword, userPlan, isSuperAdmin } = useAuthStore();
  const { currentSong, isPlaying, setIsPlaying, toggleSidebar, isSidebarOpen } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  // Settings state
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.user_metadata?.display_name) {
      setNewName(user.user_metadata.display_name);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile(newName);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err) {
      alert("Failed to update name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 3000);
    } catch (err) {
      alert("Failed to send reset link");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 px-6 py-4 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
          
          {/* Mobile Menu Toggle - Hidden on PC */}
          <button 
            onClick={toggleSidebar}
            className="p-2 lg:hidden text-white/40 hover:text-white -ml-2"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-xl relative group">
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fa2d48] transition-colors pointer-events-none z-10"
            />
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-[#fa2d48]/40 transition-all"
                placeholder="Search songs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#fa2d48] rounded-xl text-white opacity-0 group-focus-within:opacity-100 sm:group-hover:opacity-100 transition-all active:scale-90"
              >
                 <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* User section */}
          <div className="flex items-center gap-3 flex-shrink-0 relative">
            {mounted && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-full pl-4 pr-1 py-1 border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      {isSuperAdmin() ? (
                        <span className="flex items-center gap-1 bg-[#fa2d48] text-white px-1.5 py-0.5 rounded-md">
                          <ShieldCheck size={9} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                        </span>
                      ) : (
                        userPlan === 'premium' ? (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#fa2d48]/20 to-[#af52de]/20 text-[#fa2d48] px-2 py-0.5 rounded-full">
                            <Crown size={9} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Premium</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 leading-none">Free Plan</span>
                        )
                      )}
                    </div>
                    <p className="text-xs font-bold text-white mt-1 truncate max-w-[100px]">
                      {user.user_metadata?.display_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg transition-all ${
                    isSuperAdmin()
                      ? 'bg-black border border-[#fa2d48]/50 ring-2 ring-[#fa2d48]/20 shadow-[0_0_15px_rgba(250,45,72,0.3)]'
                      : userPlan === 'premium' 
                        ? 'bg-gradient-to-br from-[#fa2d48] to-[#af52de]' 
                        : 'bg-gradient-to-br from-[#fa2d48] to-[#ff453a]'
                  }`}>
                    {(user.user_metadata?.display_name || user.email)[0].toUpperCase()}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-3 w-56 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                        <div className="px-5 py-4 border-b border-white/5">
                           <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Signed in as</p>
                              {isSuperAdmin() && (
                                <span className="text-[9px] font-black text-[#fa2d48] uppercase tracking-tighter bg-[#fa2d48]/10 px-1.5 py-0.5 rounded">Admin</span>
                              )}
                           </div>
                           <p className="text-xs font-bold text-white truncate">{user.email}</p>
                        </div>
                        <div className="p-1">
                           <button 
                             onClick={() => { setIsSettingsOpen(true); setIsProfileDropdownOpen(false); }}
                             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                           >
                              <Settings size={18} /> Settings
                           </button>
                           <button 
                             onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#fa2d48] hover:bg-white/5 rounded-xl transition-all"
                           >
                              <LogOut size={18} /> Sign Out
                           </button>
                        </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              mounted && (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-xs font-black tracking-widest uppercase rounded-full hover:bg-white/90 active:scale-95 transition-all shadow-xl"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal - Optimized Minimal UI */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-white" onClick={() => setIsSettingsOpen(false)}>
           <div 
             className="bg-[#1c1c1e] border border-white/10 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl"
             onClick={e => e.stopPropagation()}
           >
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-base font-black tracking-tight uppercase">Settings</h3>
                 <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                 </button>
              </div>
              <div className="p-6">
                 <form onSubmit={handleUpdateName} className="space-y-5">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Profile Name</label>
                       <div className="relative group">
                          <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fa2d48] transition-colors" />
                          <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/5 rounded-xl text-sm font-bold text-white outline-none focus:border-[#fa2d48]/30 transition-all"
                            placeholder="Your Name"
                          />
                          {updateSuccess && <Check size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 animate-fade-in" />}
                       </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isUpdating}
                      className="w-full py-3.5 bg-[#fa2d48] rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-[#fa2d48]/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Update Profile'}
                    </button>
                 </form>

                 <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 ml-1">Security & Privacy</p>
                    <button 
                      onClick={handleResetPassword}
                      disabled={isResetting}
                      className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.98] group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#fa2d48] transition-colors">
                             <Key size={18} />
                          </div>
                          <div className="text-left">
                             <span className="block text-[11px] font-bold">Reset Password</span>
                             <span className="block text-[9px] text-white/20 mt-0.5 uppercase tracking-wider">Send secure link to email</span>
                          </div>
                       </div>
                       {isResetting ? <Loader2 size={16} className="animate-spin text-white/20" /> : resetSent ? <Check size={16} className="text-green-500" /> : <ArrowRight size={14} className="text-white/10 group-hover:text-white" />}
                    </button>
                 </div>
                 
                 <p className="mt-8 text-center text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">SunGeet v2.0.4</p>
              </div>
           </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
