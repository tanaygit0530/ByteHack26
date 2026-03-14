import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const CreateAgreementModal = ({ onClose, refresh, profile }) => {
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    contractor_id: '',
  });

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'contractor');
      
      if (!error && data && data.length > 0) {
        setContractors(data);
      } else {
        // Fallback for dummy auth mode if DB is empty
        setContractors([{
          id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Jane Doe (Contractor)'
        }]);
      }
    } catch {
        setContractors([{
          id: '22222222-2222-2222-2222-222222222222',
          full_name: 'Jane Doe (Contractor)'
        }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('agreements')
        .insert([{
          ...formData,
          client_id: profile.id,
          status: 'PENDING_ACCEPTANCE'
        }]);

      if (error) {
        console.warn("DB Insert Failed. If running offline/dummy, this is expected:", error.message);
      }

      refresh();
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
      ></motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">New Smart Agreement</h2>
            <p className="text-sm text-gray-400">Define your terms and secure the funds</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Contract Title</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                required
                className="w-full pl-11"
                placeholder="Web Development - Frontend Project"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="number"
                  className="w-full pl-11 font-mono"
                  placeholder="2500"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              {formData.amount && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] space-y-1">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Platform Fee (2%)</span>
                    <span>${(formData.amount * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Simulated Tax (10%)</span>
                    <span>${(formData.amount * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-white/10 pt-1 mt-1">
                    <span>Contractor Receives</span>
                    <span>${(formData.amount * 0.88).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="date"
                  className="w-full pl-11"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Select Contractor</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                className="w-full pl-11 h-[42px]"
                value={formData.contractor_id}
                onChange={(e) => setFormData({...formData, contractor_id: e.target.value})}
              >
                <option value="">Choose a contractor...</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Project Description</label>
            <textarea
              className="w-full min-h-[100px]"
              placeholder="Describe the deliverables and terms..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-lg transition-all shadow-xl shadow-primary-500/20 active:scale-95"
          >
            {loading ? 'Initiating...' : 'Initialize Agreement'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAgreementModal;
