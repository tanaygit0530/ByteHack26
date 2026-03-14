import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Briefcase, Clock, CheckCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import AgreementCard from '../components/AgreementCard';
import CreateAgreementModal from '../components/CreateAgreementModal';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ profile, refreshProfile }) => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAgreements();
    // Real-time updates
    const subscription = supabase
      .channel('agreements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements' }, () => {
        fetchAgreements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  const fetchAgreements = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .or(`client_id.eq.${profile.id},contractor_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements(data);
    } catch (error) {
      console.error('Error fetching agreements:', error.message);
    } finally {
      setLoading(false);
      if (refreshProfile) refreshProfile();
    }
  };

  const getStats = () => {
    const total = agreements.length;
    const active = agreements.filter(a => ['FUNDED_AND_LOCKED', 'REVIEW_PENDING'].includes(a.status)).length;
    const settled = agreements.filter(a => a.status === 'SETTLED').length;
    const volume = agreements.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    return { total, active, settled, volume };
  };

  const stats = getStats();

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
          <p className="text-gray-400 text-base">
            Manage your programmable cross-border escrow agreements.
          </p>
        </div>
        {profile?.role === 'client' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Agreement
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Volume', value: `$${stats.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Briefcase, color: 'text-white' },
          { label: 'Active Escrows', value: stats.active, icon: Clock, color: 'text-white' },
          { label: 'Settled', value: stats.settled, icon: CheckCircle, color: 'text-white' },
          { label: 'Platform Trust', value: '100%', icon: ShieldCheck, color: 'text-white' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-[#1A2235] border border-[#2A344A] p-6 hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-[#111827] ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="rounded-xl bg-[#111827] border border-[#2A344A] p-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Your Agreements</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1A2235] border border-[#2A344A] py-1 px-3 rounded-full">
            <Info className="w-4 h-4" />
            <span>Updates in real-time</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-40 bg-[#1A2235] border border-[#2A344A] rounded-xl animate-pulse"></div>)}
          </div>
        ) : agreements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agreements.map((agreement, i) => (
              <AgreementCard 
                key={agreement.id} 
                agreement={agreement} 
                role={profile?.role} 
                index={i}
                refreshProfile={refreshProfile}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-[#1A2235] border border-[#2A344A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No agreements yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Start by creating a new programmable escrow agreement.
            </p>
            {profile?.role === 'client' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md"
              >
                Create Agreement <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateAgreementModal 
            onClose={() => setIsModalOpen(false)} 
            refresh={fetchAgreements} 
            profile={profile}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
