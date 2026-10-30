import React, { useState } from 'react';
import { Shield, Radio, Activity, Info, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function PollutantBreakdown({ current }) {
  if (!current) return null;

  const groundMonitoring = current.ground_monitoring;
  const isGroundAvailable = groundMonitoring?.status === 'success';
  const groundPollutants = isGroundAvailable ? groundMonitoring.pollutant_sub_indices : {};
  const groundStation = isGroundAvailable ? groundMonitoring.station : null;

  // Active view tab if ground data exists: "ground" or "cams"
  const [activeView, setActiveView] = useState(isGroundAvailable ? 'ground' : 'cams');

  // Copernicus CAMS Trace Gas Model data
  const camsTraceGases = [
    {
      code: 'PM2.5',
      name: 'Fine Particulates (CAMS)',
      value: current.pm25,
      unit: current.pm25_unit || 'µg/m³',
      source: 'Regional aerosol chemical transport model',
      safeThreshold: '< 15 µg/m³ (WHO 24-hr)'
    },
    {
      code: 'PM10',
      name: 'Coarse Particulates (CAMS)',
      value: current.pm10,
      unit: current.pm10_unit || 'µg/m³',
      source: 'Dust, industrial emissions, and sea-salt',
      safeThreshold: '< 45 µg/m³ (WHO 24-hr)'
    },
    {
      code: 'NO2',
      name: 'Nitrogen Dioxide',
      value: current.no2,
      unit: current.no2_unit || 'µg/m³',
      source: 'Vehicle combustion & power generation',
      safeThreshold: '< 25 µg/m³ (WHO 24-hr)'
    },
    {
      code: 'SO2',
      name: 'Sulphur Dioxide',
      value: current.so2,
      unit: current.so2_unit || 'µg/m³',
      source: 'Industrial fuel combustion & coal power',
      safeThreshold: '< 40 µg/m³ (WHO 24-hr)'
    },
    {
      code: 'CO',
      name: 'Carbon Monoxide',
      value: current.co,
      unit: current.co_unit || 'µg/m³',
      source: 'Incomplete fossil fuel combustion',
      safeThreshold: '< 4,000 µg/m³ (WHO 24-hr)'
    },
    {
      code: 'O3',
      name: 'Ground-Level Ozone',
      value: current.ozone,
      unit: current.ozone_unit || 'µg/m³',
      source: 'Photochemical smog from sunlight + NOx',
      safeThreshold: '< 100 µg/m³ (WHO 8-hr)'
    }
  ];

  // Helper for category styling
  const getSubIndexBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'satisfactory':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/30';
      case 'moderate':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
      case 'poor':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/30';
      case 'very poor':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/30';
      case 'severe':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-4 border border-emerald-500/15">
      {/* Section Header & View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-950/70">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Pollutant Breakdown & Monitoring Observations
            </h3>
          </div>
          <p className="text-xs text-emerald-400/60 font-mono">
            Direct ground CAAQMS sub-indices & regional atmospheric assimilation
          </p>
        </div>

        {/* Tab Switcher if ground data is available */}
        {isGroundAvailable && (
          <div className="flex items-center space-x-1 bg-[#05110c] p-1 rounded-xl border border-emerald-900/40 text-xs">
            <button
              onClick={() => setActiveView('ground')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeView === 'ground'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400/70 hover:text-emerald-200'
              }`}
            >
              Ground CAAQMS Station
            </button>
            <button
              onClick={() => setActiveView('cams')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeView === 'cams'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400/70 hover:text-emerald-200'
              }`}
            >
              CAMS Model (Regional)
            </button>
          </div>
        )}
      </div>

      {/* GROUND CAAQMS STATION VIEW */}
      {isGroundAvailable && activeView === 'ground' && (
        <div className="space-y-4">
          {/* Station Metadata Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Station: {groundStation?.name}</span>
                <span className="text-emerald-400/70 font-mono">({groundStation?.distance_km} km away)</span>
              </div>
              <div className="text-[11px] text-emerald-400/60 font-mono">
                Operator: {groundStation?.operator} • Method: CPCB NAQI Breakpoints
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>CPCB Completeness: Satisfied ({groundMonitoring.completeness?.valid_pollutants_count} pollutants)</span>
              </span>
              <span className="text-[11px] text-emerald-400/60 font-mono">
                {groundStation?.last_updated}
              </span>
            </div>
          </div>

          {/* CPCB Pollutant Sub-indices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.entries(groundPollutants).map(([code, p]) => {
              const hourlyVal = p.sub_index_hourly !== null ? p.sub_index_hourly : '--';
              const avg24hVal = p.sub_index_24h !== null ? p.sub_index_24h : '--';
              const concVal = p.concentration_hourly !== null 
                ? `${p.concentration_hourly} ${p.unit}` 
                : (p.concentration_24h !== null ? `${p.concentration_24h} ${p.unit}` : '--');

              return (
                <div
                  key={code}
                  className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 hover:border-emerald-600/30 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-800/40 text-emerald-300">
                        {code}
                      </span>
                      {p.category_hourly && p.category_hourly !== 'Unavailable' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getSubIndexBadge(p.category_hourly)}`}>
                          {p.category_hourly}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-emerald-100">
                      {p.name || code}
                    </div>

                    {/* Hourly vs 24h Sub-indices */}
                    <div className="mt-2.5 pt-2 border-t border-emerald-950/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-emerald-400/60 uppercase">1-Hr Peak</div>
                        <div className="text-base font-bold font-mono text-white">
                          {hourlyVal}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400/60 uppercase">24-Hr Avg</div>
                        <div className="text-base font-bold font-mono text-emerald-300">
                          {avg24hVal}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Ground Concentration */}
                  <div className="mt-3 pt-2 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-emerald-400/70 font-mono">
                    <span>Est. Surface Conc:</span>
                    <span className="text-white font-semibold">{concVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COPERNICUS CAMS MODEL VIEW (or when ground data is not applicable) */}
      {(!isGroundAvailable || activeView === 'cams') && (
        <div className="space-y-4">
          {/* CAMS Model Context Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copernicus Atmosphere Monitoring Service (CAMS) Model Data</span>
            </div>
            <span className="text-[11px] text-emerald-400/60 font-mono">
              Grid: 0.1° (~11 km) • Standard: US EPA AQI & EU Air Quality Directives
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {camsTraceGases.map((p) => {
              const valDisplay = p.value !== null && p.value !== undefined 
                ? (typeof p.value === 'number' ? (Number.isInteger(p.value) ? p.value : p.value.toFixed(1)) : p.value)
                : '--';

              return (
                <div
                  key={p.code}
                  className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 hover:border-emerald-600/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-800/40 text-emerald-300">
                      {p.code}
                    </span>
                    <span className="text-xs font-mono font-semibold text-white">
                      {valDisplay} <span className="text-[10px] text-emerald-400/70 font-sans">{p.unit}</span>
                    </span>
                  </div>

                  <div className="text-xs font-medium text-emerald-200 mt-1">
                    {p.name}
                  </div>

                  <div className="text-[10px] text-emerald-400/50 mt-1 truncate" title={p.source}>
                    {p.source}
                  </div>

                  <div className="mt-2 pt-2 border-t border-emerald-950/50 flex items-center justify-between text-[10px] text-emerald-400/60 font-mono">
                    <span>Reference Safe Threshold</span>
                    <span className="text-emerald-300">{p.safeThreshold}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
