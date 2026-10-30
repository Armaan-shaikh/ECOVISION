import React from 'react';
import { Database, Server, CheckCircle2, AlertTriangle, Cloud, Globe } from 'lucide-react';

export default function BackendStatusPanel({ healthData, error }) {
  const isHealthy = healthData?.status === 'healthy';
  const stack = healthData?.analytics_stack || {};
  const db = healthData?.database || {};
  const apis = healthData?.environmental_apis || {};

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-950/70">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            System & Engine Diagnostics
          </h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1.5">
          {isHealthy ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Flask API: 200 OK</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline / Connecting</span>
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Python Flask Core */}
        <div className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-300/80 uppercase text-[11px] mb-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Python Flask Core</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Python:</span>
            <span className="font-mono text-emerald-300">{stack.python || '3.12.x'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Flask:</span>
            <span className="font-mono text-emerald-300">v{stack.flask || '3.1.3'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Environment:</span>
            <span className="text-emerald-300 capitalize">{healthData?.environment || 'development'}</span>
          </div>
        </div>

        {/* SQLite Database */}
        <div className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-300/80 uppercase text-[11px] mb-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Database</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Driver:</span>
            <span className="text-emerald-300">SQLite3 (Built-in)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Saved Cities:</span>
            <span className="font-mono text-white font-semibold">{db.cities_registered ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Recorded Obs:</span>
            <span className="font-mono text-emerald-300">{db.observations_recorded ?? 0}</span>
          </div>
        </div>

        {/* External APIs */}
        <div className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-300/80 uppercase text-[11px] mb-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open-Meteo Integration</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Geocoding:</span>
            <span className="text-emerald-300">Open-Meteo Geo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">Weather & Air:</span>
            <span className="text-emerald-300">Forecast & CAMS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/60">AQI Standard:</span>
            <span className="text-emerald-300 font-mono">US EPA (0-500)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/30 text-xs text-amber-200 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Note: Connecting to Flask at 127.0.0.1:5000 ({error})</span>
        </div>
      )}
    </div>
  );
}
