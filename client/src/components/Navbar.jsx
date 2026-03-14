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
    { name: 'C2C Deals', path: '/c2c' },
  ];

  return (
    <nav className="border-b border-gray-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#867361] rounded-xl flex items-center justify-center shadow-brown20 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">N</span>
              </div>
              <span className="text-2xl font-bold text-[#1a1a1a] tracking-tighter">Nexus</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${location.pathname === link.path ? 'text-[#867361]' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50'
                    }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#867361]"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 p-1.5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 px-3 py-1.5">
                <div className="p-1.5 rounded-lg bg-[#867361]/10 text-[#867361]">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Balance</p>
                  <p className="text-sm font-bold text-[#1a1a1a] leading-none">
                    ${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <button
                  onClick={handleAddFunds}
                  disabled={loading}
                  className="ml-2 p-1.5 rounded-lg bg-[#867361] hover:bg-[#6f5e4f] text-white transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3 px-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#867361] to-[#9d9286] flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                    {profile?.role === 'admin' ? 'System Arbiter' : 'Verified Member'}
                  </p>
                  <p className="text-sm font-bold text-[#1a1a1a] leading-none truncate max-w-[100px]">
                    {profile?.full_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2.5 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-xl transition-all border border-transparent">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent"
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
