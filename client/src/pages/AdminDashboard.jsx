import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  Users,
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
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * UTILS
 */
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val || 0);
};

/**
 * COMPONENTS
 */
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active
      ? 'bg-[#867361]/10 text-[#867361] font-bold'
      : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a1a1a]'
      }`}
  >
    <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-[#867361]' : 'text-gray-400'}`} />
    <span className="text-[13px] tracking-tight">{label}</span>
  </button>
);

const MetricCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-[0.05] -mr-16 -mt-16 rounded-full blur-3xl`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl bg-gray-50 border border-gray-100 ${colorClass.split(' ')[1].replace('to-', 'text-')}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-3xl font-black text-[#1a1a1a] tracking-tighter">{value}</h3>
  </div>
);

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview'); // overview, vault, details, logs
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [],
    escrowAccounts: [],
    transactions: [],
    metrics: {
      totalLocked: 0,
      totalReleased: 0,
      totalDisputed: 0,
      activeEscrows: 0
    }
  });

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('admin_escrow_sync').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: projects } = await supabase.from('projects').select('*, client:client_id(full_name), freelancer:freelancer_id(full_name)').order('created_at', { ascending: false });
      const { data: escrowAccounts } = await supabase.from('escrow_accounts').select('*');
      const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      const { data: taxRecords } = await supabase.from('tax_records').select('*');

      if (projects) {
        const totalLocked = escrowAccounts?.reduce((acc, curr) => acc + (parseFloat(curr.escrow_balance) || 0), 0);
        const totalReleased = taxRecords?.reduce((acc, curr) => acc + (parseFloat(curr.final_payout) || 0), 0);
        const totalDisputed = projects.filter(p => p.status === 'DISPUTED').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const activeEscrows = projects.filter(p => !['PAID', 'AWAITING_DEPOSIT'].includes(p.status)).length;

        setData({
          projects,
          escrowAccounts,
          transactions,
          metrics: { totalLocked, totalReleased, totalDisputed, activeEscrows }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (projectId, action) => {
    try {
      setLoading(true);
      if (action === 'release') {
        await axios.post(`${API_BASE_URL}/projects/${projectId}/release`);
      } else if (action === 'verify') {
        await axios.post(`${API_BASE_URL}/projects/${projectId}/verify`, { admin_id: 'SYSTEM_ADMIN' });
      } else if (action === 'dispute') {
        await axios.post(`${API_BASE_URL}/projects/${projectId}/dispute`, { reason: 'Admin Intervention', raised_by: 'SYSTEM_ADMIN' });
      }
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#867361] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] font-sans text-[#1a1a1a]">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-8 sticky top-0 h-screen z-50 shadow-sm">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-[#867361] rounded-[20px] flex items-center justify-center text-white font-black text-2xl shadow-brown10">
            N
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-[#1a1a1a] italic leading-none">Nexus Protocol</span>
            <span className="text-[9px] font-black text-[#867361] uppercase tracking-widest mt-1">Escrow Agent Node</span>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
          <SidebarItem icon={Wallet} label="Escrow Vault" active={activeView === 'vault'} onClick={() => setActiveView('vault')} />
          <SidebarItem icon={History} label="Transaction Log" active={activeView === 'logs'} onClick={() => setActiveView('logs')} />
        </nav>

        <div className="pt-8 border-t border-gray-100 mt-8">
          <SidebarItem icon={Settings} label="Governance" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-24 border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 bg-white/80 backdrop-blur-xl z-40">
          <h2 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tighter">Vault Control Panel</h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-black text-[#1a1a1a]">System Admin</p>
              <div className="flex items-center justify-end gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Vault Secured</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#867361] font-black shadow-inner">AD</div>
          </div>
        </header>

        <div className="p-12 space-y-12 overflow-y-auto">

          {/* VIEW: OVERVIEW */}
          {activeView === 'overview' && (
            <>
              <div className="grid grid-cols-4 gap-8">
                <MetricCard label="Total Locked Funds" value={formatCurrency(data.metrics.totalLocked)} colorClass="from-[#867361] to-[#9d9286]" icon={Lock} />
                <MetricCard label="Total Released" value={formatCurrency(data.metrics.totalReleased)} colorClass="from-emerald-600 to-teal-500" icon={CheckCircle} />
                <MetricCard label="Total Disputed" value={formatCurrency(data.metrics.totalDisputed)} colorClass="from-rose-600 to-red-500" icon={AlertTriangle} />
                <MetricCard label="Active Escrows" value={data.metrics.activeEscrows} colorClass="from-amber-600 to-orange-500" icon={Activity} />
              </div>

              {/* RECENT PROJECTS TABLE */}
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-black text-xl text-[#1a1a1a] uppercase tracking-tight flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#867361]" /> Active Registry
                  </h2>
                  <button onClick={() => setActiveView('vault')} className="text-[10px] font-black text-[#867361] uppercase hover:underline">View Full Vault</button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-10 py-5">Escrow ID</th>
                      <th className="px-10 py-5">Pair</th>
                      <th className="px-10 py-5">Capital</th>
                      <th className="px-10 py-5">Status</th>
                      <th className="px-10 py-5">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.projects?.slice(0, 10).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-10 py-7 font-mono text-xs text-[#867361]">#{p.id.slice(0, 8)}</td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#1a1a1a]">{p.client?.full_name}</span>
                            <span className="text-[10px] text-gray-400">→ {p.freelancer?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 font-black text-[#1a1a1a]">{formatCurrency(p.amount)}</td>
                        <td className="px-10 py-7">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            p.status === 'DISPUTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-[#867361]/10 text-[#867361] border-[#867361]/20'
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                          <button
                            onClick={() => { setSelectedProject(p); setActiveView('details'); }}
                            className="p-2 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[#867361] hover:text-white transition-all shadow-sm"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* VIEW: VAULT */}
          {activeView === 'vault' && (
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
              <div className="px-10 py-8 border-b border-gray-100">
                <h2 className="font-black text-2xl text-[#1a1a1a] uppercase tracking-tight">Escrow Vault Management</h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-10 py-5">Escrow Account</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5">Vault Balance</th>
                    <th className="px-10 py-5">Locker</th>
                    <th className="px-10 py-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.escrowAccounts?.map(e => {
                    const p = data.projects?.find(proj => proj.id === e.project_id);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-[#867361]">#{e.id.slice(0, 8)}</span>
                            <span className="text-xs font-bold text-gray-500 mt-1">{p?.title}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <p className="text-xs font-black text-[#1a1a1a]">{p?.status}</p>
                        </td>
                        <td className="px-10 py-7 font-black text-emerald-600 text-lg">{formatCurrency(e.escrow_balance)}</td>
                        <td className="px-10 py-7">
                          <div className={`p-2 rounded-lg w-max ${e.is_locked ? 'bg-[#867361]/10 text-[#867361]' : 'bg-gray-100 text-gray-400'}`}>
                            {e.is_locked ? <Lock className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="px-10 py-7 text-xs text-gray-400">
                          {e.deposit_timestamp ? new Date(e.deposit_timestamp).toLocaleString() : 'PENDING DEPOSIT'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: DETAILS */}
          {activeView === 'details' && selectedProject && (
            <div className="max-w-4xl mx-auto space-y-12 pb-24">
              <button onClick={() => setActiveView('overview')} className="text-xs font-black text-gray-400 hover:text-[#1a1a1a] uppercase tracking-widest flex items-center gap-2">
                ← Back to Overview
              </button>

              <div className="grid grid-cols-2 gap-12">
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 space-y-8 shadow-xl">
                  <div>
                    <h3 className="text-[10px] font-black text-[#867361] uppercase tracking-widest mb-2">Project Entity</h3>
                    <h2 className="text-4xl font-black text-[#1a1a1a] italic tracking-tighter leading-none">{selectedProject.title}</h2>
                    <p className="text-gray-500 text-sm mt-4 leading-relaxed">{selectedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Funder (Client)</p>
                      <p className="font-bold text-[#1a1a1a] uppercase">{selectedProject.client?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Execute (Freelancer)</p>
                      <p className="font-bold text-[#1a1a1a] uppercase">{selectedProject.freelancer?.full_name}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100">
                    <p className="text-[10px] font-black text-[#867361] uppercase tracking-widest mb-1">Release Protocol Conditions</p>
                    <p className="text-sm font-bold text-[#1a1a1a]">{selectedProject.release_conditions || "Manual Verification Only"}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-xl border-t-emerald-500/30">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Vault Balance Under Custody</p>
                    <h3 className="text-6xl font-black text-[#1a1a1a] tracking-tighter leading-none italic">{formatCurrency(selectedProject.amount)}</h3>

                    <div className="mt-10 space-y-4">
                      {selectedProject.status === 'WORK_SUBMITTED' && (
                        <button
                          onClick={() => handleAction(selectedProject.id, 'verify')}
                          className="w-full py-5 bg-[#867361] hover:bg-[#6f5e4f] text-white font-black text-xs rounded-2xl uppercase tracking-widest transition-all shadow-brown10"
                        >
                          Verify Work Integrity
                        </button>
                      )}
                      {selectedProject.status === 'READY_FOR_RELEASE' && (
                        <button
                          onClick={() => handleAction(selectedProject.id, 'release')}
                          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
                        >
                          Execute Immutable Payout
                        </button>
                      )}
                      {['ESCROW_LOCKED', 'WORK_SUBMITTED', 'READY_FOR_RELEASE'].includes(selectedProject.status) && (
                        <button
                          onClick={() => handleAction(selectedProject.id, 'dispute')}
                          className="w-full py-5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white font-black text-xs rounded-2xl uppercase tracking-widest transition-all shadow-sm"
                        >
                          Raising Arbitration (Dispute)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-xl">
                    <h4 className="font-black text-[#1a1a1a] uppercase text-xs mb-6">Vault Propagation Timeline</h4>
                    <div className="space-y-6">
                      {data.transactions?.filter(t => t.project_id === selectedProject.id).map((t, idx) => (
                        <div key={t.id} className="flex gap-4">
                          <div className="w-1 h-10 bg-[#867361]/20 rounded-full mt-1" />
                          <div>
                            <p className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-widest">{t.type}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">{new Date(t.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LOGS */}
          {activeView === 'logs' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-4xl font-black text-[#1a1a1a] tracking-tighter italic">Global Ledger Trace</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.5em]">Immutable Sequence</p>
              </div>

              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-10">
                <div className="space-y-12">
                  {data.transactions?.map((t, idx) => {
                    const p = data.projects?.find(proj => proj.id === t.project_id);
                    return (
                      <div key={t.id} className="flex gap-8 relative group">
                        {idx !== data.transactions.length - 1 && <div className="absolute left-[24px] top-14 bottom-[-48px] w-px bg-gray-100" />}
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:border-[#867361] transition-colors shadow-inner">
                          <Activity className="w-5 h-5 text-gray-400 group-hover:text-[#867361]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest group-hover:text-[#867361] transition-colors">{t.type}</span>
                            <span className="text-[10px] text-gray-400 font-mono">TX_0x{t.id.slice(0, 12)}</span>
                          </div>
                          <p className="text-sm text-gray-500 max-w-xl">
                            Propagation of <span className="text-[#1a1a1a] font-bold">{formatCurrency(t.amount)}</span> for entity pair tied to project <span className="text-[#867361] font-mono italic underline underline-offset-4 decoration-current">{p?.title || t.project_id.slice(0, 8)}</span>.
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-tighter">
                            Execution: {new Date(t.created_at).toLocaleString()} • Node: Arbiter-01
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* SYSTEM STATUS */}
        <footer className="h-16 border-t border-gray-100 bg-white/80 backdrop-blur-xl fixed bottom-0 left-72 right-0 px-12 flex items-center justify-between z-50">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Nominal</span>
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">v4.5.1-ESCROW • Vault AES-256 Enabled</p>
          </div>
          <div className="flex items-center gap-8 text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-40">
            <span>Security Hub</span>
            <span>Audit Trail</span>
            <span>© 2026 Nexus Protocol Inc.</span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default AdminDashboard;

