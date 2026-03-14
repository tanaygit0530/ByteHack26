import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { X, Calendar, DollarSign, User, FileText, Globe, Zap, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateAgreementModal = ({ onClose, refresh, profile, isC2CView }) => {
  const [loading, setLoading] = useState(false);
  const [contractors, setCounterpartys] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deliverables: '',
    amount: '',
    deadline: '',
    receiver_id: '',
    trigger_type: 'manual_review'
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchCounterpartys();
  }, []);

  useEffect(() => {
    if (formData.amount && formData.receiver_id) {
      calculateFees();
    } else {
      setLedger(null);
    }
  }, [formData.amount, formData.receiver_id]);

  const fetchCounterpartys = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, country, total_projects, completed_projects, total_disputes, resolved_disputes')
        .neq('id', profile?.id);

      if (isC2CView) {
        query = query.eq('role', 'client');
      } else {
        if (profile?.role === 'client') {
          query = query.eq('role', 'contractor');
        } else {
          query = query.eq('role', 'client');
        }
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setCounterpartys(data);
      } else {
        setCounterpartys([{
          id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Simulated User',
          country: 'India'
        }]);
      }
    } catch {
      setCounterpartys([{
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Simulated User',
        country: 'India'
      }]);
    }
  };

  const calculateFees = () => {
    const amount = parseFloat(formData.amount);
    if (!amount) return;

    const contractor = contractors?.find(c => c.id === formData.receiver_id);
    const clientCountry = profile?.country || 'USA';
    const contractorCountry = contractor?.country || 'India';

    let taxRate = 0.02;
    if (clientCountry === 'USA' && contractorCountry === 'India') taxRate = 0.10;
    else if (clientCountry === contractorCountry) taxRate = 0.05;

    const plat = amount * 0.01;
    const tax = amount * taxRate;

    setLedger({
      platform: plat.toFixed(2),
      tax: tax.toFixed(2),
      contractor: (amount - plat - tax).toFixed(2),
      taxLabel: taxRate === 0.10 ? 'US-India Treaty (10%)' : taxRate === 0.05 ? 'Domestic Compliance (5%)' : 'Cross-Border Protocol (2%)'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        deliverables: formData.deliverables,
        amount: formData.amount,
        deadline: formData.deadline,
        trigger_type: formData.trigger_type,
        agreement_type: isC2CView ? 'C2C' : 'ESCROW'
      };

      if (isC2CView) {
        payload.payer_id = profile.id;
        payload.receiver_id = formData.receiver_id;
      } else {
        if (profile.role === 'client') {
          payload.payer_id = profile.id;
          payload.receiver_id = formData.receiver_id;
        } else {
          payload.payer_id = formData.receiver_id;
          payload.receiver_id = profile.id;
        }
      }

      await axios.post(`${API_BASE_URL}/agreements`, payload);
      refresh();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/40 backdrop-blur-xl"
      ></motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-3xl glass-card rounded-[40px] overflow-hidden shadow-2xl bg-white border border-gray-100"
      >
        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-[#867361]/10 text-[#867361]">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">
                {isC2CView ? 'New C2C Deal' : 'New Smart Agreement'}
              </h2>
            </div>
            <p className="text-gray-500 font-medium tracking-wide">
              {isC2CView ? 'Direct Client to Client Agreement' : 'Step 1: Define Agreement & Payment Terms'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-[#1a1a1a] transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Agreement Title</label>
              <div className="group relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
                <input
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#867361]/50 focus:bg-white transition-all outline-none text-[#1a1a1a] font-medium"
                  placeholder="e.g. Design & Development Service"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Value (USD)</label>
                <div className="group relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-emerald-500/50 focus:bg-white transition-all outline-none text-[#1a1a1a] font-mono"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Deadline</label>
                <div className="group relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
                  <input
                    required
                    type="date"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#867361]/50 focus:bg-white transition-all outline-none text-[#1a1a1a]"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Contractor</label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
                <select
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#867361]/50 focus:bg-white transition-all outline-none text-[#1a1a1a] appearance-none cursor-pointer"
                  value={formData.receiver_id}
                  onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })}
                >
                  <option value="" className="bg-white">Select Member...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id} className="bg-white">{c.full_name} ({c.country})</option>
                  ))}
                </select>
              </div>

              {formData.receiver_id && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  {(() => {
                    const c = contractors.find(cont => cont.id === formData.receiver_id);
                    if (!c) return null;
                    const disputeRate = c.completed_projects > 0 ? (c.total_disputes / c.completed_projects) * 100 : 0;
                    let healthColor = 'text-emerald-500';
                    let healthBg = 'bg-emerald-50';
                    let healthLabel = 'TRUSTED CONTRACTOR';
                    let Dot = '🟢';

                    if (disputeRate >= 15) {
                      healthColor = 'text-rose-500';
                      healthBg = 'bg-rose-50';
                      healthLabel = 'HIGH RISK';
                      Dot = '🔴';
                    } else if (disputeRate >= 5) {
                      healthColor = 'text-amber-500';
                      healthBg = 'bg-amber-50';
                      healthLabel = 'MODERATE RISK';
                      Dot = '🟡';
                    }

                    return (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Health Score</span>
                          <span className={`text-[10px] font-black ${healthColor} flex items-center gap-1.5 uppercase mt-0.5`}>
                            {Dot} {healthLabel}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-tighter">Completed</span>
                            <span className="text-sm font-black text-[#1a1a1a]">{c.completed_projects || 0}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black text-gray-400 uppercase block tracking-tighter">Dispute Rate</span>
                            <span className="text-sm font-black text-[#1a1a1a]">{disputeRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Payment Release Trigger</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-600 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-amber-500/50 focus:bg-white transition-all outline-none text-[#1a1a1a] appearance-none cursor-pointer"
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                >
                  <option value="manual_review" className="bg-white">Client Approval</option>
                  <option value="github_pr" className="bg-white">GitHub PR (AI-Verified)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Agreement Description</label>
              <textarea
                required
                className="w-full min-h-[100px] px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#867361]/50 focus:bg-white transition-all outline-none text-[#1a1a1a] text-sm leading-relaxed"
                placeholder="Detail the core scope of work..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Deliverables</label>
              <textarea
                required
                className="w-full min-h-[100px] px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#867361]/50 focus:bg-white transition-all outline-none text-[#1a1a1a] text-sm leading-relaxed border-dashed"
                placeholder="1. Source Code Repository&#10;2. Documentation&#10;3. API Specification"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              />
            </div>

            {/* Fee Ledger Display */}
            <div className="p-6 rounded-[32px] bg-[#867361]/5 border border-[#867361]/10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#867361]/5 blur-3xl rounded-full" />
              <h3 className="text-[10px] font-black text-[#867361] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Financial Breakdown
              </h3>

              {ledger ? (
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-medium">Agreement Amount</span>
                    <span className="text-[#1a1a1a] font-mono text-xs">${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-medium">Platform Service Fee (1%)</span>
                    <span className="text-rose-600 font-mono text-xs">-${ledger.platform}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs font-medium">Regulatory Tax Reserve</span>
                      <span className="text-[9px] text-amber-600 font-black uppercase tracking-tighter mt-0.5">{ledger.taxLabel}</span>
                    </div>
                    <span className="text-rose-600 font-mono text-xs">-${ledger.tax}</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-end">
                    <span className="text-sm font-bold text-emerald-600">Net Contractor Payout</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 font-mono leading-none">${ledger.contractor}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Enter terms to <br /> view payment breakdown
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !ledger}
              className="w-full group btn-primary py-5 text-sm shadow-[#867361]/20 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? 'Creating...' : 'Create Smart Agreement'}
                {!loading && <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAgreementModal;
