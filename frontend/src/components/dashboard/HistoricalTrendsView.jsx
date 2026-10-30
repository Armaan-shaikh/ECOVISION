import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Calendar, TrendingUp, CloudRain, Wind, Thermometer, Database } from 'lucide-react';

// Standalone Custom Dark Forest Tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#091b13]/95 border border-emerald-500/20 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
        <p className="text-[11px] font-semibold text-emerald-300 mb-1 border-b border-emerald-950/80 pb-1">
          Date: {label}
        </p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-emerald-300/80">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-bold text-white font-mono">
              {item.value !== null && item.value !== undefined ? (typeof item.value === 'number' ? item.value.toFixed(1) : item.value) : '--'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function HistoricalTrendsView({ analysisData, currentDays, onSelectDays, isLoading }) {
  const [activeChartTab, setActiveChartTab] = useState('temp');

  if (!analysisData) return null;

  const trends = analysisData.historical_trends || {};
  const pAvg = trends.period_averages || {};
  const coverage = analysisData.coverage || {};
  const dailyRecords = trends.daily_records || [];
  const weeklyAverages = trends.weekly_averages || [];

  const chartTabs = [
    { id: 'temp', label: 'Temperature (Min / Mean / Max)', icon: Thermometer },
    { id: 'rain', label: 'Rainfall Accumulation (mm)', icon: CloudRain },
    { id: 'aqi', label: 'Air Quality (AQI & PM2.5)', icon: Wind },
  ];

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-950/70 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Historical Environmental Trend Analysis
            </h3>
          </div>
          <p className="text-xs text-emerald-400/60 mt-0.5">
            Aggregated daily meteorological and atmospheric observations
          </p>
        </div>

        {/* Time Period Selector Toggle */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#081810] border border-emerald-950/90 self-start sm:self-auto">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => onSelectDays(days)}
              disabled={isLoading}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                currentDays === days
                  ? 'bg-emerald-800/40 text-emerald-200 border border-emerald-500/30'
                  : 'text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-950/40'
              }`}
            >
              Past {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Coverage & Data Period Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#081811]/70 border border-emerald-950/80 text-xs">
        <div className="flex items-center space-x-2 text-emerald-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>
            Period Analyzed:{' '}
            <strong className="text-white font-mono">
              {coverage.start_date || 'N/A'} to {coverage.end_date || 'N/A'}
            </strong>
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-emerald-400/70">
          <span>
            Data Coverage:{' '}
            <strong className="text-emerald-300 font-mono">
              {coverage.coverage_percentage}% ({coverage.actual_days_retrieved}/{coverage.requested_period_days} Days)
            </strong>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Open-Meteo & SQLite</span>
          </span>
        </div>
      </div>

      {/* 4 Summary Metrics Cards for Analyzed Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Mean Temperature */}
        <div className="p-3.5 rounded-xl bg-[#081811]/60 border border-emerald-950/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 mb-1">
            Period Mean Temp
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pAvg.mean_temperature !== null && pAvg.mean_temperature !== undefined ? `${pAvg.mean_temperature}°C` : '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1 truncate" title={trends.temperature_trend?.description}>
            {trends.temperature_trend?.description || 'Stable temperature'}
          </div>
        </div>

        {/* Total Rainfall */}
        <div className="p-3.5 rounded-xl bg-[#081811]/60 border border-emerald-950/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 mb-1">
            Period Rainfall
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pAvg.total_rainfall !== null && pAvg.total_rainfall !== undefined ? `${pAvg.total_rainfall} mm` : '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            {pAvg.rainy_days ?? 0} rain day(s) • {pAvg.dry_days ?? 0} dry day(s)
          </div>
        </div>

        {/* Mean AQI */}
        <div className="p-3.5 rounded-xl bg-[#081811]/60 border border-emerald-950/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 mb-1">
            Period Mean AQI
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pAvg.mean_aqi !== null && pAvg.mean_aqi !== undefined ? Math.round(pAvg.mean_aqi) : '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1 truncate" title={trends.aqi_trend?.description}>
            {trends.aqi_trend?.description || 'Baseline air quality'}
          </div>
        </div>

        {/* Mean Humidity */}
        <div className="p-3.5 rounded-xl bg-[#081811]/60 border border-emerald-950/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 mb-1">
            Period Mean Humidity
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pAvg.mean_humidity !== null && pAvg.mean_humidity !== undefined ? `${pAvg.mean_humidity}%` : '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            Average atmospheric moisture
          </div>
        </div>
      </div>

      {/* Chart Selector Tabs & Canvas */}
      <div className="pt-2">
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#081810] border border-emerald-950/90 w-fit mb-3">
          {chartTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeChartTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChartTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-800/40 text-emerald-200 border border-emerald-500/30'
                    : 'text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-950/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-72 w-full">
          {dailyRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'temp' && (
                <AreaChart data={dailyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradient-temp-mean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                  <Area type="monotone" name="Mean Temp (°C)" dataKey="temp_mean" stroke="#fb923c" strokeWidth={2} fill="url(#gradient-temp-mean)" />
                  <Line type="monotone" name="Max Temp (°C)" dataKey="temp_max" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" name="Min Temp (°C)" dataKey="temp_min" stroke="#60a5fa" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </AreaChart>
              )}

              {activeChartTab === 'rain' && (
                <BarChart data={dailyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                  <Bar name="Precipitation (mm)" dataKey="rainfall" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}

              {activeChartTab === 'aqi' && (
                <LineChart data={dailyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                  <Line type="monotone" name="Daily US EPA AQI" dataKey="aqi" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  <Line type="monotone" name="PM2.5 (µg/m³)" dataKey="pm25" stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-emerald-400/50">
              No historical records available for this interval.
            </div>
          )}
        </div>
      </div>

      {/* Weekly Averages Table if multi-week period */}
      {weeklyAverages.length > 1 && (
        <div className="pt-2 border-t border-emerald-950/70 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">
            Multi-Week Aggregations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {weeklyAverages.map((wk, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#081811]/70 border border-emerald-950/80 text-xs space-y-1">
                <div className="font-semibold text-emerald-200 truncate">{wk.week_label}</div>
                <div className="flex justify-between text-emerald-400/70 text-[11px]">
                  <span>Mean Temp:</span>
                  <span className="font-mono text-white">{wk.mean_temperature !== null ? `${wk.mean_temperature}°C` : '--'}</span>
                </div>
                <div className="flex justify-between text-emerald-400/70 text-[11px]">
                  <span>Rainfall:</span>
                  <span className="font-mono text-white">{wk.total_rainfall} mm</span>
                </div>
                <div className="flex justify-between text-emerald-400/70 text-[11px]">
                  <span>Mean AQI:</span>
                  <span className="font-mono text-white">{wk.mean_aqi !== null ? Math.round(wk.mean_aqi) : '--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
