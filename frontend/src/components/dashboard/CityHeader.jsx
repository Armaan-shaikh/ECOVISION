import React from 'react';
import { MapPin, RefreshCw, Clock, Database, Radio, Building2 } from 'lucide-react';

export default function CityHeader({ 
  city, 
  lastUpdated, 
  dataSource, 
  aqiScale,
  groundMonitoring,
  onRefresh, 
  isRefreshing 
}) {
  if (!city) return null;

  const isGroundActive = groundMonitoring?.status === 'success';
  const groundStation = isGroundActive ? groundMonitoring.station : null;

  return (
    <div className="eco-card rounded-2xl p-5 border border-emerald-500/15">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* City & Location Details */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {city.name}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 font-medium">
              {[city.state, city.country].filter(Boolean).join(', ')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-400/60 font-mono">
            <span>
              Coordinates: {typeof city.latitude === 'number' ? city.latitude.toFixed(4) : city.latitude}°, {typeof city.longitude === 'number' ? city.longitude.toFixed(4) : city.longitude}°
            </span>
            <span>•</span>
            <span>Timezone: {city.timezone || 'UTC'}</span>
            {city.stored_in_sqlite && (
              <>
                <span>•</span>
                <span className="text-emerald-400 flex items-center space-x-1 font-sans">
                  <Database className="w-3 h-3" />
                  <span>Cached in SQLite</span>
                </span>
              </>
            )}
          </div>

          {/* Active Ground Station Details Pill */}
          {isGroundActive && groundStation && (
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 font-medium flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-emerald-400 inline" />
                <span>CAAQMS Ground Station:</span>
                <span className="text-white font-semibold">{groundStation.name}</span>
                <span className="text-emerald-400/80">({groundStation.distance_km} km)</span>
              </span>
              <span className="text-emerald-400/60 font-mono text-[10px]">
                Agency: {groundStation.operator}
              </span>
            </div>
          )}
        </div>

        {/* Attribution, Timestamp & Refresh Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-left sm:text-right space-y-0.5">
            <div className="text-[11px] text-emerald-400/80 font-medium flex items-center sm:justify-end space-x-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{isGroundActive ? 'CPCB CAAQMS Ground & Open-Meteo' : (dataSource || 'Open-Meteo NWP & Copernicus CAMS')}</span>
            </div>
            <div className="text-[10px] text-emerald-400/70 flex items-center sm:justify-end space-x-1 font-mono">
              <span className="font-semibold text-emerald-300">
                Standard: {aqiScale || (isGroundActive ? 'India National AQI (CPCB)' : 'US EPA AQI (0–500)')}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/50 flex items-center sm:justify-end space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                Observed: {isGroundActive && groundStation?.last_updated
                  ? groundStation.last_updated
                  : (lastUpdated ? new Date(lastUpdated).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Live')}
              </span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#091e14] hover:bg-[#112c1e] border border-emerald-800/40 text-emerald-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
