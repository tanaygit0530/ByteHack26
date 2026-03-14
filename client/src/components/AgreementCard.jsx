import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, DollarSign, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ComplianceCertificateModal from './ComplianceCertificateModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AgreementCard = ({ agreement, currentUserId, index, refreshProfile, isC2CView }) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [deliverable, setDeliverable] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchRelatedData();
    fetchAuditLogs();

    const sub = supabase.channel(`agreement_${agreement.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `agreement_id=eq.${agreement.id}` }, () => fetchRelatedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs', filter: `agreement_id=eq.${agreement.id}` }, () => fetchAuditLogs())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [agreement.id]);

  const fetchRelatedData = async () => {
    const { data: subs } = await supabase.from('deliverables').select('*').eq('agreement_id', agreement.id).order('submitted_at', { ascending: false }).limit(1);
    if (subs?.[0]) setDeliverable(subs[0]);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase.from('audit_logs').select('*').eq('agreement_id', agreement.id).order('timestamp', { ascending: false });
    if (data) setAuditLogs(data);
  };

  const statuses = [
    { id: 'DRAFT', label: 'Drafting', color: 'gray' },
    { id: 'ACCEPTED', label: 'Agreement Accepted', color: 'blue' },
    { id: 'FUNDED_AND_LOCKED', label: 'Funds Secured', color: 'amber' },
    { id: 'IN_REVIEW', label: 'Verifying Compliance', color: 'indigo' },
    { id: 'AI_VERIFIED', label: 'AI Review Passed', color: 'purple' },
    { id: 'APPROVED', label: 'Final Approval', color: 'emerald' },
    { id: 'SETTLED', label: 'Settled & Closed', color: 'sky' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.id === agreement.status);
  const progressPercent = ((currentStatusIndex + 1) / statuses.length) * 100;

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'fund') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/fund`);
      } else if (action === 'accept-receiver') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/accept-receiver`);
      } else if (action === 'settle') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/settle`);
      } else if (action === 'submit') {
        const url = prompt("Submit Deliverable URL (e.g. GitHub Repo / Drive Link):");
        if (!url) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/submit`, { deliverable_url: url });
      } else if (action === 'approve') {
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/reviews`, { decision: 'approve', reason: 'Human verified approval' });
      } else if (action === 'dispute') {
        const reason = prompt("Describe the dispute reason:");
        if (!reason) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/dispute`, { reason });
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="glass-card rounded-[32px] overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-[#867361]/5 transition-all duration-500 bg-white border border-gray-100"
    >
      <div className="p-8 space-y-6 flex-grow">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-tighter text-gray-500">
                PROT-{agreement.id.slice(0, 6).toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#867361]/10 text-[#867361] border border-[#867361]/20`}>
                Escrow v2.4
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
              {agreement.title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#867361] animate-pulse shadow-[0_0_8px_rgba(134,115,97,0.4)]" />
                <span className="text-xs font-bold text-gray-600">{agreement.payer?.full_name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9d9286]" />
                <span className="text-xs font-bold text-gray-600">{agreement.receiver?.full_name}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="p-1 rounded-2xl bg-gray-50 border border-gray-100 mb-2 inline-block">
              <div className="px-4 py-3 rounded-xl bg-[#867361]/10 border border-[#867361]/20">
                <p className="text-[10px] font-black text-[#867361] uppercase tracking-widest mb-1 text-center">Value</p>
                <p className="text-2xl font-black text-[#1a1a1a] leading-none">${parseFloat(agreement.amount).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Protocol Status</p>
              <p className="text-lg font-bold text-[#1a1a1a] leading-none">
                {statuses[currentStatusIndex]?.label || agreement.status}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#1a1a1a] leading-none">{Math.round(progressPercent)}%</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Completion</p>
            </div>
          </div>

          <div className="relative h-3 w-full bg-gray-50 rounded-full border border-gray-100 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-[#867361] via-[#9d9286] to-[#a3a3a3] rounded-full shadow-[0_0_15px_rgba(134,115,97,0.2)]"
            />
          </div>

          <div className="flex justify-between px-1">
            {statuses.map((s, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full ${idx <= currentStatusIndex ? 'bg-[#867361] shadow-[0_0_8px_rgba(134,115,97,0.3)]' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fee Transparency</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Platform Protocol</span>
                <span className="text-gray-700 font-bold">-${fees.platform}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tax Reserve</span>
                <span className="text-gray-700 font-bold">-${fees.tax}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-sm font-black">
                <span className="text-[#867361]">Net Disbursement</span>
                <span className="text-emerald-600">${fees.contractor}</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Security & Compliance</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> LEGALLY BINDING
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#867361]">
                  <Lock className="w-3.5 h-3.5" /> CRYPTOGRAPHIC VAULT
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Trigger: {agreement.trigger_type}</p>
            </div>
          </div>
        </div>
        {/* Audit Trail & AI Summary */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {agreement.ai_summary && agreement.status === 'AI_VERIFIED' && (
            <div className="p-4 rounded-2xl bg-[#867361]/5 border border-[#867361]/10 italic text-sm text-[#867361]">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-[#867361]">
                <ShieldCheck className="w-3 h-3" /> AI Verification Summary
              </div>
              "{agreement.ai_summary}"
            </div>
          )}

          {auditLogs.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Audit Trail</p>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-start gap-4 transition-all hover:bg-white hover:shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-[#1a1a1a] capitalize">{log.decision.replace('_', ' ')}</p>
                      <p className="text-[9px] text-gray-500 italic">"{log.reason}"</p>
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
        <AnimatePresence mode="wait">
          {agreement.status === 'ACCEPTED' && currentUserId === agreement.payer_id && (
            <motion.button
              key="fund"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => handleAction('fund')}
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-[#867361]/20"
            >
              <DollarSign className="w-5 h-5" />
              {loading ? 'Processing Protocol...' : 'Secure & Deposit Funds'}
            </motion.button>
          )}

          {agreement.status === 'DRAFT' && currentUserId === agreement.receiver_id && (
            <motion.button
              key="accept"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => handleAction('accept-receiver')}
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 bg-[#6f5e4f]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accept Terms & Bind Protocol
            </motion.button>
          )}

          {agreement.status === 'FUNDED_AND_LOCKED' && currentUserId === agreement.receiver_id && (
            <motion.button
              key="submit"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => handleAction('submit')}
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3"
            >
              <ExternalLink className="w-5 h-5" />
              Submit Deliverable
            </motion.button>
          )}

          {agreement.status === 'AI_VERIFIED' && currentUserId === agreement.payer_id && (
            <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction('approve')}
                className="py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                Approve & Release
              </button>
              <button
                onClick={() => handleAction('dispute')}
                className="py-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                Dispute Work
              </button>
            </motion.div>
          )}

          {agreement.status === 'SETTLED' && (
            <motion.div key="settled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              <div className="w-full py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
                Protocol Successfully Settled
              </div>
              {deliverable?.receipt_url && (
                <a href={deliverable.receipt_url} target="_blank" className="text-center text-[10px] font-bold text-gray-500 hover:text-[#867361] uppercase transition-colors">
                  Download Settlement Audit Log
                </a>
              )}
            </motion.div>
          )}

          {/* Fallback/Default status indicator */}
          {!['ACCEPTED', 'DRAFT', 'FUNDED_AND_LOCKED', 'AI_VERIFIED', 'SETTLED'].includes(agreement.status) && (
            <div className="w-full py-4 rounded-xl bg-gray-100 border border-gray-200 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Awaiting Next Protocol Trigger
            </div>
          )}
        </AnimatePresence>
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
