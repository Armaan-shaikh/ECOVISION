import React, { useState } from 'react';
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
  Layers,
  Compass,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Wind,
  Activity
} from 'lucide-react';
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

// Custom Academic Light-Themed Tooltip for Recharts
function PredictionAcademicTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-300 rounded shadow-md p-3 text-xs space-y-1.5 min-w-[190px] z-50">
        <p className="font-bold text-slate-800 border-b border-slate-200 pb-1 font-mono">
          {label}
        </p>
        <div className="space-y-1 pt-0.5">
          {payload.map((item, idx) => {
            if (item.value === null || item.value === undefined) return null;
            return (
              <div key={idx} className="flex items-center justify-between space-x-3 text-xs">
                <span className="flex items-center space-x-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}:</span>
                </span>
                <strong className="font-mono text-slate-900">
                  {typeof item.value === 'number' ? `${item.value.toFixed(1)}${item.unit || ''}` : item.value}
                </strong>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export default function PredictionSystemModule({
  selectedCity,
  predictionData,
  environmentalData,
  isLoading = false,
  onRetrain,
  onNavigateToModule
}) {
  const [activeChartTab, setActiveChartTab] = useState('trajectory');

  const modelInfo = predictionData?.model_info || {};
  const dataset = predictionData?.dataset_summary || {};
  const evalData = predictionData?.evaluation || {};
  const metrics = evalData?.metrics || {};
  const rfMetrics = metrics.random_forest || {};
  const baseMetrics = metrics.seasonal_baseline || {};
  const improvement = metrics.improvement || {};
  const forecasts = predictionData?.six_month_forecast || [];
  const timeline = predictionData?.projection_timeline || [];
  const testSeries = evalData.test_evaluation_series || [];
  const importances = evalData.feature_importances || {};
  const descriptions = modelInfo.feature_descriptions || {};

  const current = environmentalData?.current;
  const hourlySeries = environmentalData?.hourly_series || [];
  const forwardHourlySeries = hourlySeries.slice(12, 36); // Forward projection window

  const isModelSuccess = predictionData?.status === 'success';

  // Format coordinates
  const latFormatted = typeof selectedCity?.latitude === 'number'
    ? `${Math.abs(selectedCity.latitude).toFixed(4)}° ${selectedCity.latitude >= 0 ? 'N' : 'S'}`
    : '--';
  const lonFormatted = typeof selectedCity?.longitude === 'number'
    ? `${Math.abs(selectedCity.longitude).toFixed(4)}° ${selectedCity.longitude >= 0 ? 'E' : 'W'}`
    : '--';

  const chartTabs = [
    { id: 'trajectory', label: '6-Month Projection Corridor', icon: TrendingUp },
    { id: 'evaluation', label: '12-Month Holdout Validation', icon: BarChart3 },
    { id: 'aqi_forward', label: 'Forward Diurnal AQI & Aerosols', icon: Wind }
  ];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE OVERVIEW: PURPOSE & ROLE OF FORECASTING                 */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-07
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 07
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Environmental Prediction System & Predictive Machine Learning
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              Model: Scikit-learn Random Forest
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Purpose & Predictive Role:</strong> Module 07 operates as the 
            forward-looking predictive engine of the EcoVision architecture. While Modules 01–04 capture real-time surface conditions 
            and Module 06 models historical baselines, Module 07 projects prospective environmental trajectories using machine learning. 
            The system employs a dual-horizon approach: long-term macro-thermal forecasting via an autoregressive ensemble regressor, 
            coupled with short-term atmospheric chemical transport dispersion projections.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span>6-Month Macro-Thermal Horizon</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Multi-lag Scikit-learn Random Forest forecasting monthly average temperatures and thermal trajectory shifts.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <Wind className="w-3.5 h-3.5 text-emerald-800" />
                <span>Forward Air Quality Projections</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Hourly forward simulations of criteria pollutants (PM2.5, PM10) derived from Copernicus atmospheric transport.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Chronological Holdout Validation</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Empirical evaluation using a 12-month test holdout benchmarked against seasonal calendar averages.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Domain Context Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Target Predictive Domain: {selectedCity?.name}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {[selectedCity?.state, selectedCity?.country].filter(Boolean).join(', ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Coordinates: {latFormatted}, {lonFormatted} • Timezone: {selectedCity?.timezone || 'UTC'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => onRetrain && onRetrain(true)}
            disabled={isLoading || !selectedCity}
            className="px-3.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refetch 5-year reanalysis records from SQLite or Open-Meteo and re-fit Random Forest"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-800 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Model Fit</span>
          </button>
        </div>
      </div>

      {/* Loading State Banner */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 text-center shadow-xs">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
          <p className="text-sm text-slate-800 font-medium">Fitting Random Forest regressor for {selectedCity?.name}...</p>
          <p className="text-xs text-slate-500 font-mono">Constructing autoregressive lag features and executing chronological train/test split</p>
        </div>
      )}

      {/* Insufficient Data or Model Failure Notice */}
      {!isLoading && !isModelSuccess && (
        <div className="bg-white rounded-lg border border-amber-300 p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-semibold text-sm">
            <Info className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <span>Machine Learning Model Initialization Status</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {predictionData?.message || `Machine learning projections are currently unavailable for ${selectedCity?.name}. Click 'Attempt Model Fit' to fetch historical reanalysis data and train the Scikit-learn model.`}
          </p>
          {onRetrain && (
            <button
              type="button"
              onClick={() => onRetrain(true)}
              className="px-3.5 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Attempt Model Fit & Feature Ingestion</span>
            </button>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. PREDICTION METHODOLOGY & ARCHITECTURAL SPECIFICATION           */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Machine Learning Architecture & Feature Engineering
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Ensemble Regression Framework
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Model Specification */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Mathematical Model Specification
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Algorithm:</span>
                <strong className="font-mono text-slate-900">{modelInfo.name || 'Random Forest Regressor'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Implementation:</span>
                <strong className="font-mono text-slate-900">{modelInfo.framework || 'Scikit-learn'} (n_estimators={modelInfo.n_estimators || 100}, max_depth={modelInfo.max_depth || 6})</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Target Variable:</span>
                <strong className="font-mono text-slate-900">{modelInfo.target || 'Monthly Average Temperature (°C)'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Validation Strategy:</span>
                <strong className="text-slate-800">12-Month Chronological Holdout (Zero Shuffling)</strong>
              </div>
              <div className="flex justify-between">
                <span>Benchmark Comparator:</span>
                <strong className="text-slate-800">Historical Calendar-Month Mean Baseline</strong>
              </div>
            </div>
          </div>

          {/* Right: Autoregressive Input Features */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Multi-Step Lag Features
            </h4>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <p>
                <code className="font-bold text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">month, year</code>: 
                Calendar position capturing solar declination and secular inter-annual warming trends.
              </p>
              <p>
                <code className="font-bold text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">prev_month_temp</code>: 
                Lag-1 temperature ($t-1$) representing immediate boundary atmospheric inertia.
              </p>
              <p>
                <code className="font-bold text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">prev_2m_avg, prev_3m_avg</code>: 
                Rolling window averages ($t-1$ through $t-3$) modeling seasonal transitional momentum.
              </p>
              <p>
                <code className="font-bold text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">prev_month_rain</code>: 
                Lag-1 precipitation volume reflecting soil moisture reservoir and evaporative cooling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. FORECAST RESULTS: 6-MONTH TEMPERATURE TRAJECTORY               */}
      {/* ================================================================= */}
      {isModelSuccess && forecasts.length > 0 && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Autoregressive Six-Month Temperature Projections
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Horizon: Next 6 Months
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {forecasts.map((fc) => {
              const isWarming = fc.trend === 'Warming';
              const isCooling = fc.trend === 'Cooling';

              return (
                <div
                  key={fc.step}
                  className="p-3.5 rounded bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {fc.month_name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        &apos;{String(fc.year).slice(-2)}
                      </span>
                    </div>

                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {fc.predicted_temperature}°C
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200 text-xs">
                    {/* Trend Badge */}
                    <div className="flex items-center space-x-1">
                      {isWarming && <TrendingUp className="w-3 h-3 text-amber-600 flex-shrink-0" />}
                      {isCooling && <TrendingDown className="w-3 h-3 text-sky-600 flex-shrink-0" />}
                      {!isWarming && !isCooling && <Minus className="w-3 h-3 text-emerald-700 flex-shrink-0" />}
                      <span
                        className={`text-[10px] font-semibold ${
                          isWarming ? 'text-amber-800' : isCooling ? 'text-sky-800' : 'text-emerald-800'
                        }`}
                      >
                        {fc.trend}
                      </span>
                    </div>

                    {/* Baseline Comparison */}
                    <div className="text-[10px] text-slate-500 truncate">
                      <span>Baseline: </span>
                      <span className="font-mono text-slate-700">{fc.historical_baseline_temp}°C</span>
                      <span className="text-slate-500"> ({fc.delta_from_baseline > 0 ? `+${fc.delta_from_baseline}` : fc.delta_from_baseline}°C)</span>
                    </div>

                    {/* Empirical Confidence Band */}
                    <div className="text-[9px] text-slate-400 font-mono truncate" title={`Confidence Interval: ${fc.confidence_interval?.lower}°C to ${fc.confidence_interval?.upper}°C`}>
                      CI: {fc.confidence_interval?.lower}° – {fc.confidence_interval?.upper}°C
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 4. AQI FORECAST: DIURNAL DISPERSION & CRITERIA POLLUTANTS         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <Wind className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Forward Air Quality & Criteria Pollutant Projections
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copernicus CAMS atmospheric transport model forward simulation
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            Scale: {current?.aqi_scale || 'US EPA (0–500)'}
          </span>
        </div>

        <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start space-x-2">
          <Info className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold">Dual-Horizon Complementarity: </strong>
            While the Scikit-learn Random Forest model forecasts macro-thermal trends across a 6-month horizon, air quality 
            is dynamically driven by rapid photochemical reactions and boundary layer transport. Below are the forward 
            atmospheric chemical transport forecasts for {selectedCity?.name} across the next 24-hour cycle.
          </div>
        </div>

        {forwardHourlySeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
            {forwardHourlySeries.slice(0, 6).map((item, idx) => (
              <div key={idx} className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{item.time}</span>
                  <span className="text-[10px] text-slate-500">{item.full_date?.split(',')[0]}</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {item.aqi !== null && item.aqi !== undefined ? item.aqi : '--'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">AQI</span>
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>PM2.5:</span>
                    <strong className="font-mono text-slate-800">{item.pm25 !== null ? `${item.pm25} µg/m³` : '--'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10:</span>
                    <strong className="font-mono text-slate-800">{item.pm10 !== null ? `${item.pm10} µg/m³` : '--'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            Forward air quality simulations are pending ingestion in Module 03.
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. ENVIRONMENTAL FORECAST CHARTS                                  */}
      {/* ================================================================= */}
      {isModelSuccess && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div className="flex items-center space-x-2.5">
              <Activity className="w-5 h-5 text-emerald-800" />
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Predictive Visualization Curves
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive charts of forecast trajectory and validation splits
                </p>
              </div>
            </div>

            {/* Chart View Selector Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs self-start sm:self-auto">
              {chartTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeChartTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveChartTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'trajectory' && (
                <AreaChart data={timeline} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="academicConfidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="display_label" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} unit="°C" />
                  <Tooltip content={<PredictionAcademicTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#1e293b' }} />
                  <Line
                    type="monotone"
                    dataKey="historical_temperature"
                    name="Actual Reanalysis (°C)"
                    stroke="#1e293b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#1e293b' }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_temperature"
                    name="Random Forest 6-Mo Forecast (°C)"
                    stroke="#047857"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#047857' }}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence_upper"
                    name="Uncertainty Bound (CI)"
                    stroke="transparent"
                    fill="url(#academicConfidenceBand)"
                    connectNulls
                  />
                </AreaChart>
              )}

              {activeChartTab === 'evaluation' && (
                <LineChart data={testSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month_label" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} unit="°C" />
                  <Tooltip content={<PredictionAcademicTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#1e293b' }} />
                  <Line
                    type="monotone"
                    dataKey="actual_temperature"
                    name="Actual Observed Reanalysis (°C)"
                    stroke="#1e293b"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#1e293b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_temperature"
                    name="Random Forest Prediction (°C)"
                    stroke="#047857"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ r: 3.5, fill: '#047857' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline_temperature"
                    name="Seasonal Calendar Mean Baseline (°C)"
                    stroke="#d97706"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2.5, fill: '#d97706' }}
                  />
                </LineChart>
              )}

              {activeChartTab === 'aqi_forward' && (
                <LineChart data={forwardHourlySeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<PredictionAcademicTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#1e293b' }} />
                  <Line type="monotone" name="Forward AQI" dataKey="aqi" stroke="#047857" strokeWidth={2.5} dot={{ r: 3, fill: '#047857' }} />
                  <Line type="monotone" name="PM2.5 (µg/m³)" dataKey="pm25" stroke="#0d9488" strokeWidth={1.8} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" name="PM10 (µg/m³)" dataKey="pm10" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 6. MODEL PERFORMANCE & STATISTICAL EVALUATION METRICS             */}
      {/* ================================================================= */}
      {isModelSuccess && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Model Performance & Statistical Evaluation Metrics
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              12-Month Holdout Verification
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Model MAE */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Random Forest MAE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  Holdout
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {rfMetrics.mae !== undefined ? `${rfMetrics.mae}°C` : '--'}
              </div>
              <div className="text-[11px] text-emerald-800 flex items-center space-x-1 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
                <span>{improvement.mae_reduction_pct}% error reduction vs baseline</span>
              </div>
            </div>

            {/* Model RMSE */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Random Forest RMSE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  Scikit-learn
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {rfMetrics.rmse !== undefined ? `${rfMetrics.rmse}°C` : '--'}
              </div>
              <div className="text-[11px] text-slate-500">
                R² Score: <strong className="font-mono text-slate-800">{rfMetrics.r2_score ?? '--'}</strong>
              </div>
            </div>

            {/* Baseline MAE */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Seasonal Baseline MAE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Benchmark
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900">
                {baseMetrics.mae !== undefined ? `${baseMetrics.mae}°C` : '--'}
              </div>
              <div className="text-[11px] text-slate-500">
                R² Score: <span className="font-mono text-slate-700">{baseMetrics.r2_score ?? '--'}</span>
              </div>
            </div>

            {/* Holdout Split Size */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Evaluation Holdout Size</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  Split
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {evalData.test_samples || 0} <span className="text-xs font-normal text-slate-500">Months</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">
                Period: {evalData.test_period}
              </div>
            </div>
          </div>

          {/* Feature Importances Breakdown */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Gini Impurity Feature Importances
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(importances).map(([featKey, featWeight]) => {
                const pct = Math.round(featWeight * 100);
                return (
                  <div
                    key={featKey}
                    className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800">{featKey}</span>
                      <span className="font-mono text-emerald-800 font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {descriptions[featKey] || featKey}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 7. PREDICTION RELIABILITY & UNCERTAINTY PROPAGATION               */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Prediction Reliability, Uncertainty Bounds & Limitations
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Uncertainty Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Empirical Confidence Intervals
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              To account for cumulative error propagation in autoregressive multi-step forecasting, confidence bounds expand 
              linearly across steps according to the formula:
            </p>
            <div className="p-2 rounded bg-white border border-slate-200 font-mono text-center text-slate-800 text-[11px]">
              CI(t) = ŷ ± MAE × [1 + (step - 1) × 0.08]
            </div>
            <p className="text-slate-500 text-[10px]">
              Where MAE is the empirically validated error on the 12-month holdout set ({rfMetrics.mae || '1.1'}°C).
            </p>
          </div>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Scientific Limitations Notice
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {predictionData?.disclaimer || 'Machine learning temperature projections are statistical estimates derived from historical atmospheric reanalysis (ERA5 / ERA5-Land) and seasonal lag dynamics. Designed for educational modeling and urban planning analysis; not a guaranteed meteorological forecast.'}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. PREDICTION HISTORY, PERSISTENCE & CACHE STATUS                 */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Dataset Scope & Model Persistence Record
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            SQLite Climate Archive
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Climate Records</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {dataset.total_monthly_records || 0} Months
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {dataset.start_period} to {dataset.end_period}
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Training Samples</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {evalData.train_samples || 0} Months
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Period: {evalData.train_period}
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Database Storage</span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              SQLite
            </div>
            <div className="text-[10px] text-slate-500">
              city_monthly_history table
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Last Model Training</span>
            <div className="text-xs font-bold text-slate-900 font-mono truncate" title={predictionData?.last_trained_at}>
              {predictionData?.last_trained_at ? predictionData.last_trained_at.replace('T', ' ').replace('Z', ' UTC') : 'Cached'}
            </div>
            <div className="text-[10px] text-slate-500">
              TTL: 3h (30s cooldown)
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. NAVIGATION ACTIONS                                             */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigateToModule && onNavigateToModule('module-06')}
          className="px-4 py-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Return to Module 06: Historical Analysis</span>
        </button>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateToModule && onNavigateToModule('module-01')}
            className="px-3.5 py-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigateToModule && onNavigateToModule('module-08')}
            className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <span>Proceed to Module 08: Saved Records</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>
    </div>
  );
}
