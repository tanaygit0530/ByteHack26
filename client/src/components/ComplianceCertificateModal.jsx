import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Globe, DollarSign, Clock, CheckCircle2, ChevronRight, Hash, ExternalLink, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

const ComplianceCertificateModal = ({ isOpen, onClose, agreement }) => {
  const printRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!agreement?.compliance_report || !isOpen) return null;

  const report = agreement.compliance_report;

  const handleDownloadPDF = async (e) => {
    e.stopPropagation();
    if (!printRef.current || isGenerating) return;

    try {
      setIsGenerating(true);

      // Add a small delay so UI can update to 'isGenerating' state
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = printRef.current;

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (element.offsetHeight * pageWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, 'FAST');

      const safeId = (agreement?.id || "nexus").slice(0, 8);
      pdf.save(`Settlement_Certificate_${safeId}.pdf`);

    } catch (err) {
      console.error("CRITICAL ERROR DURING PDF GENERATION:", err);
      alert("Error generating compliant PDF. Check browser support and console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-white/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-[#867361]/5 via-transparent to-transparent border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#867361]/10 flex items-center justify-center text-[#867361] border border-[#867361]/20 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-none">Settlement Certificate</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Nexus Immutable Compliance Ledger v1.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="group relative flex items-center gap-2 px-6 py-2.5 bg-[#867361] hover:bg-[#6f5e4f] text-white text-[10px] font-black rounded-xl transition-all shadow-brown10 disabled:opacity-50 active:scale-95"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                  {isGenerating ? "MINTING COMPLIANCE..." : "DOWNLOAD PDF"}
                </button>
                <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div ref={printRef} className="p-8 overflow-y-auto custom-scrollbar space-y-8 bg-white">
            {/* Proof Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#867361] uppercase tracking-widest">
                <Hash className="w-3 h-3" /> Cryptographic Transaction Proof
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 font-mono text-[11px] text-gray-600 break-all select-all hover:bg-[#867361]/5 transition-colors group">
                <span className="text-[#867361] font-bold">TxID:</span> {report.tx_hash}
              </div>
            </div>

            {/* Core Data Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> Verified Timestamps
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Funded:</span>
                    <span className="text-gray-600">{new Date(report.timestamps.agreement_created).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Settled:</span>
                    <span className="text-gray-700 font-bold text-emerald-600">{new Date(report.timestamps.settlement_executed).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Globe className="w-3 h-3" /> Jurisdiction Validation
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Initiator:</span>
                    <span className="text-[#1a1a1a] font-bold">{report.jurisdiction.payer}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Counterparty:</span>
                    <span className="text-[#1a1a1a] font-bold">{report.jurisdiction.receiver}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-300">
                <DollarSign className="w-24 h-24" />
              </div>
              <h3 className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-6 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Reconciliation
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Gross Contract Value</span>
                  <span className="text-[#1a1a1a] font-mono font-bold">${Number(report.financials.gross).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Platform Fee (De-Escrow)</span>
                  <span className="text-rose-600 font-mono">-${Number(report.financials.platform_fee).toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#867361] uppercase">Net Disbursed</span>
                  <span className="text-xl text-emerald-600 font-black font-mono tracking-tighter">${Number(report.financials.receiver_received || report.financials.contractor_received).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Compliance & Tax Liability */}
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 border-l-4 border-l-amber-500">
              <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                Regulatory Tax Liability Statement
              </h3>
              <p className="text-[11px] text-amber-900 leading-relaxed mb-4 italic">
                Based on the {report.jurisdiction.payer || report.jurisdiction.client}/{report.jurisdiction.receiver || report.jurisdiction.contractor} cross-border framework, an estimated liability of <span className="text-amber-700 font-bold">{report.tax_liability_estimate.rate}</span> applies. Funds were not withheld; payment routing was executed in full to the counterparty.
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Estimated Obligation</span>
                <span className="text-xs text-[#1a1a1a] font-mono font-bold">${report.tax_liability_estimate.obligation_usd} USD</span>
              </div>
            </div>

            {/* Footer Verification */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-black">AI Confidence</span>
                  <span className="text-xs text-[#1a1a1a] font-bold">{report.proof_of_work.ai_confidence}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-black">Delivery Proof</span>
                  <a href={report.proof_of_work.submission} target="_blank" className="text-xs text-[#867361] hover:underline flex items-center gap-1 font-bold">
                    View Repo <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-3 h-3" /> Ledger Verified
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ComplianceCertificateModal;
