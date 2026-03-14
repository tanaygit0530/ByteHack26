import React, { useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AgreementCard = ({ agreement, role, index }) => {
  const [loading, setLoading] = useState(false);

  const statuses = [
    { id: 'PENDING_ACCEPTANCE', label: 'Initiated', color: 'bg-gray-500' },
    { id: 'FUNDED_AND_LOCKED', label: 'In Vault', color: 'bg-amber-500' },
    { id: 'REVIEW_PENDING', label: 'Reviewing', color: 'bg-blue-500' },
    { id: 'APPROVED', label: 'Approved', color: 'bg-emerald-500' },
    { id: 'SETTLED', label: 'Settled', color: 'bg-primary-500' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.id === agreement.status);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'simulate-payment') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/simulate-payment`);
      } else if (action === 'settle') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/settle`);
      } else if (action === 'submit') {
        const { error } = await supabase
          .from('agreements')
          .update({ status: 'REVIEW_PENDING' })
          .eq('id', agreement.id);
        if (error) throw error;
      } else if (action === 'approve') {
        const { error } = await supabase
          .from('agreements')
          .update({ status: 'APPROVED' })
          .eq('id', agreement.id);
        if (error) throw error;
      }
    } catch (error) {
      alert("Action failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = (amt) => {
    const total = parseFloat(amt);
    return {
      platform: (total * 0.02).toFixed(2),
      tax: (total * 0.10).toFixed(2),
      contractor: (total * 0.88).toFixed(2)
    };
  };

  const fees = calculateFees(agreement.amount);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl bg-[#1A2235] border border-[#2A344A] overflow-hidden hover:scale-[1.01] transition-all duration-200 shadow-lg flex flex-col h-full"
    >
      <div className="p-8 space-y-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#111827] border border-[#2A344A] text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Agreement ID: {agreement.id.slice(0, 8)}
            </span>
            <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors uppercase">
              {agreement.title}
            </h3>
          </div>
          <div className="text-right font-mono">
            <p className="text-xs text-gray-500 mb-1 tracking-widest uppercase">Escrow Value</p>
            <p className="text-2xl font-bold text-white">${parseFloat(agreement.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Impact Parameters - Real-time Ledger Status */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
            <span className={currentStatusIndex >= 0 ? 'text-primary-400' : 'text-gray-600'}>Client</span>
            <span className={currentStatusIndex >= 1 ? 'text-amber-400' : 'text-gray-600'}>In Vault</span>
            <span className={currentStatusIndex >= 4 ? 'text-emerald-400' : 'text-gray-600'}>Contractor</span>
          </div>
          <div className="relative h-2 w-full bg-[#111827] rounded-full overflow-hidden border border-[#2A344A]">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStatusIndex + 1) * 20}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1">
              {[0, 20, 40, 60, 80, 100].map(p => <div key={p} className="w-px h-full bg-[#2A344A]/50"></div>)}
            </div>
          </div>
          <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-[#2A344A]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Status:</span>
              <span className={`text-sm font-bold ${statuses[currentStatusIndex]?.color.replace('bg-', 'text-')}`}>
                {statuses[currentStatusIndex]?.label}
              </span>
            </div>
            {agreement.status === 'SETTLED' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                INSTANTLY SETTLED
              </div>
            )}
           {agreement.status === 'FUNDED_AND_LOCKED' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                FUNDS SECURED
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-400 line-clamp-2 text-sm">
          {agreement.description || "No description provided. This agreement governs the deliverables and payments between the funder and executor."}
        </p>

        {/* Impact Parameters - Fee Transparency */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#2A344A]">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Split Analysis</p>
            <div className="flex justify-between text-xs py-1">
              <span className="text-gray-400">Platform (2%)</span>
              <span className="font-mono text-gray-300">-${fees.platform}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-gray-400">Sim. Tax (10%)</span>
              <span className="font-mono text-gray-300">-${fees.tax}</span>
            </div>
            <div className="flex justify-between text-xs py-1 font-bold pt-1 border-t border-[#2A344A]">
              <span className="text-blue-400">Net to Contractor</span>
              <span className="font-mono text-emerald-400">${fees.contractor}</span>
            </div>
          </div>
          <div className="space-y-1 pl-4 border-l border-[#2A344A]">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Settlement Prediction</p>
             <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold">
                   <AlertCircle className="w-3 h-3" /> SWIFT: 3-5 DAYS
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold">
                   <ShieldCheck className="w-3 h-3" /> NEXUS: INSTANT
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 bg-[#111827] border-t border-[#2A344A]">
        {agreement.status === 'PENDING_ACCEPTANCE' && role === 'client' && (
          <button
            onClick={() => handleAction('simulate-payment')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-orange-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-md"
          >
            <DollarSign className="w-5 h-5" />
            {loading ? 'Processing...' : 'Simulate Payment (Deposit Now)'}
          </button>
        )}

        {agreement.status === 'FUNDED_AND_LOCKED' && role === 'contractor' && (
          <button
            onClick={() => handleAction('submit')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            <ExternalLink className="w-5 h-5" />
            {loading ? 'Processing...' : 'Submit Deliverable'}
          </button>
        )}

        {agreement.status === 'REVIEW_PENDING' && role === 'client' && (
          <button
            onClick={() => handleAction('approve')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? 'Processing...' : 'Approve Work'}
          </button>
        )}

        {agreement.status === 'APPROVED' && role === 'client' && (
          <button
            onClick={() => handleAction('settle')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            <ShieldCheck className="w-5 h-5" />
            {loading ? 'Processing...' : 'Execute Disbursement'}
          </button>
        )}

        {agreement.status === 'SETTLED' && (
          <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Agreement Finalized & Disbursed
          </div>
        )}

        {agreement.status === 'PENDING_ACCEPTANCE' && role === 'contractor' && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting client deposit...
            </div>
        )}

        {agreement.status === 'REVIEW_PENDING' && role === 'contractor' && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting client approval...
            </div>
        )}

        {agreement.status === 'APPROVED' && role === 'contractor' && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting final disbursement...
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default AgreementCard;
