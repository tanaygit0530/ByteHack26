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
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#867361]/10 border border-[#867361]/20 text-[#867361] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    Institutional Trust Protocol
                  </span>
                  <h1 className="text-6xl lg:text-8xl font-serif text-[#1a1a1a] leading-[1.05] mb-8 tracking-tight">
                    Never buy or sell <br />
                    <span className="italic secondary-gradient-text opacity-90">without Nexus.</span>
                  </h1>
                  <p className="text-xl text-gray-500 max-w-xl mb-12 leading-relaxed font-medium">
                    The world's premier secure settlement layer. Orchestrating cross-border payments with guaranteed cryptographic trust.
                  </p>

                  <div className="flex flex-wrap gap-6 mb-16">
                    <button
                      onClick={() => setView('signup')}
                      className="group btn-primary"
                    >
                      Start Smart Agreement
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="btn-secondary group">
                      <Play className="w-5 h-5 fill-current text-[#867361] transition-transform group-hover:scale-110" />
                      Watch Platform Demo
                    </button>
                  </div>

                  <div className="flex items-center gap-10 border-t border-gray-100 pt-10">
                    <div className="vertical-accent">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Compliance</p>
                      <p className="text-sm font-bold text-[#1a1a1a]">SOC2 Type II</p>
                    </div>
                    <div className="vertical-accent">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Network</p>
                      <p className="text-sm font-bold text-[#1a1a1a]">Global Vaults</p>
                    </div>
                    <div className="vertical-accent">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Security</p>
                      <p className="text-sm font-bold text-[#1a1a1a]">256-bit TLS</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating Dashboard Card Mockup - Premium Fintech Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="relative hidden lg:block perspective-1000"
              >
                <div className="absolute inset-0 bg-[#867361]/5 blur-[120px] rounded-full animate-pulse" />
                <div className="relative glass-card rounded-[40px] p-10 bg-white/90 backdrop-blur-sm border border-white group">
                  <div className="flex justify-between items-center mb-12">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-[#1a1a1a]">Secure Operations</h3>
                      <p className="text-sm text-gray-400 font-medium">Active volume: $42,500.00</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <Zap className="w-6 h-6 text-[#867361]" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      { icon: Briefcase, title: 'Web Development Project', amount: '$4,500', status: 'Funds Secured' },
                      { icon: Globe, title: 'Domain Transfer (.ai)', amount: '$12,000', status: 'Validation' },
                      { icon: CreditCard, title: 'SaaS Acquisition', amount: '$26,000', status: 'Payment Due' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + (idx * 0.1) }}
                        className="p-5 rounded-3xl bg-white border border-gray-100 flex items-center gap-5 transition-all hover:bg-gray-50 hover:shadow-md cursor-default"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#867361]/5 flex items-center justify-center text-[#867361]">
                          <item.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#1a1a1a] text-base">{item.title}</h4>
                          <p className="text-xs text-gray-400 font-medium">{item.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#1a1a1a] text-base">{item.amount}</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest">Verified</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Decorative Handlers */}
                  <div className="mt-10 pt-10 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">
                    <span>© Nexus Protocol 2026</span>
                    <span className="flex items-center gap-2 italic"> <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Sync Live</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 mt-20 text-gray-400 overflow-hidden h-20"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Scroll</span>
              <div className="w-px h-12 bg-gray-200 relative overflow-hidden">
                <motion.div
                  animate={{ y: [0, 48, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-1/2 bg-[#867361]"
                />
              </div>
            </motion.div>

            {/* Protocol Intelligence - Filling the gap with dynamic value */}
            <section className="mt-32 max-w-7xl mx-auto px-6">
              <div className="glass-card rounded-[48px] p-16 relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/60">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
                    <circle cx="200" cy="200" r="150" stroke="#867361" strokeWidth="1" strokeDasharray="10 10" />
                    <path d="M50 200 L350 200 M200 50 L200 350" stroke="#867361" strokeWidth="1" />
                    <path d="M100 100 L300 300 M300 100 L100 300" stroke="#867361" strokeWidth="1" />
                  </svg>
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                  <div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-[#867361]/10 text-[#867361] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                      Protocol Intelligence
                    </div>
                    <h2 className="text-5xl font-serif text-[#1a1a1a] mb-8 leading-tight">
                      Orchestrating <br />
                      <span className="italic secondary-gradient-text opacity-90 text-6xl">Global Interaction.</span>
                    </h2>
                    <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-md">
                      Our system calculates trust in real-time using a proprietary multi-factor mathematical model that monitors every handshake.
                    </p>

                    <div className="mt-12 p-8 rounded-[32px] bg-[#4a3e35] text-white overflow-hidden relative shadow-2xl shadow-brown-900/20 border border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brown-200 opacity-60">Live Trust Index</span>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Nominal</span>
                        </div>
                      </div>
                      <div className="text-5xl font-serif mb-3 tracking-tight">99.982%</div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '99.982%' }}
                          transition={{ duration: 2.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        />
                      </div>
                      <div className="mt-6 flex justify-between items-center">
                        <p className="text-[10px] text-brown-300/40 font-mono tracking-tighter italic">
                          P(Success | Escrow) = 1 - (R_risk / C)
                        </p>
                        <div className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">A++ Rated</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {[
                      { label: "B2B Interactions", value: "142,581", sub: "+12.4% vs LY" },
                      { label: "Nodes Verified", value: "892", sub: "Global Cluster" },
                      { label: "Tax Reserves", value: "$84.2M", sub: "Escrow Locked" },
                      { label: "API Handshakes", value: "2.1M", sub: "Last 24h" },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        whileInView={{ opacity: 1, scale: 1 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        className="p-8 rounded-[32px] bg-white border border-gray-100 hover:border-[#867361]/20 transition-all group"
                      >
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 group-hover:text-[#867361] transition-colors">{stat.label}</div>
                        <div className="text-3xl font-serif font-bold text-[#1a1a1a] mb-2">{stat.value}</div>
                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{stat.sub}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section id="how-it-works" className="mt-32 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#867361]/3 blur-[120px] rounded-full pointer-events-none" />

              <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-start mb-32">
                <div className="md:w-1/2">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-[#867361]/10 text-[#867361] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    Process Flow
                  </div>
                  <h2 className="text-5xl font-serif text-[#1a1a1a] mb-8 leading-tight">
                    Engineered for <br /><span className="italic secondary-gradient-text opacity-90">Absolute Security.</span>
                  </h2>
                </div>
                <div className="md:w-1/2 pt-12">
                  <p className="text-xl text-gray-500 leading-relaxed font-medium">
                    We leverage the best of cryptographic escrow and AI-verification to help clients and contractors operate with total platform-guaranteed trust.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-0 max-w-7xl mx-auto border-t border-gray-100">
                {[
                  { step: "01", icon: User, text: "Define terms and deliverables manually or with AI guidance.", title: "Handshake" },
                  { step: "02", icon: CreditCard, text: "Funds are deposited into an encrypted Nexus vault.", title: "Funding" },
                  { step: "03", icon: Briefcase, text: "Real-time delivery with GitHub sync and file analysis.", title: "Operations" },
                  { step: "04", icon: CheckCircle2, text: "AI verification scores and client multi-sig approval.", title: "Resolution" },
                  { step: "05", icon: LockIcon, text: "Instant T+0 settlement and automated tax reserve.", title: "Settlement" },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileInView={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 30 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative p-10 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-[#867361]/5 transition-all"
                  >
                    <div className="text-[10px] font-black text-[#867361]/40 mb-10 group-hover:text-[#867361] transition-colors">{item.step}</div>
                    <div className="w-12 h-12 mb-8 rounded-2xl bg-gray-50 flex items-center justify-center text-[#867361] group-hover:bg-[#867361] group-hover:text-white transition-all shadow-sm">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-4">{item.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Tagline Section - Bridging the gap */}
            <section className="mt-20 py-24 bg-[#867361]/5 border-y border-gray-100/50 overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 text-center relative">
                <motion.div
                  whileInView={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  viewport={{ once: true }}
                  className="relative z-10"
                >
                  <p className="text-[10px] font-black text-[#867361] uppercase tracking-[0.5em] mb-12">The Nexus Mandate</p>
                  <h2 className="text-6xl md:text-8xl font-serif text-[#1a1a1a] leading-tight mb-8">
                    Building trust <br />
                    <span className="italic secondary-gradient-text opacity-90">through automation.</span>
                  </h2>
                  <div className="flex justify-center gap-12 mt-16">
                    <div className="w-12 h-px bg-gray-200 self-center" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Institutional Grade</p>
                    <div className="w-12 h-px bg-gray-200 self-center" />
                  </div>
                </motion.div>

                {/* Decorative faint math elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-serif text-[#867361]/3 pointer-events-none select-none italic">
                  Trust
                </div>
              </div>
            </section>

            {/* Global Impact Section - JPMC Inspired */}
            <section className="mt-20 max-w-7xl mx-auto pt-32 pb-40">
              <div className="grid md:grid-cols-2 gap-32 items-center">
                <motion.div
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -30 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-block px-4 py-1.5 rounded-full bg-[#867361]/10 text-[#867361] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    Institutional Capacity
                  </div>
                  <h2 className="text-5xl lg:text-6xl font-serif text-[#1a1a1a] mb-10 leading-tight">
                    Moving at the speed of <br /><span className="italic secondary-gradient-text opacity-90">modern commerce.</span>
                  </h2>
                  <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-md">
                    Nexus isn't just a payment tool; it's a financial orchestration layer designed to eliminate counterparty risk in real-time.
                  </p>
                  <button className="mt-12 text-[#867361] font-bold text-sm uppercase tracking-widest flex items-center gap-2 group">
                    Explore our communities <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-16 gap-x-12">
                  {[
                    { label: "Protocol Capacity", value: "$4.2B+" },
                    { label: "Active Jurisdictions", value: "140+" },
                    { label: "Fraud Incidents", value: "0.0%" },
                    { label: "Settlement Time", value: "T+0" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      whileInView={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="vertical-accent"
                    >
                      <h4 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a1a1a] mb-3">{stat.value}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
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
                          Login as Client
                        </button>
                        <button
                          onClick={() => onLogin(DUMMY_PROFILES.contractor)}
                          className="btn-secondary py-4 text-sm font-bold border-gray-200"
                        >
                          Login as Contractor
                        </button>
                        <button
                          onClick={() => onLogin(DUMMY_PROFILES.admin)}
                          className="mt-4 py-3 bg-[#867361]/5 border border-[#867361]/20 text-[#867361] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#867361] hover:text-white transition-all"
                        >
                          System Admin Access
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
                        <h2 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-8">Choose Your Role</h2>
                        <div className="grid gap-4">
                          <button
                            onClick={() => setRole('client')}
                            className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#867361] hover:bg-white hover:shadow-lg hover:shadow-[#867361]/5 transition-all text-left"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#867361] shadow-sm group-hover:bg-[#867361] group-hover:text-white transition-colors">
                              <User className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#1a1a1a] text-lg">Client</h3>
                              <p className="text-sm text-gray-500 font-medium">Payer / Hirer</p>
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
                              <h3 className="font-extrabold text-[#1a1a1a] text-lg">Contractor</h3>
                              <p className="text-sm text-gray-500 font-medium">Receiver / Freelancer</p>
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
                                  <p className="text-base text-[#1a1a1a] font-bold">Starting Security Check</p>
                                  <p className="text-sm text-gray-500 font-medium">Verifying details for a safe deal...</p>
                                </div>
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Identity Fully Verified</h3>
                                  <p className="text-sm text-gray-500 font-medium">Your profile is ready.</p>
                                </div>
                                <button onClick={handleAuthAction} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 py-4 font-bold">Go to Dashboard</button>
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

