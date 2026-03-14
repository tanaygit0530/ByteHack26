import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  ShieldCheck,
  History,
  Settings,
  Bell,
  Search,
  Plus,
  Globe,
  DollarSign,
  Activity,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Zap,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  Briefcase,
  Filter,
  Download,
  MoreVertical,
  X,
  Clock,
  ExternalLink,
  PieChart,
  BarChart3,
  TrendingUp,
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * UI UTILS
 */
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getStatusStyles = (status) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'DISPUTED':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'ESCROW_LOCKED':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'WORK_SUBMITTED':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'READY_FOR_RELEASE':
      return 'bg-violet-50 text-violet-600 border-violet-100';
    case 'ESCROW_FUNDED':
      return 'bg-cyan-50 text-cyan-600 border-cyan-100';
    case 'AGREEMENT_CREATED':
      return 'bg-gray-50 text-gray-600 border-gray-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

/**
 * COMPONENTS
 */
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active
      ? 'bg-[#867361] text-white font-bold shadow-lg shadow-[#867361]/20'
      : 'text-gray-500 hover:bg-[#867361]/5 hover:text-[#867361]'
      }`}
  >
    <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span className="text-[14px] tracking-tight">{label}</span>
  </button>
);

const StatCard = ({ label, value, color, icon: Icon, trend }) => (
  <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500 opacity-[0.03] -mr-16 -mt-16 rounded-full blur-3xl`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3.5 rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-2xl font-black text-[#1a1a1a] tracking-tight">{value}</h3>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, vault, contracts, disputes, settings
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({
    agreements: [],
    transactions: [],
    taxRecords: [],
    metrics: {
      totalEscrow: 0,
      lockedFunds: 0,
      releasedFunds: 0,
      activeProjects: 0,
      disputedEscrows: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
    const sub = supabase.channel('nexus_admin_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchDashboardData())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: agreements } = await supabase
        .from('agreements')
        .select(`
          *,
          payer:profiles!payer_id(full_name, country),
          receiver:profiles!receiver_id(full_name, country)
        `)
        .order('created_at', { ascending: false });

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: taxRecords } = await supabase
        .from('tax_records')
        .select('*');

      // Calculate Metrics
      const totalEscrow = agreements
        ?.filter(a => ['ESCROW_FUNDED', 'ESCROW_LOCKED', 'WORK_SUBMITTED', 'READY_FOR_RELEASE'].includes(a.status))
        .reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0;

      const lockedFunds = agreements
        ?.filter(a => a.status === 'ESCROW_LOCKED')
        .reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0;

      const releasedFunds = agreements
        ?.filter(a => a.status === 'PAID')
        .reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0;

      const activeProjects = agreements?.filter(a => !['PAID', 'REFUNDED'].includes(a.status)).length || 0;
      const disputedEscrows = agreements?.filter(a => a.status === 'DISPUTED').length || 0;

      setData({
        agreements,
        transactions,
        taxRecords,
        metrics: {
          totalEscrow,
          lockedFunds,
          releasedFunds,
          activeProjects,
          disputedEscrows
        }
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setLoading(true);
      let endpoint = '';
      let body = {};

      if (action === 'lock') endpoint = `/agreements/${id}/lock`;
      else if (action === 'verify') endpoint = `/agreements/${id}/reviews`, body = { decision: 'approve' };
      else if (action === 'reject') endpoint = `/agreements/${id}/reviews`, body = { decision: 'reject' };
      else if (action === 'release') endpoint = `/agreements/${id}/settle`;
      else if (action === 'dispute') endpoint = `/agreements/${id}/dispute`;

      await axios.post(`${API_BASE_URL}${endpoint}`, body);
      fetchDashboardData();
      if (selectedAgreement?.id === id) {
        // Refresh detail view
        const { data: updated } = await supabase
          .from('agreements')
          .select(`*, payer:profiles!payer_id(full_name, country), receiver:profiles!receiver_id(full_name, country)`)
          .eq('id', id)
          .single();
        setSelectedAgreement(updated);
      }
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredAgreements = data.agreements?.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.payer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.receiver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] text-[#1a1a1a] selection:bg-[#867361]/20">

      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-10 sticky top-0 h-screen z-50">
        <div className="flex items-center gap-4 mb-14">
          <div className="w-11 h-11 bg-[#867361] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#867361]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tighter text-[#1a1a1a]">Nexus Escrow</span>
            <span className="text-[10px] font-black text-[#867361] uppercase tracking-[0.2em]">Escrow Agent Terminal</span>
          </div>
        </div>

        <nav className="space-y-3 flex-grow">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Main Navigation</p>
          <SidebarItem icon={LayoutDashboard} label="Vault Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSelectedAgreement(null); }} />
          <SidebarItem icon={Lock} label="Active Vault" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setSelectedAgreement(null); }} />
          <SidebarItem icon={FileText} label="Escrow Contracts" active={activeTab === 'contracts'} onClick={() => { setActiveTab('contracts'); setSelectedAgreement(null); }} />
          <SidebarItem icon={AlertTriangle} label="Dispute Center" active={activeTab === 'disputes'} onClick={() => { setActiveTab('disputes'); setSelectedAgreement(null); }} />

          <div className="pt-8 mt-4 border-t border-gray-50 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Invoicing & Tax</p>
            <SidebarItem icon={History} label="Global Audit Trail" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            <SidebarItem icon={Settings} label="Governance" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </nav>

        <div className="pt-10 border-t border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#867361] font-black shadow-inner">AD</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-black text-[#1a1a1a] truncate">Admin User</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Agent 01 Online
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col min-w-0 bg-[#fdfdfc]/50">

        {/* HEADER */}
        <header className="h-28 flex items-center justify-between px-14 py-4 z-40">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight flex items-center gap-3">
              {activeTab === 'overview' && "Escrow Vault Control"}
              {activeTab === 'vault' && "Secured Capital Repository"}
              {activeTab === 'contracts' && "Global Agreement Ledger"}
              {activeTab === 'disputes' && "Dispute Arbitration Node"}
              {activeTab === 'logs' && "Immutable Audit Trail"}
              {selectedAgreement && "Agreement Terms"}
            </h2>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">
              Live Network Monitoring • {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
              <input
                type="text"
                placeholder="Search Escrow ID, Client, Entity..."
                className="w-80 h-14 pl-12 pr-6 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:border-[#867361] outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#867361] transition-all shadow-sm relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        <div className="px-14 pb-20 space-y-12">

          <AnimatePresence mode="wait">
            {!selectedAgreement ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-12"
              >
                {/* METRICS GRID */}
                <div className="grid grid-cols-4 gap-8">
                  <StatCard label="Total Vault Balance" value={formatCurrency(data.metrics.totalEscrow)} color="brown" icon={Wallet} trend="+4.2%" />
                  <StatCard label="Locked Capital" value={formatCurrency(data.metrics.lockedFunds)} color="amber" icon={Lock} />
                  <StatCard label="Released Payments" value={formatCurrency(data.metrics.releasedFunds)} color="emerald" icon={Unlock} trend="+12.5%" />
                  <StatCard label="Active Agreements" value={data.metrics.activeProjects} color="gray" icon={Activity} />
                </div>

                {/* TABLES */}
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                  <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                    <h2 className="font-black text-xs text-gray-400 uppercase tracking-widest flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-[#867361]" />
                      {activeTab === 'vault' ? "LOCKED ESCROW REGISTRY" : "RECENT NETWORK ACTIVITY"}
                    </h2>
                    <div className="flex gap-4">
                      <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#867361] transition-all"><Filter className="w-4 h-4" /></button>
                      <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#867361] transition-all"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                          <th className="px-10 py-6">Agreement ID</th>
                          <th className="px-10 py-6">Entity Pair (Client → Freelancer)</th>
                          <th className="px-10 py-6">Capital (USD)</th>
                          <th className="px-10 py-6">Vault Status</th>
                          <th className="px-10 py-6">Ingestion Date</th>
                          <th className="px-10 py-6">Operation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(activeTab === 'vault' ? filteredAgreements.filter(a => a.status === 'ESCROW_LOCKED') : filteredAgreements).map((a) => (
                          <tr key={a.id} className="group hover:bg-gray-50/30 transition-colors">
                            <td className="px-10 py-7">
                              <span className="font-mono text-[11px] font-bold text-[#867361] bg-[#867361]/5 px-2 py-1 rounded">#{a.id.slice(0, 8)}</span>
                            </td>
                            <td className="px-10 py-7">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-[#1a1a1a]">{a.payer?.full_name}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">→ {a.receiver?.full_name}</span>
                              </div>
                            </td>
                            <td className="px-10 py-7 font-black text-sm text-[#1a1a1a]">{formatCurrency(a.amount)}</td>
                            <td className="px-10 py-7">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(a.status)}`}>
                                {a.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-10 py-7 text-xs font-bold text-gray-400">{formatDate(a.created_at)}</td>
                            <td className="px-10 py-7">
                              <button
                                onClick={() => setSelectedAgreement(a)}
                                className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-[#867361] hover:text-white hover:border-[#867361] hover:shadow-lg hover:shadow-[#867361]/20 transition-all active:scale-95"
                              >
                                EXECUTE OPERATION
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredAgreements.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Zero Registry Matches Found</p>
                      <p className="text-xs font-medium text-gray-300 mt-1">Adjust search parameters or role filters</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-12 pb-24"
              >
                {/* DETAILS TOP BAR */}
                <div className="flex items-center justify-between p-10 bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/10">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={() => setSelectedAgreement(null)}
                      className="w-14 h-14 flex items-center justify-center bg-gray-50 hover:bg-white border border-gray-100 hover:border-[#867361] rounded-2xl text-gray-400 hover:text-[#867361] transition-all"
                    >
                      <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black bg-[#867361] text-white px-3 py-1 rounded-full uppercase tracking-widest">Agreement ID: {selectedAgreement.id.slice(0, 8)}</span>
                        <span className={`text-[10px] font-black border px-3 py-1 rounded-full uppercase tracking-widest ${getStatusStyles(selectedAgreement.status)}`}>{selectedAgreement.status.replace(/_/g, ' ')}</span>
                      </div>
                      <h3 className="text-3xl font-black text-[#1a1a1a] tracking-tighter italic">{selectedAgreement.title}</h3>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {selectedAgreement.status === 'ESCROW_FUNDED' && (
                      <button
                        onClick={() => handleAction(selectedAgreement.id, 'lock')}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <Lock className="w-4 h-4" /> LOCK VAULT
                      </button>
                    )}
                    {selectedAgreement.status === 'READY_FOR_RELEASE' && (
                      <button
                        onClick={() => handleAction(selectedAgreement.id, 'release')}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <Zap className="w-4 h-4" /> EXECUTE SETTLEMENT
                      </button>
                    )}
                    {['ESCROW_LOCKED', 'WORK_SUBMITTED'].includes(selectedAgreement.status) && (
                      <button
                        onClick={() => handleAction(selectedAgreement.id, 'dispute')}
                        className="px-8 py-4 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white font-black text-xs rounded-2xl uppercase tracking-[0.2em] active:scale-95 transition-all"
                      >
                        OPEN DISPUTE
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-10 items-start">
                  {/* LEFT COLUMN */}
                  <div className="col-span-8 space-y-10">
                    {/* ENTITY DETAILS */}
                    <div className="bg-white rounded-[40px] border border-gray-100 p-12 shadow-sm grid grid-cols-3 gap-12">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Client Entity</p>
                        <p className="text-xl font-black text-[#1a1a1a] leading-none mb-1">{selectedAgreement.payer?.full_name}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-2">
                          <Globe className="w-3.5 h-3.5" /> {selectedAgreement.payer?.country} HUB
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-px h-16 bg-gray-100 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 justify-end"><Briefcase className="w-3.5 h-3.5" /> Contractor</p>
                        <p className="text-xl font-black text-[#1a1a1a] leading-none mb-1">{selectedAgreement.receiver?.full_name}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-end mt-2">
                          {selectedAgreement.receiver?.country} HUB <Globe className="w-3.5 h-3.5" />
                        </p>
                      </div>
                    </div>

                    {/* PROTOCOL VERIFICATION PANEL */}
                    <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
                      <div className="px-12 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                        <div>
                          <h4 className="text-[10px] font-black text-[#867361] uppercase tracking-[0.25em]">Deliverable Verification Pipeline</h4>
                          <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase">Automating compliance via programmable ingestion</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Oracle Online</span>
                        </div>
                      </div>
                      <div className="p-12 space-y-10">
                        <div className="grid grid-cols-3 gap-10">
                          <div className="p-7 rounded-[32px] bg-gray-50 border border-gray-100 space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submission Type</p>
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-white rounded-xl border border-gray-100 text-[#867361] shadow-sm">
                                <Zap className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-tight text-[#1a1a1a]">GitHub Handshake</span>
                            </div>
                          </div>
                          <div className="p-7 rounded-[32px] bg-gray-50 border border-gray-100 space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Audit Score</p>
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm ${selectedAgreement.ai_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <span className="text-2xl font-black tracking-tighter text-[#1a1a1a]">{selectedAgreement.ai_score || 0}%</span>
                            </div>
                          </div>
                          <div className="p-7 rounded-[32px] bg-gray-50 border border-gray-100 space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Status</p>
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-white rounded-xl border border-gray-100 text-[#867361] shadow-sm">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-tight text-[#1a1a1a]">{selectedAgreement.status === 'READY_FOR_RELEASE' ? 'PASSED' : 'PENDING'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 bg-[#867361]/5 border border-[#867361]/10 rounded-[32px] flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-[#867361] shadow-sm border border-[#867361]/10">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#1a1a1a] italic tracking-tight">AI Summary Ingestion</p>
                              <p className="text-xs text-gray-500 max-w-lg mt-1 leading-relaxed">{selectedAgreement.ai_summary || "Waiting for deliverable submission and cryptographic verification..."}</p>
                            </div>
                          </div>
                          {selectedAgreement.status === 'WORK_SUBMITTED' && (
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => handleAction(selectedAgreement.id, 'verify')}
                                className="px-6 py-3 bg-[#867361] hover:bg-[#6f5e4f] text-white font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg shadow-[#867361]/20 transition-all"
                              >
                                VERIFY & READY
                              </button>
                              <button
                                onClick={() => handleAction(selectedAgreement.id, 'reject')}
                                className="px-6 py-3 bg-white border border-[#867361]/10 text-gray-400 hover:text-rose-500 font-black text-[10px] rounded-xl uppercase tracking-widest transition-all"
                              >
                                REJECT WORK
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="col-span-4 space-y-10">
                    {/* PAYMENT BREAKDOWN */}
                    <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#867361] opacity-[0.03] -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-[#867361]/10 transition-colors" />
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-[#867361]" /> Immutable Fee Computation
                      </h4>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center text-gray-500">
                          <span className="text-xs font-bold uppercase tracking-widest">Gross Escrow Capital</span>
                          <span className="font-mono text-sm text-[#1a1a1a] font-black">{formatCurrency(selectedAgreement.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span className="text-xs font-medium uppercase tracking-widest">Platform Escrow Fee (5%)</span>
                          <span className="font-mono text-sm text-rose-500 font-bold">-{formatCurrency(selectedAgreement.platform_fee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span className="text-xs font-medium uppercase tracking-widest">Tax Provision (GST 18%)</span>
                          <span className="font-mono text-sm text-rose-500 font-bold">-{formatCurrency(selectedAgreement.gst_amount || (selectedAgreement.platform_fee * 0.18))}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span className="text-xs font-medium uppercase tracking-widest">Digital Service Tax</span>
                          <span className="font-mono text-sm text-rose-500 font-bold">-{formatCurrency(selectedAgreement.digital_service_tax || 20)}</span>
                        </div>

                        <div className="pt-8 border-t border-gray-100 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 leading-none">Net Contractor Payout</span>
                            <span className="text-4xl font-black text-[#1a1a1a] tracking-tighter leading-none italic">{formatCurrency(selectedAgreement.receiver_amount)}</span>
                          </div>
                          <CreditCard className="w-8 h-8 text-gray-100" />
                        </div>
                      </div>
                    </div>

                    {/* PROTOCOL LIFECYCLE TIMELINE */}
                    <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm overflow-hidden relative">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#867361]" /> Vault Traceability
                      </h4>

                      <div className="space-y-8 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-50" />

                        {[
                          { label: 'AGREEMENT_CREATED', title: 'Agreement Created', icon: FileText, date: selectedAgreement.created_at },
                          { label: 'ESCROW_FUNDED', title: 'Capital Ingested', icon: Wallet, date: selectedAgreement.status === 'AGREEMENT_CREATED' ? null : null }, // Simplified for mock
                          { label: 'ESCROW_LOCKED', title: 'Vault Secured', icon: Lock, date: null },
                          { label: 'WORK_SUBMITTED', title: 'Deliverable Logic Met', icon: Zap, date: null },
                          { label: 'PAID', title: 'Node Settled', icon: CheckCircle, date: null },
                        ].map((step, idx) => {
                          const isActive = data.transactions?.some(t => {
                            if (step.label === 'ESCROW_FUNDED') return t.type === 'ESCROW_DEPOSIT';
                            if (step.label === 'PAID') return t.type === 'ESCROW_RELEASE';
                            return false;
                          }) || selectedAgreement.status === step.label;

                          return (
                            <div key={idx} className={`flex gap-6 relative z-10 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                              <div className={`w-3.5 h-3.5 rounded-full mt-1.5 ring-4 ring-white ${isActive ? 'bg-[#867361]' : 'bg-gray-100'}`} />
                              <div>
                                <p className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-widest mb-1 flex items-center gap-2">
                                  {step.title} {isActive && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                </p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                                  {step.date ? formatDate(step.date) : (isActive ? 'VERIFIED' : 'PENDING PROPAGATION')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* NETWORK FOOTER STATS */}
        <footer className="h-16 border-t border-gray-100 bg-white/80 backdrop-blur-xl sticky bottom-0 flex items-center justify-between px-14 z-50">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Value</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Building className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Escrow Ledger v4.5.1-FINTECH</span>
            </div>
          </div>
          <div className="flex items-center gap-8 opacity-40">
            <div className="flex items-center gap-2 cursor-help group">
              <Info className="w-3 h-3 text-gray-400 group-hover:text-[#867361]" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#867361]">Security Context</span>
            </div>
            <div className="flex items-center gap-2 cursor-help group">
              <ShieldCheck className="w-3 h-3 text-gray-400 group-hover:text-[#867361]" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#867361]">Audit Policy</span>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">© 2026 Nexus System</p>
          </div>
        </footer>

      </main>

      {/* GLOBAL LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#fdfdfc]/40 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6 p-10 bg-white rounded-[40px] border border-gray-100 shadow-2xl">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#867361] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#867361] rounded-full animate-ping" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#867361] uppercase tracking-[0.3em] text-center">Syncing Node</p>
                <p className="text-xs font-medium text-gray-400 mt-2 text-center italic">Propagating cryptographic state across the registry...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
