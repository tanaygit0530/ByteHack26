import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ComplianceCertificateModal from './ComplianceCertificateModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AgreementCard = ({ agreement, currentUserId, index, refreshProfile, isC2CView }) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [aiReview, setAiReview] = useState(null);
  const [deliverable, setDeliverable] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchRelatedData();
    fetchAuditLogs();
    
    // Subscribe to AI reviews and deliverables
    const sub = supabase.channel(`agreement_${agreement.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_reviews', filter: `agreement_id=eq.${agreement.id}` }, () => fetchRelatedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `agreement_id=eq.${agreement.id}` }, () => fetchRelatedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs', filter: `agreement_id=eq.${agreement.id}` }, () => fetchAuditLogs())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [agreement.id]);

  const fetchRelatedData = async () => {
    const { data: reviews } = await supabase.from('ai_reviews').select('*').eq('agreement_id', agreement.id).order('created_at', { ascending: false }).limit(1);
    const { data: subs } = await supabase.from('deliverables').select('*').eq('agreement_id', agreement.id).order('submitted_at', { ascending: false }).limit(1);
    
    if (reviews?.[0]) setAiReview(reviews[0]);
    if (subs?.[0]) setDeliverable(subs[0]);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('agreement_id', agreement.id)
      .order('timestamp', { ascending: false });
    if (data) setAuditLogs(data);
  };

  const statuses = [
    { id: 'DRAFT', label: 'Draft', color: 'bg-gray-400' },
    { id: 'ACCEPTED', label: 'Accepted', color: 'bg-blue-400' },
    { id: 'FUNDED_AND_LOCKED', label: 'Funded', color: 'bg-amber-500' },
    { id: 'IN_REVIEW', label: 'AI Reviewing', color: 'bg-blue-500' },
    { id: 'AI_VERIFIED', label: 'AI Verified', color: 'bg-purple-500' },
    { id: 'APPROVED', label: 'Approved', color: 'bg-emerald-500' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-500' },
    { id: 'DISPUTED', label: 'Disputed', color: 'bg-red-500' },
    { id: 'ARBITRATION', label: 'Arbitration', color: 'bg-purple-600' },
    { id: 'SETTLED', label: 'Settled', color: 'bg-indigo-500' },
    { id: 'REFUNDED', label: 'Refunded', color: 'bg-gray-600' },
    { id: 'PARTIAL_SETTLED', label: 'Partial Payout', color: 'bg-cyan-600' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.id === agreement.status);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'fund') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/fund`);
      } else if (action === 'accept-receiver') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/accept-receiver`);
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
      } else if (action === 'request-changes' || action === 'dispute') {
        const reason = prompt(action === 'dispute' ? "Describe the dispute reason:" : "Describe requested changes:");
        if (!reason) return;
        const endpoint = action === 'dispute' ? 'dispute' : 'request-changes';
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/${endpoint}`, { reason });
      } else if (action === 'approve' || action === 'reject') {
        const reason = action === 'reject' ? prompt("Enter rejection reason:") : 'Human verified approval';
        if (action === 'reject' && !reason) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/reviews`, { decision: action, reason });
      } else if (action === 'escalate') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/escalate`);
      } else if (action === 'arbitrate') {
        const outcome = prompt("Enter Outcome (CONTRACTOR_WINS, CLIENT_WINS, PARTIAL_SETTLEMENT):");
        if (!outcome) return;
        let split_data = null;
        if (outcome === 'PARTIAL_SETTLEMENT') {
            const percent = prompt("Enter Counterparty Percentage (0-100):");
            split_data = { contractor_percent: percent };
        }
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/arbitrate`, { 
            outcome, 
            arbiter_id: index, // In a real app this would be the current user's profile ID
            reason: "Arbiter binding decision",
            split_data
        });
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
      contractor: parseFloat(agreement.receiver_amount || 0).toFixed(2)
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
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#111827] border border-[#2A344A] text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                ID: {agreement.id.slice(0, 8)}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isC2CView ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                {isC2CView ? 'Client ↔ Client' : 'Escrow Protocol'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors uppercase">
              {agreement.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{isC2CView ? 'Sender' : 'Client'}</span>
                <span className="text-[11px] font-bold text-gray-300">{agreement.payer?.full_name || 'Protocol Hub'}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{isC2CView ? 'Receiver' : 'Contractor'}</span>
                <span className="text-[11px] font-bold text-gray-300">{agreement.receiver?.full_name || 'Counterparty'}</span>
              </div>
            </div>
          </div>
          <div className="text-right font-mono">
            <p className="text-xs text-gray-500 mb-1 tracking-widest uppercase">Escrow Value</p>
            <p className="text-2xl font-bold text-white">${parseFloat(agreement.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Impact Parameters - Real-time Ledger Status */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
            <span className={currentStatusIndex >= 0 ? 'text-primary-400' : 'text-gray-600'}>{isC2CView ? 'Sender (Client)' : 'Initiator'}</span>
            <span className={currentStatusIndex >= 1 ? 'text-amber-400' : 'text-gray-600'}>In Vault</span>
            <span className={currentStatusIndex >= 4 ? 'text-emerald-400' : 'text-gray-600'}>{isC2CView ? 'Receiver (Client)' : 'Counterparty'}</span>
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
              <span className="text-blue-400">{isC2CView ? 'Net to Client' : 'Net to Counterparty'}</span>
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
      </div>

      {/* Action Buttons */}
      <div className="p-6 bg-[#111827] border-t border-[#2A344A]">
        {agreement.status === 'DRAFT' && currentUserId === agreement.payer_id && (
           <div className="w-full py-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-gray-400 font-medium flex items-center justify-center gap-2 italic text-sm">
              <Clock className="w-4 h-4" />
              Awaiting service provider acceptance...
           </div>
        )}

        {agreement.status === 'DRAFT' && currentUserId === agreement.receiver_id && (
           <div className="flex gap-3">
              <button
                onClick={() => handleAction('accept-receiver')}
                disabled={loading}
                className="flex-[2] py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
                {loading ? 'Processing...' : 'Accept Agreement Terms'}
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

        {agreement.status === 'ACCEPTED' && currentUserId === agreement.payer_id && (
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
                Cancel
              </button>
          </div>
        )}

        {agreement.status === 'ACCEPTED' && currentUserId === agreement.receiver_id && (
            <div className="w-full py-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500/70 font-medium flex items-center justify-center gap-2 italic text-sm">
                <Clock className="w-4 h-4" />
                Awaiting client deposit...
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

        {agreement.status === 'FUNDED_AND_LOCKED' && currentUserId === agreement.receiver_id && (
          <button
            onClick={() => handleAction('submit')}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            <ExternalLink className="w-5 h-5" />
            {loading ? 'Submitting...' : 'Submit Work / Repo'}
          </button>
        )}

        {agreement.status === 'AI_VERIFIED' && (
        <div className="p-6 bg-[#0B0F19] border-t border-[#2A344A]">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm border border-blue-500/20">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-white font-bold leading-none mb-1">AI Verification Report</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Autonomous Verification Agent v2.0</p>
                 </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${
                agreement.ai_score >= 95 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                agreement.ai_score >= 85 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {agreement.ai_score}% Confidence
              </div>
           </div>

           <div className="p-4 rounded-xl bg-[#1A2235]/50 border border-white/5 mb-6">
              <p className="text-sm text-gray-400 italic leading-relaxed">
                "{agreement.ai_summary}"
              </p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#111827] border border-[#2A344A]">
                 <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Domain Match (Web)</span>
                 <span className={`text-xs font-bold ${agreement.domain_match ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {agreement.domain_match ? 'VERIFIED' : 'MISMATCH'}
                 </span>
              </div>
           </div>
        </div>
      )}
        {agreement.status === 'AI_VERIFIED' && currentUserId === agreement.payer_id && (
          <div className="space-y-3 mt-4">
              <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve Deliverable
                  </button>
                  <button 
                    onClick={() => handleAction('dispute')}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Reject & Dispute
                  </button>
              </div>
          </div>
        )}

        {agreement.status === 'DISPUTED' && currentUserId === agreement.payer_id && (
           <button 
             onClick={() => handleAction('escalate')}
             disabled={loading}
             className="w-full py-4 px-6 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4"
           >
             <ShieldCheck className="w-5 h-5" />
             Escalate to Arbitration
           </button>
        )}

        {agreement.status === 'ARBITRATION' && false /* admin role removed from card logic */ && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 text-center">Protocol Arbiter Panel</h4>
            <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleAction('arbitrate')}
                  className="py-3 rounded-xl bg-emerald-600/20 border border-emerald-600/40 text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                >
                  Final Decision: Release Funds
                </button>
            </div>
          </div>
        )}

        {(agreement.status === 'DISPUTED' || agreement.status === 'ARBITRATION') && (
            <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-200 leading-relaxed italic">
                    Funds are currently <span className="font-black uppercase underline">frozen</span> in the nexus vault.
                </p>
            </div>
        )}

        {agreement.status === 'DISPUTED' && currentUserId === agreement.receiver_id && (
          <button 
            onClick={() => handleAction('submit')}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4"
          >
            <ExternalLink className="w-5 h-5" />
            Upload Revised Work
          </button>
        )}

        {agreement.status === 'REFUNDED' && (
           <div className="w-full py-4 rounded-xl bg-gray-500/10 border border-gray-500/20 text-gray-400 font-bold flex items-center justify-center gap-2 mt-4">
              <AlertCircle className="w-5 h-5" /> 
              Capital Refunded to Initiator
           </div>
        )}

        {agreement.status === 'APPROVED' && currentUserId === agreement.payer_id && (
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
              {deliverable?.receipt_url && (
                  <a 
                    href={deliverable.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2 flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors"
                  >
                      <FileText className="w-4 h-4" /> DOWNLOAD COMPLIANCE RECEIPT
                  </a>
              )}
              {agreement.compliance_report && (
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="w-full py-1 text-[10px] font-black uppercase text-indigo-400/60 hover:text-indigo-400 flex items-center justify-center gap-2 transition-all mt-1"
                  >
                      <ShieldCheck className="w-3 h-3" /> View Settlement Certificate
                  </button>
              )}
          </div>
        )}

        {(agreement.status === 'PARTIAL_SETTLED' || agreement.status === 'REFUNDED') && agreement.compliance_report && (
            <button 
                onClick={() => setShowCertificate(true)}
                className="w-full py-3 text-[10px] font-black uppercase text-indigo-400/60 hover:text-indigo-400 flex items-center justify-center gap-2 transition-all mt-2 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/5"
            >
                <ShieldCheck className="w-4 h-4" /> View Compliance Certificate
            </button>
        )}

        {agreement.status === 'PARTIAL_SETTLED' && (
           <div className="w-full py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Arbiter-Moderated Partial Disbursal
           </div>
        )}

        {agreement.status === 'DRAFT' && currentUserId === agreement.receiver_id && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting client funding...
            </div>
        )}

        {agreement.status === 'IN_REVIEW' && currentUserId === agreement.receiver_id && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                AI verification in progress...
            </div>
        )}

        {agreement.status === 'AI_VERIFIED' && currentUserId === agreement.receiver_id && (
            <div className="w-full py-4 flex items-center justify-center text-purple-400 font-bold text-sm">
                AI Verification Complete. Awaiting Initiator Approval...
            </div>
        )}

        {agreement.status === 'DISPUTED' && (
            <div className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Agreement in Dispute
            </div>
        )}

        {agreement.status === 'APPROVED' && currentUserId === agreement.receiver_id && (
            <div className="w-full py-4 flex items-center justify-center text-gray-500 italic text-sm">
                Awaiting final disbursement...
            </div>
        )}

        {/* Phase 3 Step 6: Audit Trail Display */}
        {auditLogs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#2A344A] space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <FileText className="w-3 h-3" /> Agreement Audit Trail
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 rounded-lg bg-[#111827] border border-[#2A344A] flex justify-between items-start gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-300 capitalize">{log.decision.replace('_', ' ')}</p>
                                <p className="text-[9px] text-gray-500 italic">"{log.reason}"</p>
                            </div>
                            <span className="text-[8px] text-gray-600 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <ComplianceCertificateModal 
        isOpen={showCertificate} 
        onClose={() => setShowCertificate(false)} 
        agreement={agreement} 
      />
    </motion.div>
  );
};

export default AgreementCard;
