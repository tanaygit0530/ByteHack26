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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: agreement.title,
    description: agreement.description,
    deliverables: agreement.deliverables,
    amount: agreement.amount
  });

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
    { id: 'AGREEMENT_CREATED', label: 'Agreement Created', color: 'gray' },
    { id: 'ACCEPTED', label: 'Agreement Accepted', color: 'blue' },
    { id: 'ESCROW_FUNDED', label: 'Funds Deposited', color: 'cyan' },
    { id: 'ESCROW_LOCKED', label: 'Vault Secured', color: 'amber' },
    { id: 'WORK_SUBMITTED', label: 'Work Under Review', color: 'indigo' },
    { id: 'READY_FOR_RELEASE', label: 'Verification Passed', color: 'emerald' },
    { id: 'PAID', label: 'Fully Settled', color: 'sky' },
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
      } else if (action === 'update') {
        await axios.put(`${API_BASE_URL}/agreements/${agreement.id}`, editData);
        setIsEditing(false);
      } else if (action === 'dispute') {
        const reason = prompt("Describe the dispute reason:");
        if (!reason) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/dispute`, { reason });
      } else if (action === 'reject') {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        await axios.post(`${API_BASE_URL}/agreements/${agreement.id}/reject`, { reason });
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
    tax: parseFloat(agreement.estimated_tax || 0).toFixed(2),
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
                DEAL-{agreement.id.slice(0, 6).toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#867361]/10 text-[#867361] border border-[#867361]/20`}>
                Smart Agreement
              </span>
            </div>
            {isEditing ? (
              <input
                className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:border-[#867361]"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            ) : (
              <h3 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight">
                {agreement.title}
              </h3>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#867361] animate-pulse shadow-[0_0_8px_rgba(134,115,97,0.4)]" />
                <span className="text-xs font-bold text-gray-600">{agreement.payer?.full_name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 relative group/member">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9d9286]" />
                <span className="text-xs font-bold text-gray-600">{agreement.receiver?.full_name}</span>

                {/* Contractor Trust Tooltip/Badge */}
                {agreement.receiver?.total_projects > 0 && (
                  <div className="absolute top-10 left-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 hidden group-hover/member:block z-50">
                    {(() => {
                      const c = agreement.receiver;
                      const disputeRate = c.completed_projects > 0 ? (c.total_disputes / c.completed_projects) * 100 : 0;
                      let label = 'TRUSTED';
                      let color = 'text-emerald-500';
                      let dot = '🟢';
                      if (disputeRate >= 15) { label = 'HIGH RISK'; color = 'text-rose-500'; dot = '🔴'; }
                      else if (disputeRate >= 5) { label = 'MODERATE'; color = 'text-amber-500'; dot = '🟡'; }

                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Health</span>
                            <span className={`text-[9px] font-black ${color} uppercase tracking-widest`}>{dot} {label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center border-t border-gray-50 pt-2">
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Done</p>
                              <p className="text-xs font-black text-[#1a1a1a]">{c.completed_projects}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Rate</p>
                              <p className="text-xs font-black text-[#1a1a1a]">{disputeRate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="p-1 rounded-2xl bg-gray-50 border border-gray-100 mb-2 inline-block">
              <div className="px-4 py-3 rounded-xl bg-[#867361]/10 border border-[#867361]/20">
                <p className="text-[10px] font-black text-[#867361] uppercase tracking-widest mb-1 text-center">Value</p>
                {isEditing ? (
                  <input
                    type="number"
                    className="text-2xl font-black text-[#1a1a1a] leading-none w-24 bg-transparent border-none text-center outline-none"
                    value={editData.amount}
                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  />
                ) : (
                  <p className="text-2xl font-black text-[#1a1a1a] leading-none">${parseFloat(agreement.amount).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Agreement Status</p>
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

        {/* Agreement Terms (Editable in C2C Negotiate) */}
        {(isC2CView || isEditing || agreement.description) && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agreement Terms</p>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:border-[#867361] outline-none min-h-[80px]"
                    placeholder="Describe the agreement..."
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                  <textarea
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:border-[#867361] outline-none border-dashed min-h-[80px]"
                    placeholder="List deliverables..."
                    value={editData.deliverables}
                    onChange={(e) => setEditData({ ...editData, deliverables: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{agreement.description}</p>
                  </div>
                  {agreement.deliverables && (
                    <div className="flex flex-wrap gap-2">
                      {agreement.deliverables.split('\n').map((d, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-[#867361]/5 border border-[#867361]/10 text-[10px] font-bold text-[#867361]">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fee Transparency</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Service Fee</span>
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
          {agreement.ai_summary && ['WORK_SUBMITTED', 'READY_FOR_RELEASE', 'PAID', 'DISPUTED'].includes(agreement.status) && (
            <div className="p-4 rounded-2xl bg-[#867361]/5 border border-[#867361]/10 italic text-sm text-[#867361]">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-[#867361]">
                <ShieldCheck className="w-3 h-3" /> AI Verification Summary
              </div>
              "{agreement.ai_summary}"
            </div>
          )}

          {auditLogs.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agreement History</p>
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
          {agreement.status === 'AGREEMENT_CREATED' && currentUserId === agreement.receiver_id && (
            <motion.div key="negotiate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              {isC2CView ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`py-4 rounded-2xl font-bold transition-all shadow-sm ${isEditing ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                  >
                    {isEditing ? 'Cancel Changes' : 'Suggest Adjustments'}
                  </button>
                  {isEditing ? (
                    <button
                      onClick={() => handleAction('update')}
                      disabled={loading}
                      className="py-4 rounded-2xl bg-[#867361] text-white font-bold hover:bg-[#6f5e4f] transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {loading ? 'Saving...' : 'Save & Propose'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('accept-receiver')}
                      disabled={loading}
                      className="py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Accept Terms
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAction('accept-receiver')}
                  disabled={loading}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-3 bg-[#6f5e4f]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Accept Terms & Start Agreement
                </button>
              )}
              {isC2CView && !isEditing && (
                <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
                  Review terms carefully before accepting the secure handshake.
                </p>
              )}
            </motion.div>
          )}

          {agreement.status === 'AGREEMENT_CREATED' && currentUserId === agreement.payer_id && (
            <motion.div key="client-negotiate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="py-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  Reject Deal
                </button>
                <button
                  onClick={() => handleAction('fund')}
                  disabled={loading}
                  className="py-4 rounded-2xl bg-[#867361] text-white font-bold hover:bg-[#6f5e4f] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Accept & Secure Funds
                </button>
              </div>
              {isC2CView && (
                <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
                  Funds will be held in a secure vault until work is delivered.
                </p>
              )}
            </motion.div>
          )}

          {agreement.status === 'ACCEPTED' && currentUserId === agreement.payer_id && (
            <motion.button
              key="fund"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => handleAction('fund')}
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-[#867361]/20"
            >
              <DollarSign className="w-5 h-5" />
              {loading ? 'Processing...' : 'Secure & Deposit Funds'}
            </motion.button>
          )}

          {['ESCROW_FUNDED', 'ESCROW_LOCKED'].includes(agreement.status) && currentUserId === agreement.receiver_id && (
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

          {['WORK_SUBMITTED', 'READY_FOR_RELEASE'].includes(agreement.status) && currentUserId === agreement.payer_id && (
            <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction('approve')}
                className="py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                Approve Work (Triggers Settlement)
              </button>
              <button
                onClick={() => handleAction('dispute')}
                className="py-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                Dispute Work
              </button>
            </motion.div>
          )}

          {agreement.status === 'PAID' && (
            <motion.div key="settled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              <div className="w-full py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
                Agreement Fully Settled
              </div>
              <button
                onClick={() => setShowCertificate(true)}
                className="text-center text-[10px] font-bold text-gray-500 hover:text-[#867361] uppercase transition-colors"
              >
                View Settlement & Compliance Audit Log
              </button>
            </motion.div>
          )}

          {/* Fallback/Default status indicator */}
          {!['AGREEMENT_CREATED', 'ACCEPTED', 'ESCROW_FUNDED', 'ESCROW_LOCKED', 'WORK_SUBMITTED', 'READY_FOR_RELEASE', 'PAID'].includes(agreement.status) && (
            <div className="w-full py-4 rounded-xl bg-gray-100 border border-gray-200 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Awaiting Next Step
            </div>
          )}
        </AnimatePresence>
      </div>

      <ComplianceCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        agreement={agreement}
      />
    </motion.div >
  );
};


export default AgreementCard;
