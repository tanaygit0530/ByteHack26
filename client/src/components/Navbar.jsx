import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { LogOut, User, Wallet, Plus, Loader2, Bell, Shield } from 'lucide-react';

const Navbar = ({ profile, onLogout }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (profile) {
      fetchWallet();
      const sub = supabase
        .channel('wallet_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `owner_id=eq.${profile.id}` }, (payload) => {
          setWallet(payload.new);
        })
        .subscribe();

      const syncInterval = setInterval(fetchWallet, 3000);

      return () => {
        supabase.removeChannel(sub);
        clearInterval(syncInterval);
      };
    }
  }, [profile]);

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase.from('wallets').select('*').eq('owner_id', profile.id).maybeSingle();
      if (error && error.code !== 'PGRST116') console.error("Wallet fetch error:", error);
      if (data) setWallet(data);
    } catch (err) {
      console.error("Wallet fetch failed:", err);
    }
  };

  const handleAddFunds = async () => {
    const amount = prompt("Enter amount to add (USD):");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/profiles/${profile.id}/add-funds`, {
        amount: parseFloat(amount)
      });
      await fetchWallet();
    } catch (error) {
      alert("Failed to add funds: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { name: 'Agreements', path: '/' },
    { name: 'B2B Deals', path: '/c2c' },
  ];

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-24 items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-[#867361] rounded-2xl flex items-center justify-center shadow-brown10 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">N</span>
              </div>
              <span className="text-2xl font-serif font-bold text-[#1a1a1a] tracking-tight">Nexus</span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-bold uppercase tracking-widest transition-all relative py-2 ${location.pathname === link.path ? 'text-[#867361]' : 'text-gray-400 hover:text-[#1a1a1a]'
                    }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#867361]"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-0">
              {/* Wallet Section */}
              <div className="vertical-accent py-1 pr-8 mr-8">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Available Funds</p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-[#1a1a1a]">
                    ${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <button
                    onClick={handleAddFunds}
                    disabled={loading}
                    className="w-6 h-6 rounded-lg bg-[#867361]/10 text-[#867361] hover:bg-[#867361] hover:text-white transition-all flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Profile Section */}
              <div className="vertical-accent py-1 group cursor-pointer">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">
                  {profile?.role === 'admin' ? 'System Arbiter' : 'Certified Account'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#867361] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-bold text-[#1a1a1a]">{profile?.full_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
              <button className="p-2.5 text-gray-400 hover:text-[#1a1a1a] transition-all relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#867361] rounded-full border-2 border-white shadow-[0_0_8px_rgba(134,115,97,0.3)]" />
              </button>
              <button
                onClick={onLogout}
                className="p-2.5 text-gray-400 hover:text-rose-600 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
