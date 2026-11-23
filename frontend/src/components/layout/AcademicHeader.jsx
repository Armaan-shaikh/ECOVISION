import React from 'react';
import { Menu, RefreshCw, MapPin } from 'lucide-react';

export default function AcademicHeader({
  onToggleSidebar,
  selectedCity,
  backendHealth,
  isRefreshing,
  onRefresh
}) {
  const isConnected = backendHealth?.status === 'healthy';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu Toggle & Formal Project Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  ECOVISION
                </h1>
                <span className="hidden sm:inline-block text-slate-300 font-light">|</span>
                <span className="hidden sm:inline-block text-xs font-semibold text-emerald-900 tracking-normal uppercase">
                  City Environmental Monitoring, Analysis and Prediction System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Academic Project Edition • Atmospheric Informatics & Environmental Analytics Laboratory
              </p>
            </div>
          </div>

          {/* Right: Active City Context, Connectivity Indicator & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Active City Context Pill */}
            {selectedCity && (
              <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-slate-500 font-medium">Domain:</span>
                <span className="text-slate-900 font-semibold">{selectedCity.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({typeof selectedCity.latitude === 'number' ? selectedCity.latitude.toFixed(2) : selectedCity.latitude}°, {typeof selectedCity.longitude === 'number' ? selectedCity.longitude.toFixed(2) : selectedCity.longitude}°)
                </span>
              </div>
            )}

            {/* Backend Connectivity Status (Formal, No Pulsing/Pinging) */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              <span className="text-slate-600 font-medium hidden sm:inline">
                Flask API:
              </span>
              <span className={isConnected ? "text-emerald-800 font-semibold font-mono" : "text-amber-700 font-semibold font-mono"}>
                {isConnected ? "Connected (SQLite Online)" : "Connecting..."}
              </span>
            </div>

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Observations & Backend Health"
              aria-label="Refresh Observations & Backend Health"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-800 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
