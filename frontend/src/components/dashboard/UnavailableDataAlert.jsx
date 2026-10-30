import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function UnavailableDataAlert({ message, onRetry }) {
  return (
    <div className="eco-card rounded-2xl p-6 border border-amber-600/30 bg-amber-950/20 text-center space-y-3">
      <div className="inline-flex p-3 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-amber-200">
        Environmental Telemetry Unavailable
      </h3>
      <p className="text-xs text-amber-300/80 max-w-lg mx-auto leading-relaxed">
        {message || "Real-time environmental telemetry is currently unavailable for this municipality from Open-Meteo API. EcoVision does not invent artificial measurements."}
      </p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-900/40 hover:bg-amber-900/60 border border-amber-600/40 text-amber-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Ingestion</span>
          </button>
        </div>
      )}
    </div>
  );
}

