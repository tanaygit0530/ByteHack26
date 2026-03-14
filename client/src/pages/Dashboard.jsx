import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Briefcase, Clock, CheckCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import AgreementCard from '../components/AgreementCard';
import CreateAgreementModal from '../components/CreateAgreementModal';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ profile, refreshProfile, isC2CView }) => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAgreements();
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
      let query = supabase
        .from('agreements')
        .select(`
          *,
          payer:profiles!payer_id(full_name),
          receiver:profiles!receiver_id(full_name)
        `)
        .or(`payer_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (isC2CView) {
        query = query.eq('agreement_type', 'C2C');
      } else {
        query = query.eq('agreement_type', 'ESCROW');
      }

      const { data, error } = await query;
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
    const active = agreements.filter(a => ['FUNDED_AND_LOCKED', 'IN_REVIEW', 'AI_VERIFIED'].includes(a.status)).length;
    const settled = agreements.filter(a => a.status === 'SETTLED').length;
    const volume = agreements.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    return { total, active, settled, volume };
  };

  const stats = getStats();

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-[#867361] rounded-full shadow-[0_0_10px_rgba(134,115,97,0.3)]" />
            <h1 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight">
              Protocol <span className="gradient-text italic">Dashboard</span>
            </h1>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl font-medium leading-relaxed">
            Welcome back, <span className="text-[#867361] font-bold">{profile?.full_name?.split(' ')[0]}</span>.
            {isC2CView
              ? ' You are currently managing peer-to-peer client agreements within the Nexus protocol.'
              : ' Monitor and manage your secure cross-border escrow transactions in real-time.'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-3 px-8 py-4 bg-[#867361] hover:bg-[#6f5e4f] text-white rounded-2xl font-bold transition-all shadow-brown10 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-5 h-5" />
          {isC2CView ? 'New Client Agreement' : 'Secure New Escrow'}
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume', value: `$${stats.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Briefcase, color: 'brown' },
          { label: 'Active Escrows', value: stats.active, icon: Clock, color: 'gray' },
          { label: 'Settled Protocols', value: stats.settled, icon: CheckCircle, color: 'emerald' },
          { label: 'Network Trust', value: '100%', icon: ShieldCheck, color: 'gray' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group glass-card p-6 rounded-3xl relative overflow-hidden transition-all hover:shadow-lg hover:border-[#867361]/20 bg-white"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#867361]/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#867361]/10 transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-gray-50 text-[#867361] border border-gray-100 shadow-sm group-hover:bg-[#867361]/5 transition-colors">
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
              {isC2CView ? 'Peer-to-Peer Protocols' : 'Active Agreement Ledger'}
            </h2>
            <span className="px-3 py-1 rounded-full bg-[#867361]/10 border border-[#867361]/20 text-[#867361] text-[10px] font-black uppercase tracking-tighter">Live Sync</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
            <Info className="w-4 h-4" />
            <span>Secure Cryptographic Ledger</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="h-[400px] glass-card rounded-[32px] animate-pulse flex flex-col p-8 gap-6 bg-white">
                <div className="h-8 w-1/3 bg-gray-50 rounded-lg" />
                <div className="h-4 w-full bg-gray-50 rounded-lg" />
                <div className="h-32 w-full bg-gray-50 rounded-2xl mt-auto" />
              </div>
            ))}
          </div>
        ) : agreements.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {agreements.map((agreement, i) => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                currentUserId={profile?.id}
                index={i}
                refreshProfile={refreshProfile}
                isC2CView={isC2CView}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-24 glass-card rounded-[40px] text-center max-w-2xl mx-auto border-dashed border-gray-200 bg-white"
          >
            <div className="w-24 h-24 bg-[#867361]/5 border border-[#867361]/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Briefcase className="w-10 h-10 text-[#867361]" />
            </div>
            <h3 className="text-3xl font-extrabold text-[#1a1a1a] mb-4">The ledger is empty</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto text-lg font-medium leading-relaxed">
              {isC2CView
                ? 'Initiate your first peer-to-peer client agreement to begin secure transactions.'
                : 'Secure your first programmable escrow agreement with cryptographic trust.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary px-10 py-4 flex items-center gap-3 mx-auto"
            >
              Start Your First Protocol <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateAgreementModal
            onClose={() => setIsModalOpen(false)}
            refresh={fetchAgreements}
            profile={profile}
            isC2CView={isC2CView}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
