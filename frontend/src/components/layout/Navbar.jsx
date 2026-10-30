import React from 'react';
import { Activity, ShieldCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function Navbar({ backendHealth, isChecking, onRefresh }) {
  const isConnected = backendHealth?.status === 'healthy';

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/70 bg-[#06140e]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-[#071911] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Eco<span className="text-emerald-400">Vision</span></span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  v0.1.0 Alpha
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/70 tracking-wide font-medium hidden sm:block">
                City Environmental Monitoring & Prediction System
              </p>
            </div>
          </div>

          {/* Right Status Indicators & Action */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Backend Connection Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0b1f15] border border-emerald-900/60 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </>
                )}
              </span>
              <span className="text-emerald-200/90 font-medium hidden md:inline">
                Flask API:
              </span>
              <span className={isConnected ? "text-emerald-400 font-semibold" : "text-amber-300 font-semibold"}>
                {isConnected ? "Connected (SQLite Online)" : "Connecting..."}
              </span>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isChecking}
              className="p-2 rounded-lg bg-[#0c2217] hover:bg-[#123122] border border-emerald-800/40 text-emerald-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Data & Connectivity"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

