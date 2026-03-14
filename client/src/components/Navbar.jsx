import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { LogOut, User, Wallet, Plus, Loader2 } from 'lucide-react';

const Navbar = ({ profile, onLogout }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
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
      return () => supabase.removeChannel(sub);
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

  const handleAddFunds = async () => {    const amount = prompt("Enter amount to add (USD):");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/profiles/${profile.id}/add-funds`, {
        amount: parseFloat(amount)
      });
    } catch (error) {
      alert("Failed to add funds: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  return (
    <nav className="border-b border-[#2A344A] bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-white">Nexus</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-[#111827] rounded-full border border-[#2A344A] shadow-sm">
              <div className="flex items-center gap-2 text-white font-medium">
                <Wallet className="w-4 h-4 text-blue-500" />
                <span>${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                {profile?.role === 'client' && (
                  <button 
                    onClick={handleAddFunds}
                    disabled={loading}
                    className="ml-2 p-1 rounded-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all disabled:opacity-50"
                    title="Add Funds"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <div className="w-px h-4 bg-[#2A344A]"></div>
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm capitalize">{profile?.role}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1A2235] rounded-full transition-colors border border-transparent hover:border-[#2A344A]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
