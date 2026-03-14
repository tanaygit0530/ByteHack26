import React from 'react';
import { User, Briefcase } from 'lucide-react';

const DUMMY_CLIENT = {
  id: '11111111-1111-1111-1111-111111111111',
  full_name: 'Acme Corp (Client)',
  role: 'client',
  wallet_balance: 50000.00
};

const DUMMY_CONTRACTOR = {
  id: '22222222-2222-2222-2222-222222222222',
  full_name: 'Jane Doe (Contractor)',
  role: 'contractor',
  wallet_balance: 150.00
};

const Auth = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-[400px] w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexus</h1>
          <p className="text-gray-500 text-sm">Programmable Cross-Border Escrow</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onLogin(DUMMY_CLIENT)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
            Login as Client
          </button>

          <button
             onClick={() => onLogin(DUMMY_CONTRACTOR)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            Login as Contractor
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-400 border-t border-gray-100 pt-6">
          Development Mode - Dummy Auth Active
        </div>
      </div>
    </div>
  );
};

export default Auth;


