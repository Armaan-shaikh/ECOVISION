import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Info,
  Calendar,
  Database,
  CheckCircle2,
  BarChart3,
  Thermometer,
  Layers
} from 'lucide-react';

// Standalone Tooltip to avoid Recharts re-mounting glitches
function PredictionTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#091b13]/95 border border-emerald-500/20 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
        <p className="text-[11px] font-semibold text-emerald-300 border-b border-emerald-950/80 pb-1">
          {label}
        </p>
        {payload.map((item, idx) => {
          if (item.value === null || item.value === undefined) return null;
          return (
            <div key={idx} className="flex items-center justify-between space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-300/80">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-bold text-white font-mono">
                {typeof item.value === 'number' ? `${item.value.toFixed(1)}°C` : item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function PredictionCenter({
  predictionData,
  cityName = 'Selected City',
  isLoading = false,
  onRetrain
}) {
  const [activeViewTab, setActiveViewTab] = useState('trajectory');

  if (isLoading) {
    return (
      <div className="eco-card rounded-2xl p-8 border border-emerald-500/15 flex flex-col items-center justify-center space-y-3 text-center">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        <p className="text-sm text-emerald-200 font-medium">Training Random Forest model for {cityName}...</p>
        <p className="text-xs text-emerald-400/60 max-w-md">
          Retrieving 5-year meteorological reanalysis dataset, constructing lag features, and training Scikit-learn regressor.
        </p>
      </div>
    );
  }

  if (!predictionData || predictionData.status !== 'success') {
    return (
      <div className="eco-card rounded-2xl p-6 border border-emerald-500/15 space-y-3">
        <div className="flex items-center space-x-2 text-amber-300">
          <Info className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-semibold text-sm">Environmental Prediction Notice</h3>
        </div>
        <p className="text-xs text-emerald-400/70 leading-relaxed">
          {predictionData?.message || `Machine learning projections are currently initializing for ${cityName}.`}
        </p>
        {onRetrain && (
          <button
            onClick={() => onRetrain(true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-900/60 hover:text-white transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Attempt Model Fit</span>
          </button>
        )}
      </div>
    );
  }

  const modelInfo = predictionData.model_info || {};
  const dataset = predictionData.dataset_summary || {};
  const evalData = predictionData.evaluation || {};
  const metrics = evalData.metrics || {};
  const rfMetrics = metrics.random_forest || {};
  const baseMetrics = metrics.seasonal_baseline || {};
  const improvement = metrics.improvement || {};
  const forecasts = predictionData.six_month_forecast || [];
  const timeline = predictionData.projection_timeline || [];
  const testSeries = evalData.test_evaluation_series || [];
  const importances = evalData.feature_importances || {};
  const descriptions = modelInfo.feature_descriptions || {};

  return (
    <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-6">
      {/* 1. Header with Model Metadata & Retrain Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-950/70 gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-300">
              Step 4 Machine Learning
            </span>
            <span className="text-xs font-mono text-emerald-400/60">
              Scikit-learn 1.7
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Environmental Prediction Centre: 6-Month Temperature Forecast
          </h3>
          <p className="text-xs text-emerald-400/70">
            Random Forest Regressor trained on 5-year chronological ERA5 reanalysis lags for <strong className="text-emerald-200 font-medium">{cityName}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-emerald-300 font-mono flex items-center justify-end space-x-1">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>SQLite Cached</span>
            </div>
            <div className="text-[10px] text-emerald-400/50">
              {dataset.total_monthly_records} monthly observations
            </div>
          </div>

          {onRetrain && (
            <button
              onClick={() => onRetrain(true)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-900/60 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              title="Force re-fetch of reanalysis records and re-fit Random Forest model"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recalculate Model</span>
              <span className="sm:hidden">Retrain</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Evaluation Metrics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Model MAE */}
        <div className="p-4 rounded-xl bg-[#081811]/70 border border-emerald-500/15 space-y-1">
          <div className="text-xs font-medium text-emerald-400/70 flex items-center justify-between">
            <span>Model MAE (Holdout)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
              Test Split
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {rfMetrics.mae !== undefined ? `${rfMetrics.mae}°C` : '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span>{improvement.mae_reduction_pct}% lower error vs baseline</span>
          </div>
        </div>

        {/* Model RMSE */}
        <div className="p-4 rounded-xl bg-[#081811]/70 border border-emerald-500/15 space-y-1">
          <div className="text-xs font-medium text-emerald-400/70 flex items-center justify-between">
            <span>Model RMSE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
              Scikit-learn
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {rfMetrics.rmse !== undefined ? `${rfMetrics.rmse}°C` : '--'}
          </div>
          <div className="text-[11px] text-emerald-400/60 truncate">
            R² Score: <span className="font-mono text-emerald-200">{rfMetrics.r2_score ?? '--'}</span>
          </div>
        </div>

        {/* Seasonal Baseline Benchmark */}
        <div className="p-4 rounded-xl bg-[#081811]/70 border border-emerald-500/15 space-y-1">
          <div className="text-xs font-medium text-emerald-400/70 flex items-center justify-between">
            <span>Seasonal Baseline MAE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-amber-500/30 text-amber-300">
              Benchmark
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-100">
            {baseMetrics.mae !== undefined ? `${baseMetrics.mae}°C` : '--'}
          </div>
          <div className="text-[11px] text-emerald-400/60 truncate">
            Historical calendar month mean
          </div>
        </div>

        {/* Training Dataset Scope */}
        <div className="p-4 rounded-xl bg-[#081811]/70 border border-emerald-500/15 space-y-1">
          <div className="text-xs font-medium text-emerald-400/70 flex items-center justify-between">
            <span>Dataset Time Span</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
              ERA5
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {dataset.total_monthly_records || 0} <span className="text-sm font-normal text-emerald-400/60">Months</span>
          </div>
          <div className="text-[11px] text-emerald-400/60 truncate font-mono">
            {dataset.start_period} to {dataset.end_period}
          </div>
        </div>
      </div>

      {/* 3. Six-Month Forecast Cards Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Autoregressive Six-Month Temperature Projections
            </h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/60">
            Horizon: Next 6 Months
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {forecasts.map((fc) => {
            const isWarming = fc.trend === 'Warming';
            const isCooling = fc.trend === 'Cooling';

            return (
              <div
                key={fc.step}
                className="p-3.5 rounded-xl bg-[#081811]/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-200">
                      {fc.month_name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/60">
                      '{String(fc.year).slice(-2)}
                    </span>
                  </div>

                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {fc.predicted_temperature}°C
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-emerald-950/80">
                  {/* Trend Badge */}
                  <div className="flex items-center space-x-1">
                    {isWarming && <TrendingUp className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    {isCooling && <TrendingDown className="w-3 h-3 text-sky-400 flex-shrink-0" />}
                    {!isWarming && !isCooling && <Minus className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                    <span
                      className={`text-[10px] font-medium ${
                        isWarming ? 'text-amber-300' : isCooling ? 'text-sky-300' : 'text-emerald-300'
                      }`}
                    >
                      {fc.trend}
                    </span>
                  </div>

                  {/* Baseline Delta */}
                  <div className="text-[10px] text-emerald-400/70 truncate">
                    <span>Baseline: </span>
                    <span className="font-mono text-emerald-300">{fc.historical_baseline_temp}°C</span>
                    <span className="text-emerald-400/50"> ({fc.delta_from_baseline > 0 ? `+${fc.delta_from_baseline}` : fc.delta_from_baseline}°C)</span>
                  </div>

                  {/* Confidence Interval */}
                  <div className="text-[9px] text-emerald-400/50 font-mono truncate" title={`Confidence Interval: ${fc.confidence_interval.lower}°C to ${fc.confidence_interval.upper}°C`}>
                    CI: {fc.confidence_interval.lower}° – {fc.confidence_interval.upper}°C
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Recharts Visualizer */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Tab buttons */}
          <div className="flex items-center space-x-1 p-1 bg-[#05110c] rounded-xl border border-emerald-950/80 self-start">
            <button
              onClick={() => setActiveViewTab('trajectory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeViewTab === 'trajectory'
                  ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/30'
                  : 'text-emerald-400/60 hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Forecast Trajectory & Confidence Corridor</span>
            </button>

            <button
              onClick={() => setActiveViewTab('evaluation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeViewTab === 'evaluation'
                  ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/30'
                  : 'text-emerald-400/60 hover:text-emerald-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Model vs Baseline (12-Mo Test Holdout)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-emerald-400/50">
            {activeViewTab === 'trajectory' ? 'Historical + 6-Month Projection' : 'Strict Chronological Holdout Split'}
          </span>
        </div>

        {/* Chart Container */}
        <div className="h-[280px] sm:h-[320px] w-full p-4 rounded-xl bg-[#06140e]/90 border border-emerald-950/80">
          <ResponsiveContainer width="100%" height="100%">
            {activeViewTab === 'trajectory' ? (
              <AreaChart data={timeline} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#0a2318" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="display_label"
                  stroke="#059669"
                  tick={{ fill: '#34d399', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#059669"
                  tick={{ fill: '#34d399', fontSize: 11 }}
                  tickLine={false}
                  unit="°C"
                />
                <Tooltip content={<PredictionTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => <span className="text-emerald-200 font-medium">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="historical_temperature"
                  name="Recorded Reanalysis Temp (°C)"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ffffff' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="predicted_temperature"
                  name="Random Forest 6-Mo Projection (°C)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#10b981' }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  name="Upper Confidence Bound (CI)"
                  stroke="transparent"
                  fill="url(#forecastBand)"
                  connectNulls
                />
              </AreaChart>
            ) : (
              <LineChart data={testSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#0a2318" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month_label"
                  stroke="#059669"
                  tick={{ fill: '#34d399', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#059669"
                  tick={{ fill: '#34d399', fontSize: 11 }}
                  tickLine={false}
                  unit="°C"
                />
                <Tooltip content={<PredictionTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => <span className="text-emerald-200 font-medium">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="actual_temperature"
                  name="Actual Observed Reanalysis (°C)"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_temperature"
                  name="Random Forest Regressor (°C)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3.5, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline_temperature"
                  name="Seasonal Calendar-Month Baseline (°C)"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={{ r: 2.5, fill: '#fbbf24' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Feature Importances & Model Transparency */}
      <div className="pt-2 border-t border-emerald-950/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Scikit-learn Random Forest Feature Importances
            </h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/60">
            Gini Impurity Reduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(importances).map(([featKey, featWeight]) => {
            const pct = Math.round(featWeight * 100);
            return (
              <div
                key={featKey}
                className="p-3 rounded-xl bg-[#081811]/60 border border-emerald-950/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-200">{featKey}</span>
                  <span className="font-mono text-emerald-300 font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-[#05110c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-400/60 leading-tight">
                  {descriptions[featKey] || featKey}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Academic Forecast Disclaimer Notice */}
      <div className="p-3.5 rounded-xl bg-[#06140e] border border-emerald-950/80 flex items-start space-x-2.5 text-xs text-emerald-400/60">
        <Info className="w-4 h-4 text-emerald-400/80 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-emerald-300 font-medium">Model Forecast Limitation: </strong>
          {predictionData.disclaimer || 'Projections represent statistical approximations derived from historical atmospheric lag features for college research. Not an official municipal storm or weather advisory.'}
        </p>
      </div>
    </div>
  );
}

