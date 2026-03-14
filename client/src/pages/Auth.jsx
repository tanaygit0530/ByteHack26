import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, Globe, ShieldCheck, Mail, Lock,
  ChevronRight, CheckCircle2, Shield, Zap, Globe2,
  ArrowRight, Play, Server, CreditCard, LockIcon,
  ExternalLink, Menu, X
} from 'lucide-react';
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
      await supabase.from('profiles').upsert([profileData]);
      setTimeout(() => setKycSimulated(true), 2000);
      return;
    }

    await supabase.from('profiles').upsert([profileData]);
    onLogin(profileData);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a]">
      {/* Landing Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center glass">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#867361] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1a1a1a]">Nexus</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-[#867361] transition-colors">How it works</a>
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#867361] transition-colors">Features</a>
          <a href="#security" className="text-sm font-medium text-gray-600 hover:text-[#867361] transition-colors">Security</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setView('login')} className="text-sm font-bold text-gray-600 hover:text-[#1a1a1a] transition-colors">Log In</button>
          <button
            onClick={() => { setView('signup'); setStep(1); setRole(null); }}
            className="px-5 py-2.5 bg-[#867361] hover:bg-[#6f5e4f] rounded-lg text-sm font-bold text-white transition-all shadow-brown10"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-32 pb-20 px-6"
          >
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#867361]/10 border border-[#867361]/20 text-[#867361] text-xs font-bold uppercase tracking-widest mb-6">
                    Professional Escrow Solution
                  </span>
                  <h1 className="text-5xl lg:text-7xl font-extrabold text-[#1a1a1a] leading-[1.1] mb-6 tracking-tighter">
                    Never buy or sell <br />
                    <span className="gradient-text italic">without Nexus.</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-xl mb-10 leading-relaxed font-medium">
                    The world's most programmable, cross-border escrow protocol. Secure your digital assets, services, and transactions with cryptographic trust.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setView('signup')}
                      className="group btn-primary px-8 py-4 text-base flex items-center gap-2"
                    >
                      Start Secure Transaction
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="btn-secondary px-8 py-4 text-base flex items-center gap-2 border-[#d4d4d4]">
                      <Play className="w-5 h-5 fill-current" />
                      Watch Demo
                    </button>
                  </div>

                  <div className="mt-12 flex items-center gap-6 opacity-40 grayscale">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-sm font-bold">SOC2 Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-5 h-5" />
                      <span className="text-sm font-bold">Global Coverage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      <span className="text-sm font-bold">Immutable Ledger</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating Dashboard Card Mockup - Light Themed */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-[#867361]/10 blur-[100px] rounded-full animate-pulse" />
                <div className="relative glass-card rounded-3xl p-8 border border-gray-200 shadow-xl overflow-hidden min-h-[500px] bg-white">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a1a1a]">Active Transactions</h3>
                      <p className="text-sm text-gray-500 font-medium">Total volume: $42,500.00</p>
                    </div>
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[#867361] to-[#9d9286] flex items-center justify-center text-xs font-bold text-white shadow-lg">
                          U{i}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Briefcase, title: 'Web Development Project', amount: '$4,500', status: 'In Escrow', color: '867361' },
                      { icon: Globe, title: 'Domain Transfer (.ai)', amount: '$12,000', status: 'Validation', color: '9d9286' },
                      { icon: CreditCard, title: 'SaaS Acquisition', amount: '$26,000', status: 'Payment Due', color: '1a1a1a' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 10 }}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4 cursor-default shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#867361] shadow-inner">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#1a1a1a] text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-500 font-medium">{item.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-[#1a1a1a] text-sm">{item.amount}</p>
                          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-tighter">Verified</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#867361]/5 blur-3xl" />
                </div>
              </motion.div>
            </div>

            {/* How it Works Section */}
            <section id="how-it-works" className="mt-40">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">How Nexus Protects You</h2>
                <p className="text-gray-600 max-w-2xl mx-auto font-medium">Five simple steps to secure cross-border transactions.</p>
              </div>

              <div className="grid md:grid-cols-5 gap-6 max-w-7xl mx-auto">
                {[
                  { step: 1, icon: User, text: "Initiator & Counterparty agree terms", title: "Agreement" },
                  { step: 2, icon: CreditCard, text: "Payer submits payment to Escrow", title: "Funding" },
                  { step: 3, icon: Briefcase, text: "Counterparty delivers service/asset", title: "Delivery" },
                  { step: 4, icon: CheckCircle2, text: "Payer approves goods or service", title: "Approval" },
                  { step: 5, icon: LockIcon, text: "Escrow protocol releases funds", title: "Release" },
                ].map((item, idx) => (
                  <div key={idx} className="relative group p-6 rounded-[24px] glass-card hover:border-[#867361]/40 transition-all text-center">
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#867361] text-white font-bold flex items-center justify-center text-xs">
                      {item.step}
                    </div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#867361]/10 flex items-center justify-center text-[#867361] group-hover:scale-110 transition-transform">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.text}</p>
                    {idx < 4 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 translate-y-[-50%] text-gray-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <div className="min-h-screen flex items-center justify-center p-4 pt-24">
            <div className="max-w-md w-full">
              {/* Auth Card */}
              <AnimatePresence mode="wait">
                {view === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="glass-card rounded-[32px] p-10 bg-white"
                  >
                    <div className="mb-8">
                      <button onClick={() => setView('landing')} className="text-xs text-gray-500 hover:text-[#867361] font-bold mb-6 flex items-center gap-1 transition-colors uppercase tracking-widest">
                        ← Back to Home
                      </button>
                      <h2 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">Welcome Back</h2>
                      <p className="text-sm text-gray-500 font-medium">Enter your credentials to access the protocol.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
                          <input className="w-full pl-12 bg-gray-50 !border-gray-200 focus:!border-[#867361]" defaultValue="jane@nexus.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Protocol Key</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#867361] transition-colors" />
                          <input className="w-full pl-12 bg-gray-50 !border-gray-200 focus:!border-[#867361]" type="password" defaultValue="••••••••" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mt-10">
                        <button
                          onClick={() => onLogin(DUMMY_PROFILES.client)}
                          className="btn-primary py-4 text-sm font-bold shadow-brown20"
                        >
                          Login as Deal Initiator
                        </button>
                        <button
                          onClick={() => onLogin(DUMMY_PROFILES.contractor)}
                          className="btn-secondary py-4 text-sm font-bold border-gray-200"
                        >
                          Login as Counterparty
                        </button>
                        <button
                          onClick={() => onLogin(DUMMY_PROFILES.admin)}
                          className="mt-4 py-3 bg-[#867361]/5 border border-[#867361]/20 text-[#867361] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#867361] hover:text-white transition-all"
                        >
                          Protocol Arbiter Node Access
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === 'signup' && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="glass-card rounded-[32px] p-10 bg-white relative overflow-hidden"
                  >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
                      <div
                        className="h-full bg-[#867361] transition-all duration-700 ease-out"
                        style={{ width: `${step === 1 ? '50%' : '100%'}` }}
                      ></div>
                    </div>

                    {!role ? (
                      <div>
                        <button onClick={() => setView('landing')} className="text-xs text-gray-500 hover:text-[#867361] font-bold mb-8 flex items-center gap-1 transition-colors uppercase tracking-widest">
                          ← Home
                        </button>
                        <h2 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-8">Choose Your Protocol Role</h2>
                        <div className="grid gap-4">
                          <button
                            onClick={() => setRole('client')}
                            className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#867361] hover:bg-white hover:shadow-lg hover:shadow-[#867361]/5 transition-all text-left"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#867361] shadow-sm group-hover:bg-[#867361] group-hover:text-white transition-colors">
                              <User className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#1a1a1a] text-lg">Deal Initiator</h3>
                              <p className="text-sm text-gray-500 font-medium">Payer / Service Receiver</p>
                            </div>
                            <ChevronRight className="ml-auto w-6 h-6 text-gray-300 group-hover:text-[#867361] transition-colors" />
                          </button>
                          <button
                            onClick={() => setRole('contractor')}
                            className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#9d9286] hover:bg-white hover:shadow-lg hover:shadow-[#9d9286]/5 transition-all text-left"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#9d9286] shadow-sm group-hover:bg-[#9d9286] group-hover:text-white transition-colors">
                              <Briefcase className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#1a1a1a] text-lg">Counterparty</h3>
                              <p className="text-sm text-gray-500 font-medium">Receiver / Service Provider</p>
                            </div>
                            <ChevronRight className="ml-auto w-6 h-6 text-gray-300 group-hover:text-[#9d9286] transition-colors" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-10">
                          <button onClick={() => setRole(null)} className="text-xs text-gray-500 hover:text-[#867361] font-bold mb-6 flex items-center gap-1 transition-colors uppercase tracking-widest">
                            ← Back
                          </button>
                          <h2 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight capitalize mb-2">
                            {step === 1 ? `${role} Profile` : 'KYC Verification'}
                          </h2>
                          <p className="text-sm text-gray-500 font-medium">Step {step} of 2: Programmable Compliance</p>
                        </div>

                        {step === 1 ? (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name / Legal Entity</label>
                              <input className="w-full bg-gray-50 !border-gray-200" placeholder="John Doe or Acme Inc" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Jurisdiction</label>
                              <select className="w-full h-[48px] bg-gray-50 !border-gray-200">
                                <option>United States</option>
                                <option>European Union</option>
                                <option>India</option>
                                <option>Singapore</option>
                                <option>United Kingdom</option>
                              </select>
                            </div>
                            <button onClick={handleAuthAction} className="btn-primary w-full mt-6 py-4 font-bold shadow-brown20">Initialize Identity Protocol</button>
                          </div>
                        ) : (
                          <div className="py-10 text-center">
                            {!kycSimulated ? (
                              <div className="space-y-8">
                                <div className="w-14 h-14 border-4 border-gray-100 border-t-[#867361] rounded-full animate-spin mx-auto" />
                                <div className="space-y-2">
                                  <p className="text-base text-[#1a1a1a] font-bold">Executing Cross-Border Validation</p>
                                  <p className="text-sm text-gray-500 font-medium">Validating tax regimes & legal standing...</p>
                                </div>
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Identity Fully Verified</h3>
                                  <p className="text-sm text-gray-500 font-medium">Protocol parameters have been synchronized.</p>
                                </div>
                                <button onClick={handleAuthAction} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 py-4 font-bold">Access Secured Dashboard</button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer - Light Theme */}
      <footer className="py-24 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-[#867361] rounded-xl flex items-center justify-center shadow-brown10">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tighter text-[#1a1a1a]">Nexus</span>
            </div>
            <p className="text-gray-500 max-w-sm mb-10 leading-relaxed font-medium">Providing programmable trust for global commerce. Secure, compliant, and cryptographic by default. Operating across 140+ jurisdictions.</p>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#867361] hover:bg-[#867361]/5 transition-all cursor-pointer flex items-center justify-center" />)}
            </div>
          </div>
          <div>
            <h4 className="font-black text-[#1a1a1a] mb-8 uppercase text-[10px] tracking-[0.2em]">Protocol</h4>
            <ul className="space-y-5 text-sm text-gray-500 font-medium">
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Security Model</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">API Reference</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Node Validators</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Smart Contracts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[#1a1a1a] mb-8 uppercase text-[10px] tracking-[0.2em]">Company</h4>
            <ul className="space-y-5 text-sm text-gray-500 font-medium">
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Jurisdictions</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Compliance Registry</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Legal Documentation</li>
              <li className="hover:text-[#867361] cursor-pointer transition-colors">Support Hub</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">
          <p>© 2026 NEXUS PROTOCOL INC. EMPOWERING BORDERLESS COMMERCE.</p>
          <div className="flex gap-10">
            <span className="hover:text-[#867361] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#867361] cursor-pointer transition-colors">Terms of Service</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-emerald-600">Protocol Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default Auth;

