import React, { useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, DollarSign, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AgreementCard = ({ agreement, role, index, refreshProfile }) => {
  const [loading, setLoading] = useState(false);

  const statuses = [
    { id: 'DRAFT', label: 'Draft', color: 'bg-gray-400' },
    { id: 'FUNDED_AND_LOCKED', label: 'Funded', color: 'bg-amber-500' },
    { id: 'IN_REVIEW', label: 'AI Reviewing', color: 'bg-blue-500' },
    { id: 'APPROVED', label: 'Approved', color: 'bg-emerald-500' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-500' },
    { id: 'DISPUTED', label: 'Disputed', color: 'bg-red-500' },
    { id: 'SETTLED', label: 'Settled', color: 'bg-indigo-500' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.id === agreement.status);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'fund') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/fund`);
      } else if (action === 'reject-phase1') {
        const reason = prompt("Reason for rejection (e.g., Budget too high, Unrealistic deadline):");
        if (!reason) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/reject`, { reason });
      } else if (action === 'settle') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/settle`);
      } else if (action === 'submit') {
        const url = prompt("Submit Deliverable URL (e.g. GitHub Repo):");
        if (!url) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/submit`, { deliverable_url: url });
      } else if (action === 'approve' || action === 'reject') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/reviews`, { decision: action });
      }
    } catch (error) {
      alert("Action failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
      if (refreshProfile) refreshProfile();
    }
  };

  const fees = {
      platform: parseFloat(agreement.platform_fee || 0).toFixed(2),
      tax: parseFloat(agreement.tax_reserve || 0).toFixed(2),
      contractor: parseFloat(agreement.contractor_amount || 0).toFixed(2)
  };

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
              <span className="text-gray-400">Platform (1%)</span>
              <span className="font-mono text-gray-300">-${fees.platform}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-gray-400">Tax Reserve</span>
              <span className="font-mono text-gray-300">-${fees.tax}</span>
            </div>
            <div className="flex justify-between text-xs py-1 font-bold pt-1 border-t border-[#2A344A]">
              <span className="text-blue-400">Net to Contractor</span>
              <span className="font-mono text-emerald-400">${fees.contractor}</span>
            </div>
          </div>
          <div className="space-y-1 pl-4 border-l border-[#2A344A]">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Protocol Status</p>
             <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold">
                   <ShieldCheck className="w-3 h-3" /> JURISDICTION SECURE
                </div>
                <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold">
                   <Clock className="w-3 h-3" /> {agreement.trigger_type?.toUpperCase()}
                </div>
             </div>
          </div>
        </div>

        {/* AI Analysis Report Display */}
        {agreement.ai_score && (
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">AI Verification Report</h4>
                    <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold">
                        {agreement.ai_score}% CONFIDENCE
                    </span>
                </div>
                <p className="text-xs text-blue-100/70 italic leading-relaxed">
                    "{agreement.ai_summary}"
                </p>
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 bg-[#111827] border-t border-[#2A344A]">
        {agreement.status === 'DRAFT' && role === 'client' && (
          <div className="flex gap-3">
              <button
                onClick={() => handleAction('fund')}
                disabled={loading}
                className="flex-[2] py-3 rounded-lg bg-orange-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-md"
              >
                <DollarSign className="w-5 h-5" />
                {loading ? 'Securing...' : 'Accept & Deposit'}
              </button>
              <button
                onClick={() => handleAction('reject-phase1')}
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-rose-600/10 border border-rose-600/20 text-rose-500 font-medium hover:bg-rose-600/20 transition-all"
              >
                Reject
              </button>
          </div>
        )}

        {agreement.status === 'REJECTED' && (
            <div className="space-y-3">
                <div className="w-full py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                    <AlertCircle className="w-4 h-4" /> Agreement Rejected
                </div>
                <div className="p-4 bg-rose-500/5 rounded-lg border border-rose-500/10 text-xs text-rose-200/70 italic">
                    " {agreement.rejection_reason || 'No reason provided.'} "
                </div>
            </div>
        )}

        {agreement.status === 'FUNDED_AND_LOCKED' && role === 'contractor' && (
          <button
            onClick={() => handleAction('submit')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            <ExternalLink className="w-5 h-5" />
            {loading ? 'Submitting...' : 'Submit Work / Repo'}
          </button>
        )}

        {agreement.status === 'IN_REVIEW' && role === 'client' && (
          <div className="flex gap-3">
              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-md"
              >
                <AlertCircle className="w-5 h-5" />
                Dispute
              </button>
          </div>
        )}

        {agreement.status === 'APPROVED' && role === 'client' && (
          <button
            onClick={() => handleAction('settle')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            <ShieldCheck className="w-5 h-5" />
            {loading ? 'Settling Ledger...' : 'Trigger Compliance Disbursement'}
          </button>
        )}

        {agreement.status === 'SETTLED' && (
          <div className="space-y-3">
              <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Agreement Settled & Disbursed
              </div>
              {agreement.receipt_url && (
                  <a 
                    href={agreement.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2 flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors"
                  >
                      <FileText className="w-4 h-4" /> DOWNLOAD COMPLIANCE RECEIPT
                  </a>
              )}
          </div>
        )}

        {agreement.status === 'DRAFT' && role === 'contractor' && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting client funding...
            </div>
        )}

        {agreement.status === 'IN_REVIEW' && role === 'contractor' && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                AI verification in progress...
            </div>
        )}

        {agreement.status === 'DISPUTED' && (
            <div className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Agreement in Dispute
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
