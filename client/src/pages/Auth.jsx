import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Globe, ShieldCheck, Mail, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DUMMY_PROFILES = {
  client: {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Acme Corp (Client)',
    email: 'client@nexus.com',
    role: 'client',
    country: 'USA',
    company_type: 'LLC',
    kyc_status: 'VERIFIED',
    jurisdiction_metadata: { tax_regime: 'US-Resident', default_withholding: 0 }
  },
  contractor: {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Jane Doe (Contractor)',
    email: 'contractor@nexus.com',
    role: 'contractor',
    country: 'India',
    company_type: 'Individual',
    kyc_status: 'VERIFIED',
    jurisdiction_metadata: { tax_regime: 'IN-Resident', treaty_benefit: true }
  },
  admin: {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Protocol Arbiter',
    email: 'arbiter@nexus.com',
    role: 'admin',
    country: 'Global',
    company_type: 'Organization',
    kyc_status: 'VERIFIED'
  }
};

const Auth = ({ onLogin }) => {
  const [view, setView] = useState('landing'); // landing, login, signup
  const [role, setRole] = useState(null);
  const [step, setStep] = useState(1);
  const [kycSimulated, setKycSimulated] = useState(false);

  const handleAuthAction = async () => {
    const profileData = DUMMY_PROFILES[role || 'client'];
    
    if (view === 'signup' && step === 1) {
      setStep(2);
      // Ensure profile exists in DB
      await supabase.from('profiles').upsert([profileData]);
      
      setTimeout(() => {
        setKycSimulated(true);
      }, 2000);
      return;
    }
    
    // Login or Final Signup step
    await supabase.from('profiles').upsert([profileData]);
    onLogin(profileData);
  };

  const countries = [
    { code: 'USA', name: 'USA (10% Tax Reserve)', tax: '10%' },
    { code: 'India', name: 'India (Domestic)', tax: '5%' },
    { code: 'UK', name: 'UK (10% Tax Reserve)', tax: '10%' },
    { code: 'Germany', name: 'Germany', tax: '10%' },
    { code: 'Singapore', name: 'Singapore', tax: '2%' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-white font-black text-2xl">N</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Nexus</h1>
          </div>
          <p className="text-gray-400 font-medium">Programmable Cross-Border Escrow</p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#111827] border border-[#2A344A] rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6 text-center">Select Your Protocol Role</h2>
              <div className="grid gap-4">
                <button
                  onClick={() => { setRole('client'); setView('signup'); }}
                  className="group relative flex items-center gap-4 p-5 rounded-2xl bg-[#1A2235] border border-[#2A344A] hover:border-blue-500/50 hover:bg-[#1f2942] transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Client / Funder</h3>
                    <p className="text-xs text-gray-500">I want to fund projects and hire experts</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                </button>

                <button
                  onClick={() => { setRole('contractor'); setView('signup'); }}
                  className="group relative flex items-center gap-4 p-5 rounded-2xl bg-[#1A2235] border border-[#2A344A] hover:border-indigo-500/50 hover:bg-[#1f2942] transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white transition-colors">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Contractor / Agency</h3>
                    <p className="text-xs text-gray-500">I want to execute work and secure payments</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-gray-600 group-hover:text-indigo-500" />
                </button>
              </div>
              
              <p className="mt-8 text-center text-sm text-gray-500">
                Already registered? <button onClick={() => setView('login')} className="text-blue-400 font-bold hover:underline">Log In</button>
              </p>
            </motion.div>
          )}

          {view === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#111827] border border-[#2A344A] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1A2235]">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${step === 1 ? '50%' : '100%'}` }}
                ></div>
              </div>

              <div className="mb-8">
                <button onClick={() => setView('landing')} className="text-xs text-gray-500 hover:text-white mb-4 flex items-center gap-1">
                  ← Back to Selection
                </button>
                <h2 className="text-2xl font-bold text-white capitalize">{step === 1 ? `${role} Registration` : 'KYC Verification'}</h2>
                <p className="text-sm text-gray-400">Step {step} of 2</p>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name / Org</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input className="w-full pl-10" placeholder="Acme Corporation" defaultValue={DUMMY_PROFILES[role]?.full_name} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input className="w-full pl-10" type="email" placeholder="hello@nexus.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tax Jurisdiction</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <select className="w-full pl-10 h-[42px]">
                        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAuthAction}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-4 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    Continue to KYC
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  {!kycSimulated ? (
                    <div className="space-y-6">
                      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Cross-Border Compliance Check</h3>
                        <p className="text-sm text-gray-400 mt-2">Checking global sanctions list & jurisdiction tax treaties...</p>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Jurisdiction Verified</h3>
                        <div className="mt-4 p-4 bg-[#1A2235] rounded-2xl border border-[#2A344A] text-left space-y-2">
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-500">KYC Status</span>
                             <span className="text-emerald-400 font-bold uppercase">Passed</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-500">Jurisdiction Label</span>
                             <span className="text-white font-bold">{DUMMY_PROFILES[role]?.country} Resident</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-gray-500">Tax Protocol</span>
                             <span className="text-amber-400 font-bold">10% Reserve Active</span>
                           </div>
                        </div>
                      </div>
                      <button
                        onClick={handleAuthAction}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-all"
                      >
                        Enter Dashboard
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === 'login' && (
             <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-[#2A344A] rounded-3xl p-8 shadow-2xl"
             >
                <div className="mb-8">
                  <button onClick={() => setView('landing')} className="text-xs text-gray-500 hover:text-white mb-4">← Back</button>
                  <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                  <p className="text-sm text-gray-400">Secure Protocol Login</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input className="w-full pl-10" defaultValue="jane@nexus.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Protocol Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input className="w-full pl-10" type="password" defaultValue="••••••••" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                      onClick={() => onLogin(DUMMY_PROFILES.client)}
                      className="py-3 rounded-xl bg-[#1A2235] border border-[#2A344A] text-xs font-bold text-white hover:bg-[#1f2942] transition-all"
                    >
                      Login (Client)
                    </button>
                    <button 
                      onClick={() => onLogin(DUMMY_PROFILES.contractor)}
                      className="py-3 rounded-xl bg-[#1A2235] border border-[#2A344A] text-xs font-bold text-white hover:bg-[#1f2942] transition-all"
                    >
                      Login (Contractor)
                    </button>
                    <button 
                      onClick={() => onLogin(DUMMY_PROFILES.admin)}
                      className="col-span-2 py-3 mt-2 rounded-xl bg-indigo-600/20 border border-indigo-600/40 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                    >
                      Login as Protocol Arbiter
                    </button>
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-center gap-6 grayscale opacity-40">
           <ShieldCheck className="w-5 h-5" />
           <Globe className="w-5 h-5" />
           <Lock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
