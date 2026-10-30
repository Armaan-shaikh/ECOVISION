import React from 'react';
import { Gauge, Info, Activity, Thermometer, Droplets, CloudRain, AlertTriangle } from 'lucide-react';

export default function EnvironmentalScoringCard({ scoring }) {
  if (!scoring) return null;

  const overall = scoring.overall || {};
  const indicators = scoring.indicators || {};
  const isOverallValid = overall.status === 'Valid' && overall.overall_score !== null;

  const indicatorConfigs = [
    {
      key: 'aqi',
      label: 'Air Quality (US EPA)',
      weight: '35%',
      icon: Activity,
      color: '#10b981',
      bgBar: 'bg-emerald-500',
    },
    {
      key: 'temperature',
      label: 'Thermal Comfort',
      weight: '25%',
      icon: Thermometer,
      color: '#fb923c',
      bgBar: 'bg-amber-500',
    },
    {
      key: 'humidity',
      label: 'Moisture Balance',
      weight: '20%',
      icon: Droplets,
      color: '#38bdf8',
      bgBar: 'bg-sky-500',
    },
    {
      key: 'rainfall',
      label: 'Rainfall Sufficiency',
      weight: '20%',
      icon: CloudRain,
      color: '#2dd4bf',
      bgBar: 'bg-teal-500',
    },
  ];

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-950/70 gap-2">
        <div className="flex items-center space-x-2.5">
          <Gauge className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Environmental Indicator Score (EIS)
            </h3>
            <p className="text-xs text-emerald-400/60 mt-0.5">
              Weighted multi-criteria normalization across 4 key urban indicators
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 self-start sm:self-auto">
          Scale: 0–100 Favorable
        </span>
      </div>

      {/* Main Grid: Overall Composite Score + Indicator Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Overall Score Card (4 cols) */}
        <div className="lg:col-span-4 rounded-xl p-4 bg-[#081811]/90 border border-emerald-950/80 flex flex-col justify-between text-center relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400/70">
              Overall Composite Rating
            </span>

            {isOverallValid ? (
              <div className="py-3">
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                  {overall.overall_score}
                  <span className="text-lg font-sans text-emerald-400/60 font-normal"> / 100</span>
                </div>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300">
                  {overall.tier}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-amber-200">
                  Insufficient Data
                </div>
                <p className="text-xs text-emerald-400/60 max-w-xs mx-auto">
                  {overall.description || 'Minimum 3 valid indicators required to compute overall index.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-emerald-950/70 text-[11px] text-emerald-400/60 text-left">
            <span>Validated Indicators: </span>
            <strong className="text-emerald-200 font-mono">
              {overall.valid_indicators_count ?? 0} of 4 Available
            </strong>
          </div>
        </div>

        {/* Right: Individual Indicator Breakdown (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {indicatorConfigs.map((cfg) => {
            const dataObj = indicators[cfg.key] || {};
            const Icon = cfg.icon;
            const hasData = dataObj.status === 'Valid' && dataObj.score !== null;

            return (
              <div
                key={cfg.key}
                className="p-3.5 rounded-xl bg-[#081811]/60 border border-emerald-950/80 hover:border-emerald-600/30 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-200">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-400/70">
                      Weight: {cfg.weight}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between my-1">
                    {hasData ? (
                      <>
                        <span className="text-xl font-bold font-mono text-white">
                          {dataObj.score}
                          <span className="text-xs font-sans text-emerald-400/60 font-normal"> / 100</span>
                        </span>
                        <span className="text-xs text-emerald-300/80 font-mono">
                          Raw: {dataObj.raw_value} {dataObj.unit}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-300/80 font-medium italic">
                        No Telemetry Available
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#05110c] h-1.5 rounded-full overflow-hidden my-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cfg.bgBar}`}
                      style={{ width: hasData ? `${Math.min(100, Math.max(5, dataObj.score))}%` : '0%' }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-emerald-400/70 pt-1 truncate" title={dataObj.tier || dataObj.description}>
                  {dataObj.tier || dataObj.description || 'Awaiting measurement'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="p-3 rounded-xl bg-[#06140e] border border-emerald-950/80 flex items-start space-x-2 text-xs text-emerald-400/60">
        <Info className="w-4 h-4 text-emerald-400/80 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-emerald-300 font-medium">Project Indicator Notice: </strong>
          {scoring.disclaimer || 'Project-defined composite indicator for comparative analysis; not an official regulatory health or meteorological standard.'}
        </p>
      </div>
    </div>
  );
}

