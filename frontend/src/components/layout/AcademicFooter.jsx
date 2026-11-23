import React from 'react';

export default function AcademicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 gap-3">
        {/* Project Attribution */}
        <div>
          <strong className="text-slate-900 font-semibold">ECOVISION</strong> – City Environmental Monitoring, Analysis and Prediction System
          <span className="text-slate-400 mx-2">•</span>
          <span className="text-emerald-900 font-medium">Academic Project Interface</span>
        </div>

        {/* Scientific and Computational Stack Specifications */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
          <span>Open-Meteo NWP Telemetry</span>
          <span>•</span>
          <span>CPCB CAAQMS Ground Telemetry</span>
          <span>•</span>
          <span>Copernicus CAMS Atmospheric Model</span>
          <span>•</span>
          <span>Scikit-learn & Pandas</span>
          <span>•</span>
          <span>SQLite3</span>
        </div>
      </div>
    </footer>
  );
}
