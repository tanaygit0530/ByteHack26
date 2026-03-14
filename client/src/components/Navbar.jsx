import React from 'react';
import { LogOut, User, Wallet } from 'lucide-react';

const Navbar = ({ profile, onLogout }) => {

  return (
    <nav className="border-b border-[#2A344A] bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-white">Nexus</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-[#111827] rounded-full border border-[#2A344A] shadow-sm">
              <div className="flex items-center gap-2 text-white font-medium">
                <Wallet className="w-4 h-4 text-blue-500" />
                <span>${profile?.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="w-px h-4 bg-[#2A344A]"></div>
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm capitalize">{profile?.role}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1A2235] rounded-full transition-colors border border-transparent hover:border-[#2A344A]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
