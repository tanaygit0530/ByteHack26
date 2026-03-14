import React from 'react';
import { motion } from 'framer-motion';
import Dashboard from './Dashboard';
import { Zap, Shield, Users } from 'lucide-react';

const ClientToClient = ({ profile, refreshProfile }) => {
  return (
    <div className="space-y-12 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[40px] p-12 relative overflow-hidden group border-gray-100 shadow-xl bg-white"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <Users className="w-64 h-64 text-[#867361]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 text-[#867361] font-extrabold uppercase tracking-[0.3em] text-[10px] mb-6 bg-[#867361]/10 w-fit px-4 py-2 rounded-full border border-[#867361]/20">
            <Zap className="w-3.5 h-3.5 fill-current" /> Peer-to-Peer Protocol
          </div>
          <h1 className="text-5xl font-extrabold text-[#1a1a1a] mb-6 tracking-tight leading-tight">
            Client ↔ Client <span className="gradient-text italic">Sovereignty.</span>
          </h1>
          <p className="text-gray-500 text-xl font-medium leading-relaxed mb-8">
            Eliminate intermediary friction. Any protocol participant can now initialize
            secure agreements as either the Initiator or Counterparty with
            <span className="text-[#867361] font-bold"> automated AI verification </span> and
            <span className="text-[#867361] font-bold"> instant cryptographic settlement.</span>
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#867361]" />
              <span className="text-sm font-bold text-gray-500">P2P Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-bold text-gray-500">T+0 Settlement</span>
            </div>
          </div>
        </div>
      </motion.div>

      <Dashboard profile={profile} refreshProfile={refreshProfile} isC2CView={true} />
    </div>
  );
};


export default ClientToClient;
