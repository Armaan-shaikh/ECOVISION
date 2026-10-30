import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Activity, Wind, Thermometer, CloudRain, ShieldAlert } from 'lucide-react';

export default function EnvironmentalChart({ seriesData = [], cityName = 'City' }) {
  const [activeTab, setActiveTab] = useState('aqi');

  const tabs = [
    { id: 'aqi', label: 'Air Quality (AQI)', icon: Activity },
    { id: 'particulates', label: 'PM2.5 & PM10', icon: Wind },
    { id: 'weather', label: 'Temp & Humidity', icon: Thermometer },
    { id: 'rain', label: 'Precipitation', icon: CloudRain },
    { id: 'gases', label: 'Gaseous Pollutants', icon: ShieldAlert },
  ];

  // Custom Dark Forest Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#091b13]/95 border border-emerald-500/20 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1">
          <p className="text-[11px] font-semibold text-emerald-400/80 mb-1 border-b border-emerald-950/80 pb-1">
            Time: {label}
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
  };

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-emerald-950/70 gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            24-Hour Environmental Dynamics: {cityName}
          </h3>
          <p className="text-xs text-emerald-400/60 mt-0.5">
            Hourly observational history & short-term trajectory from Open-Meteo & Copernicus CAMS
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#081810] border border-emerald-950/90 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        {seriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'aqi' && (
              <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradient-aqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="US EPA AQI" dataKey="aqi" stroke="#10b981" strokeWidth={2} fill="url(#gradient-aqi)" />
              </AreaChart>
            )}

            {activeTab === 'particulates' && (
              <LineChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                <Line type="monotone" name="PM2.5 (µg/m³)" dataKey="pm25" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" name="PM10 (µg/m³)" dataKey="pm10" stroke="#2dd4bf" strokeWidth={2} dot={false} />
              </LineChart>
            )}

            {activeTab === 'weather' && (
              <LineChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                <Line type="monotone" name="Temperature (°C)" dataKey="temperature" stroke="#fb923c" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Humidity (%)" dataKey="humidity" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
              </LineChart>
            )}

            {activeTab === 'rain' && (
              <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradient-rain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Precipitation (mm)" dataKey="precipitation" stroke="#38bdf8" strokeWidth={2} fill="url(#gradient-rain)" />
              </AreaChart>
            )}

            {activeTab === 'gases' && (
              <LineChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#059669" tick={{ fill: 'rgba(110, 231, 183, 0.6)', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a7f3d0' }} />
                <Line type="monotone" name="NO2 (µg/m³)" dataKey="no2" stroke="#a78bfa" strokeWidth={1.8} dot={false} />
                <Line type="monotone" name="SO2 (µg/m³)" dataKey="so2" stroke="#f472b6" strokeWidth={1.8} dot={false} />
                <Line type="monotone" name="Ozone (µg/m³)" dataKey="ozone" stroke="#34d399" strokeWidth={1.8} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-emerald-400/50">
            Awaiting environmental observational series...
          </div>
        )}
      </div>
    </div>
  );
}
