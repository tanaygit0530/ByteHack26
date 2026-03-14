import React from 'react';
import Dashboard from './Dashboard';
import { Zap, Shield, Users } from 'lucide-react';

const ClientToClient = ({ profile, refreshProfile }) => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Users className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
             <Zap className="w-3 h-3" /> Peer-to-Peer Protocol
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Client ↔ Client Escrow</h1>
          <p className="text-gray-400 leading-relaxed">
            Eliminate middleman friction. Any participant can now act as the Initiator or Counterparty. 
            Automated AI verification and instant settlement applied to peer-to-peer agreements.
          </p>
        </div>
      </div>

      <Dashboard profile={profile} refreshProfile={refreshProfile} isC2CView={true} />
    </div>
  );
};

export default ClientToClient;
