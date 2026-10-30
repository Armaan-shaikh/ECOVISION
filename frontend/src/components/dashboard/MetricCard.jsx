import React from 'react';

export default function MetricCard({ title, value, unit, status, description, icon: Icon, color = "emerald" }) {
  const getBadgeClasses = (type) => {
    switch (type?.toLowerCase()) {
      case 'good':
      case 'optimal':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
      case 'satisfactory':
        return 'bg-teal-950/70 text-teal-300 border-teal-500/30';
      case 'moderate':
      case 'normal':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/30';
      case 'poor':
      case 'unhealthy for sensitive groups':
        return 'bg-orange-950/70 text-orange-300 border-orange-500/30';
      case 'very poor':
      case 'unhealthy':
      case 'very unhealthy':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/30';
      case 'severe':
      case 'hazardous':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/30';
      case 'unavailable':
      case 'aqi unavailable':
        return 'bg-gray-950/70 text-gray-400 border-gray-700/40';
      default:
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
    }
  };

  const formattedValue = value !== null && value !== undefined 
    ? (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value)
    : '--';

  return (
    <div className="eco-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">
            {title}
          </span>
          {Icon && (
            <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/20 text-emerald-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Value & Unit */}
        <div className="flex items-baseline space-x-1.5 my-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {formattedValue}
          </span>
          {unit && (
            <span className="text-xs font-medium text-emerald-400/80">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Footer / Status Badge */}
      <div className="pt-3 mt-2 border-t border-emerald-950/60 flex items-center justify-between text-xs">
        {status ? (
          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${getBadgeClasses(status)}`}>
            {status}
          </span>
        ) : (
          <span className="text-[11px] text-emerald-400/50">Verified Telemetry</span>
        )}

        {description && (
          <span className="text-[11px] text-emerald-400/60 truncate max-w-[55%] text-right" title={description}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
