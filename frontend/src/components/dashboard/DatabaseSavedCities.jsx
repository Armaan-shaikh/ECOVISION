import React from 'react';
import { Database, Clock, ArrowRight, MapPin } from 'lucide-react';

export default function DatabaseSavedCities({ savedCities = [], onSelectCity, currentCityId, currentCityCoordinates }) {
  if (!savedCities || savedCities.length === 0) {
    return (
      <div className="eco-card rounded-2xl p-5 border border-emerald-500/15 text-xs text-emerald-400/60 flex items-center space-x-2">
        <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>SQLite Telemetry Store: No cities recorded yet. Search any municipality to record telemetry.</span>
      </div>
    );
  }

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-950/70">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            SQLite Database: Recorded Cities
          </h3>
        </div>
        <span className="text-[11px] text-emerald-400/60 font-mono">
          {savedCities.length} Municipalities Persisted
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {savedCities.map((c) => {
          const isSelected = (currentCityId && currentCityId === c.id) || (
            currentCityCoordinates &&
            typeof currentCityCoordinates.lat === 'number' &&
            typeof currentCityCoordinates.lon === 'number' &&
            Math.abs(currentCityCoordinates.lat - c.latitude) < 0.05 &&
            Math.abs(currentCityCoordinates.lon - c.longitude) < 0.05
          );
          return (
            <button
              key={c.id}
              onClick={() => onSelectCity(c)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-emerald-900/50 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-[#081811]/60 border-emerald-950/80 hover:border-emerald-600/40 hover:bg-[#0c2217]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[80%]">{c.name}</span>
                  <MapPin className="w-3 h-3 text-emerald-400/60 flex-shrink-0" />
                </div>
                <div className="text-[11px] text-emerald-400/60 truncate">
                  {[c.state, c.country].filter(Boolean).join(', ')}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[10px] text-emerald-400/70">
                <span>
                  {c.last_aqi !== null && c.last_aqi !== undefined ? `AQI: ${c.last_aqi}` : 'Stored'}
                </span>
                {c.last_temperature !== null && c.last_temperature !== undefined && (
                  <span className="font-mono text-emerald-300">
                    {c.last_temperature.toFixed(1)}°C
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

