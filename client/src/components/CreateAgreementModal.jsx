import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { X, Calendar, DollarSign, User, FileText, Globe, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateAgreementModal = ({ onClose, refresh, profile }) => {
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deliverables: '',
    amount: '',
    deadline: '',
    contractor_id: '',
    trigger_type: 'manual_review'
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchContractors();
  }, []);

  // Recalculate ledger whenever amount or contractor changes
  useEffect(() => {
    if (formData.amount && formData.contractor_id) {
       calculateFees();
    } else {
       setLedger(null);
    }
  }, [formData.amount, formData.contractor_id]);

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, country')
        .eq('role', 'contractor');
      
      if (!error && data && data.length > 0) {
        setContractors(data);
      } else {
        setContractors([{
          id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Jane Doe (Contractor)',
          country: 'India'
        }]);
      }
    } catch {
        setContractors([{
          id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Jane Doe (Contractor)',
          country: 'India'
        }]);
    }
  };

  const calculateFees = () => {
    const amount = parseFloat(formData.amount);
    if (!amount) return;
    
    // Simulate server ledger logic locally for UX
    const contractor = contractors.find(c => c.id === formData.contractor_id);
    const clientCountry = profile.country || 'USA';
    const contractorCountry = contractor?.country || 'India';
    
    let taxRate = 0.02; // General
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
      await axios.post(`${API_BASE_URL}/agreements`, {
        ...formData,
        client_id: profile.id
      });
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
        className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
      ></motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-2xl bg-[#111827] border border-[#2A344A] rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1A2235]/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
               <h2 className="text-2xl font-bold text-white">Draft Smart Agreement</h2>
            </div>
            <p className="text-sm text-gray-400 font-medium">Phase 1: Immutable Protocol Handshake</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-8 h-[600px] overflow-y-auto custom-scrollbar">
          {/* Left Column: Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Title</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  required
                  className="w-full pl-10"
                  placeholder="Cross-border Web Protocol"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Budget (USD Pegged)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      required
                      type="number"
                      className="w-full pl-10 font-mono text-white placeholder-gray-700"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      required
                      type="date"
                      className="w-full pl-10"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Service Provider</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <select
                  required
                  className="w-full pl-10 h-[42px]"
                  value={formData.contractor_id}
                  onChange={(e) => setFormData({...formData, contractor_id: e.target.value})}
                >
                  <option value="">Select Contractor...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.country})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Oracle Release Trigger</label>
                <select
                  required
                  className="w-full h-[42px] px-3 bg-[#1A2235]/50 border border-white/5 rounded-xl text-white text-sm"
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({...formData, trigger_type: e.target.value})}
                >
                  <option value="manual_review">Manual Client Approval</option>
                  <option value="github_pr">GitHub PR Merge (Automated)</option>
                </select>
            </div>
          </div>

          {/* Right Column: Ledger and Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agreement Context</label>
              <textarea
                required
                className="w-full min-h-[80px] text-sm leading-relaxed"
                placeholder="Core objectives..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

             <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Specific Deliverables</label>
              <textarea
                required
                className="w-full min-h-[80px] text-sm leading-relaxed border-dashed"
                placeholder="1. Verified GitHub Repo..."
                value={formData.deliverables}
                onChange={(e) => setFormData({...formData, deliverables: e.target.value})}
              />
            </div>

            {/* Step 3: Immutable Ledger Display */}
            <div className="p-5 rounded-2xl bg-[#1A2235] border border-blue-500/20 shadow-inner">
               <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3" /> Step 3: Immutable Fee Ledger
               </h3>
               
               {ledger ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Deposit</span>
                      <span className="text-white font-mono">${parseFloat(formData.amount).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Platform Fee (1%)</span>
                      <span className="text-white/60 font-mono">-${ledger.platform}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-400">Tax Reserve</span>
                        <span className="text-[8px] text-amber-500/80 uppercase font-bold">{ledger.taxLabel}</span>
                      </div>
                      <span className="text-white/60 font-mono">-${ledger.tax}</span>
                   </div>
                   <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-400">Net Contractor</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">${ledger.contractor}</span>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                       <AlertCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-[10px] text-gray-600 italic">Enter budget and contractor to view final compliance breakdown</p>
                 </div>
               )}
            </div>
            
            <button
               type="submit"
               disabled={loading || !ledger}
               className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
               {loading ? 'Processing Protocol...' : 'Initialize & Lock Protocol'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAgreementModal;
