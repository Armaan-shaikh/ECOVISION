import React from 'react';
import {
  Activity,
  Gauge,
  Thermometer,
  Droplets,
  CloudRain,
  ShieldCheck,
  Compass,
  Radio,
  Layers,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  Lightbulb,
  CheckSquare,
  Calendar
} from 'lucide-react';

export default function EnvironmentalAnalysisModule({
  selectedCity,
  analysisData,
  environmentalData,
  isLoading = false,
  analysisPeriodDays = 7,
  onSelectPeriod,
  onRefresh,
  onNavigateToModule
}) {
  const scoring = analysisData?.scoring || {};
  const overall = scoring.overall || {};
  const indicators = scoring.indicators || {};
  const historicalTrends = analysisData?.historical_trends || {};
  const periodAverages = historicalTrends.period_averages || {};
  const tempTrend = historicalTrends.temperature_trend || {};
  const rainTrend = historicalTrends.rainfall_trend || {};
  const aqiTrend = historicalTrends.aqi_trend || {};
  const insights = analysisData?.insights || [];
  const recommendations = analysisData?.recommendations || [];
  const coverage = analysisData?.coverage || {};

  const current = environmentalData?.current;
  const groundMonitoring = current?.ground_monitoring;
  const isGroundAvailable = groundMonitoring?.status === 'success';
  const groundStation = isGroundAvailable ? groundMonitoring.station : null;
  const groundPollutants = isGroundAvailable ? (groundMonitoring.pollutant_sub_indices || {}) : {};

  const isOverallValid = overall.status === 'Valid' && overall.overall_score !== null;

  // Format coordinates
  const latFormatted = typeof selectedCity?.latitude === 'number'
    ? `${Math.abs(selectedCity.latitude).toFixed(4)}° ${selectedCity.latitude >= 0 ? 'N' : 'S'}`
    : '--';
  const lonFormatted = typeof selectedCity?.longitude === 'number'
    ? `${Math.abs(selectedCity.longitude).toFixed(4)}° ${selectedCity.longitude >= 0 ? 'E' : 'W'}`
    : '--';

  // Helper for EIS tier styling
  const getScoreTierBadge = (tier, isValid) => {
    if (!isValid) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: tier || 'Data Incomplete'
      };
    }
    const t = (tier || '').toLowerCase();
    if (t.includes('optimal') || t.includes('favorable')) {
      return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: tier };
    }
    if (t.includes('moderate') || t.includes('stable')) {
      return { bg: 'bg-teal-50 text-teal-800 border-teal-200', label: tier };
    }
    if (t.includes('stressed') || t.includes('sub-optimal')) {
      return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: tier };
    }
    return { bg: 'bg-rose-50 text-rose-800 border-rose-200', label: tier || 'Adverse' };
  };

  // Helper for CPCB Category Badge
  const getSubIndexBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'satisfactory':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'poor':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'very poor':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'severe':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // 4 Core Environmental Indicators Configuration
  const indicatorConfigs = [
    {
      key: 'aqi',
      label: 'Air Quality (AQI)',
      weight: '35%',
      icon: Activity,
      color: '#10b981',
      bgBar: 'bg-emerald-600',
      standard: scoring.aqi_standard || 'US EPA / CPCB',
      methodology: 'Piecewise linear normalization mapping index breakpoints to a 0–100 scale.'
    },
    {
      key: 'temperature',
      label: 'Thermal Comfort',
      weight: '25%',
      icon: Thermometer,
      color: '#f59e0b',
      bgBar: 'bg-amber-500',
      standard: '18°C – 24°C Ideal Comfort',
      methodology: 'Non-linear Gaussian comfort curve centered at 21°C; penalizes thermal extremes.'
    },
    {
      key: 'humidity',
      label: 'Moisture Balance',
      weight: '20%',
      icon: Droplets,
      color: '#0284c7',
      bgBar: 'bg-sky-500',
      standard: '40% – 60% Relative Humidity',
      methodology: 'Parabolic respiratory moisture function; penalizes severe aridity and muggy saturation.'
    },
    {
      key: 'rainfall',
      label: 'Rainfall Sufficiency',
      weight: '20%',
      icon: CloudRain,
      color: '#0d9488',
      bgBar: 'bg-teal-600',
      standard: '0.5 – 8.0 mm Cleansing Range',
      methodology: 'Dual-benefit model rewarding atmospheric aerosol cleansing while penalizing flood runoff.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE OVERVIEW: PURPOSE & SCOPE                               */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Gauge className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-05
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 05
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Multi-Criteria Environmental Analysis & Indicator Synthesis
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              Scope: Multi-Criteria Assessment
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Purpose & Analytical Scope:</strong> Module 05 conducts comprehensive 
            environmental health scoring and indicator synthesis across meteorological and atmospheric quality dimensions. 
            Disparate physical observables—such as ambient temperature (°C), relative humidity (%), precipitation (mm), 
            and air quality index values—are transformed into non-dimensional, commensurate indicator scores on a standardized 
            0–100 scale using mathematical normalization curves and statutory environmental benchmarks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">MCDA Indicator Normalization</span>
              <span className="text-[11px] text-slate-500">
                Transforms air quality (35%), thermal comfort (25%), moisture balance (20%), and rainfall (20%) into a unified index.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Statutory Health Standards</span>
              <span className="text-[11px] text-slate-500">
                Pollutants are evaluated against India CPCB National AQI breakpoints and US EPA / WHO health guidelines.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Discrepancy Diagnostics</span>
              <span className="text-[11px] text-slate-500">
                Cross-validates in situ CAAQMS ground station sensors with Copernicus CAMS numerical atmospheric models.
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
                Target Domain: {selectedCity?.name}
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
            onClick={onRefresh}
            disabled={isLoading || !selectedCity}
            className="px-3.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-800 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Analysis</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && !analysisData && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 text-center shadow-xs">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
          <p className="text-sm text-slate-800 font-medium">Computing multi-criteria environmental indicators for {selectedCity?.name}...</p>
          <p className="text-xs text-slate-500 font-mono">Evaluating piecewise normalization curves and historical variance</p>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. ENVIRONMENTAL HEALTH SCORE (EHS / EIS)                         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <Gauge className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Environmental Indicator Score (EIS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Composite multi-criteria synthesis across atmospheric and meteorological parameters
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            Scale: 0–100 Favorable
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Overall Composite Score Display (5 cols) */}
          <div className="lg:col-span-5 rounded-lg p-5 bg-slate-50 border border-slate-200 flex flex-col justify-between text-center relative">
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
                Overall Composite Rating
              </span>

              {isOverallValid ? (
                <div className="py-2">
                  <div className="text-5xl font-extrabold tracking-tight text-slate-900 font-mono">
                    {overall.overall_score}
                    <span className="text-xl font-sans text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getScoreTierBadge(overall.tier, true).bg}`}>
                      {overall.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 max-w-sm mx-auto leading-relaxed">
                    {overall.description}
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="text-sm font-semibold text-amber-900">
                    {overall.tier || 'Data Incomplete'}
                  </div>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    {overall.description || 'Minimum 3 valid indicators required to compute overall index.'}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-slate-200 text-[11px] text-slate-500 text-left flex items-center justify-between">
              <span>Data Completeness:</span>
              <strong className="text-slate-800 font-mono">
                {overall.valid_indicators_count ?? 0} of 4 Indicators Available
              </strong>
            </div>
          </div>

          {/* Component Contributions & Normalization Methodology (7 cols) */}
          <div className="lg:col-span-7 rounded-lg p-5 bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Mathematical Weighting & Re-Normalization Policy
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                The overall Environmental Indicator Score synthesizes four key urban observables using weighted Multi-Criteria Decision Analysis (MCDA). 
                If one indicator is missing due to sensor downtime, the remaining three valid indicators are mathematically re-normalized to sum to 100%. 
                If fewer than three indicators are available, the overall score is set to <em>Data Incomplete</em> to prevent skewed evaluations.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Air Quality</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">35%</span>
                  <span className="text-[10px] text-emerald-800 block">Primary Weight</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Temperature</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">25%</span>
                  <span className="text-[10px] text-amber-700 block">Thermal Weight</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Humidity</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">20%</span>
                  <span className="text-[10px] text-sky-700 block">Moisture Weight</span>
                </div>
                <div className="p-2.5 rounded bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Rainfall</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">20%</span>
                  <span className="text-[10px] text-teal-700 block">Hydraulic Weight</span>
                </div>
              </div>
            </div>

            {/* Official Disclaimer Notice */}
            <div className="p-3 rounded bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950">Statutory Disclaimer: </strong>
                <span>
                  {overall.disclaimer || 'Project-defined composite environmental indicator for comparative analysis and educational modeling. This is not an official regulatory health or meteorological standard.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. POLLUTANT ASSESSMENT                                           */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Atmospheric Pollutant Assessment & Health Thresholds
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation of criteria aerosols and reactive trace gases against statutory air quality standards
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            {isGroundAvailable ? 'CPCB CAAQMS Station Telemetry' : 'Copernicus CAMS Model Baseline'}
          </span>
        </div>

        {/* Ground Station Assessment if available */}
        {isGroundAvailable && (
          <div className="space-y-4">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 font-semibold text-slate-900">
                  <Radio className="w-4 h-4 text-emerald-800" />
                  <span>Ground Station: {groundStation?.name}</span>
                  <span className="text-slate-500 font-mono">({groundStation?.distance_km} km away)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Operator: {groundStation?.operator} • Standard: India National AQI (CPCB) • Last Updated: {groundStation?.last_updated || 'Recent'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Completeness: {groundMonitoring.completeness?.valid_pollutants_count} Pollutants Verified</span>
                </span>
                {current?.predominant_pollutant && (
                  <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px]">
                    Predominant: {current.predominant_pollutant}
                  </span>
                )}
              </div>
            </div>

            {/* Pollutant Sub-indices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(groundPollutants).map(([code, p]) => {
                const hourlySub = p.sub_index_hourly !== null ? p.sub_index_hourly : '--';
                const avg24hSub = p.sub_index_24h !== null ? p.sub_index_24h : '--';
                const concStr = p.concentration_hourly !== null
                  ? `${p.concentration_hourly} ${p.unit}`
                  : (p.concentration_24h !== null ? `${p.concentration_24h} ${p.unit}` : '--');

                return (
                  <div key={code} className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                        {code}
                      </span>
                      {p.category_hourly && p.category_hourly !== 'Unavailable' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getSubIndexBadge(p.category_hourly)}`}>
                          {p.category_hourly}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.name || code}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">Observed: {concStr}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">1-Hr Sub-Index</div>
                        <div className="text-base font-bold font-mono text-slate-900">{hourlySub}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">24-Hr Sub-Index</div>
                        <div className="text-base font-bold font-mono text-emerald-800">{avg24hSub}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regional Atmospheric Pollutant Assessment Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Regional Criteria Pollutants & International Health Thresholds
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Pollutant Species</th>
                  <th className="px-3.5 py-2.5">Observed Concentration</th>
                  <th className="px-3.5 py-2.5">WHO / Statutory Benchmark</th>
                  <th className="px-3.5 py-2.5">Health & Ecological Relevance</th>
                  <th className="px-3.5 py-2.5">Assessment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* PM2.5 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Fine Particulates (PM2.5)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.ground_pm25 !== undefined ? `${current.ground_pm25} µg/m³` : (current?.pm25 !== null ? `${current?.pm25} µg/m³` : '--')}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 15 µg/m³ (WHO 24-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Penetrates deep into alveolar lung tissue and enters arterial circulation.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.pm25 !== null ? (
                      (current?.ground_pm25 ?? current?.pm25) <= 15 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>

                {/* PM10 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Coarse Particulates (PM10)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.ground_pm10 !== undefined ? `${current.ground_pm10} µg/m³` : (current?.pm10 !== null ? `${current?.pm10} µg/m³` : '--')}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 45 µg/m³ (WHO 24-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Road dust, mechanical abrasion, and construction dust causing upper airway irritation.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.pm10 !== null ? (
                      (current?.ground_pm10 ?? current?.pm10) <= 45 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>

                {/* NO2 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Nitrogen Dioxide (NO₂)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.no2 !== null && current?.no2 !== undefined ? `${current.no2} µg/m³` : '--'}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 25 µg/m³ (WHO 24-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Combustion byproduct from vehicular exhaust; precursor to secondary nitrate aerosol.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.no2 !== null ? (
                      current?.no2 <= 25 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>

                {/* SO2 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Sulphur Dioxide (SO₂)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.so2 !== null && current?.so2 !== undefined ? `${current.so2} µg/m³` : '--'}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 40 µg/m³ (WHO 24-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Heavy oil and coal burning; key contributor to acid rain and sulfate particulates.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.so2 !== null ? (
                      current?.so2 <= 40 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>

                {/* CO */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Carbon Monoxide (CO)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.co !== null && current?.co !== undefined ? `${current.co} µg/m³` : '--'}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 4,000 µg/m³ (WHO 24-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Incomplete hydrocarbon combustion; reduces blood oxygen-carrying capacity.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.co !== null ? (
                      current?.co <= 4000 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>

                {/* O3 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">Ground-Level Ozone (O₃)</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 font-bold">
                    {current?.ozone !== null && current?.ozone !== undefined ? `${current.ozone} µg/m³` : '--'}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono">&lt; 100 µg/m³ (WHO 8-hr)</td>
                  <td className="px-3.5 py-2.5 text-slate-500">Photochemical oxidant formed in sunlight from NOx and VOCs; strong respiratory irritant.</td>
                  <td className="px-3.5 py-2.5">
                    {current?.ozone !== null ? (
                      current?.ozone <= 100 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">Within Guideline</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">Elevated</span>
                      )
                    ) : <span className="text-slate-400">Unavailable</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. ENVIRONMENTAL INDICATORS (CORE 4 CRITERIA)                     */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Environmental Indicators Breakdown & Mathematical Curves
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Component-level breakdown of the 4 normalized criteria indicators
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            4 Normalized Indicators
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicatorConfigs.map((cfg) => {
            const dataObj = indicators[cfg.key] || {};
            const Icon = cfg.icon;
            const hasData = dataObj.status === 'Valid' && dataObj.score !== null;

            return (
              <div
                key={cfg.key}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                      <Icon className="w-4 h-4 text-emerald-800" />
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                      Weight: {cfg.weight}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between my-2">
                    {hasData ? (
                      <>
                        <div>
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            {dataObj.score}
                          </span>
                          <span className="text-xs font-sans text-slate-500"> / 100</span>
                        </div>
                        <span className="text-xs text-slate-700 font-mono font-medium">
                          Raw Telemetry: <strong className="text-slate-900">{dataObj.raw_value} {dataObj.unit}</strong>
                        </span>
                      </>
                    ) : (
                      <div className="py-1">
                        <span className="text-xs text-amber-700 font-medium italic">
                          No Telemetry Available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visual Score Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${cfg.bgBar}`}
                      style={{ width: hasData ? `${Math.min(100, Math.max(0, dataObj.score))}%` : '0%' }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-medium text-slate-700">
                      {hasData ? dataObj.tier : 'Telemetry Offline'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Target: {cfg.standard}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <p className="leading-relaxed">
                    <strong className="text-slate-700 font-medium">Normalization Logic: </strong>
                    {cfg.methodology}
                  </p>
                  {dataObj.description && (
                    <p className="text-[10px] text-slate-600 italic">
                      {dataObj.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. COMPARATIVE ASSESSMENT: GROUND VS MODELLED                     */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Discrepancy & Validation Analysis: Ground Telemetry vs Modelled CAMS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scientific cross-validation between localized in situ sensors and regional Eulerian assimilation
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            Dual-Stream Comparison
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: In Situ Ground Station */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-900 uppercase tracking-wide text-xs flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-emerald-800" />
                <span>Ground CAAQMS Station (Primary)</span>
              </span>
              {isGroundAvailable ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold font-mono">
                  AQI {current?.aqi} • {current?.aqi_category}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                  Outside CAAQMS Domain
                </span>
              )}
            </div>

            <div className="space-y-2 text-slate-700">
              {isGroundAvailable ? (
                <>
                  <p className="font-bold text-slate-900 text-sm">{groundStation?.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Operating Agency: {groundStation?.operator} • Distance from Coordinates: {groundStation?.distance_km} km
                  </p>
                  <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">1-Hour Peak AQI:</span>
                      <strong className="text-slate-900">{current?.hourly_peak_aqi ?? '--'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">24-Hour Rolling Average:</span>
                      <strong className="text-emerald-800">{current?.running_24h_aqi ?? '--'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Predominant Pollutant:</span>
                      <strong className="text-amber-800">{current?.predominant_pollutant || 'N/A'}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  In situ Continuous Ambient Air Quality Monitoring Stations (CAAQMS) are deployed primarily by the Central Pollution Control Board (CPCB) in India. For locations outside this network, the regional Copernicus CAMS assimilation serves as the authoritative continuous baseline.
                </p>
              )}
            </div>
          </div>

          {/* Right: Copernicus CAMS Model */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-900 uppercase tracking-wide text-xs flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Atmospheric Model (Copernicus CAMS)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold font-mono">
                US AQI {current?.cams_aqi ?? '--'} • {current?.cams_category || 'Moderate'}
              </span>
            </div>

            <div className="space-y-2 text-slate-700">
              <p className="font-bold text-slate-900 text-sm">European Copernicus Atmosphere Monitoring Service</p>
              <p className="text-[11px] text-slate-500">
                Resolution: ~11 km (0.1°) regional atmospheric grid • Standard: US EPA Breakpoints
              </p>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Grid Cell PM2.5:</span>
                  <strong className="text-slate-900">{current?.pm25 !== null ? `${current?.pm25} µg/m³` : '--'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grid Cell PM10:</span>
                  <strong className="text-slate-900">{current?.pm10 !== null ? `${current?.pm10} µg/m³` : '--'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integration Method:</span>
                  <strong className="text-slate-700">Eulerian Multi-Layer Chemical Transport</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Discrepancy Explanation */}
        <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-800" />
            <span>Scientific Explanation of Observational Discrepancies</span>
          </h4>
          <p>
            Ground monitors (e.g. CPCB optical particle analyzers and beta-attenuation monitors) record raw physical particle counts at human breathing elevation (3–10 m above ground level). Consequently, ground sensors are highly sensitive to immediate localized emission sources including arterial traffic congestion, localized construction dust, and thermal street canyons.
          </p>
          <p>
            In contrast, the Copernicus Atmosphere Monitoring Service (CAMS) computes a volume-averaged numerical simulation over an 11-kilometer horizontal grid cell. The CAMS model assimilates satellite aerosol optical depth (AOD) measurements with global meteorological forecasts to predict broader regional transport. 
            <strong> EcoVision preserves both data streams intact without artificial mathematical reconciliation or data substitution.</strong>
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. ENVIRONMENTAL INSIGHTS & ACTION RECOMMENDATIONS                */}
      {/* ================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Rule-Based Environmental Insights */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Measured Environmental Insights
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                Rule-Based Analytics
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Objective environmental assessments derived directly from measured telemetry streams and statistical variance:
            </p>

            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {item.headline}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      {item.evidence}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  No automated insight anomalies detected for the active observational cycle.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span>Deterministic rule engine based on verified sensor feeds. Zero AI fabrication.</span>
          </div>
        </div>

        {/* Column 2: Targeted Action Recommendations */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Targeted Action Recommendations
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                Advisory Guidance
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Academic municipal and public health advisories mapped to currently measured environmental stressors:
            </p>

            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {rec.domain}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-semibold">
                        {rec.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {rec.recommendation}
                    </p>
                    <div className="pt-1 text-[10px] text-slate-500 flex items-center space-x-1">
                      <Compass className="w-3 h-3 text-emerald-800" />
                      <span>Trigger: <strong className="text-slate-800 font-normal">{rec.measured_trigger}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  All monitored environmental parameters currently satisfy statutory safety baselines.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Advisory recommendations based on current findings. Consult local authorities for official mandates.</span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. ANALYSIS SUMMARY & MULTI-DAY TEMPORAL CONTEXT                  */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Synthesis Summary & Multi-Day Temporal Baseline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured academic interpretation comparing current observations with historical period trends
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs self-start sm:self-auto">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onSelectPeriod && onSelectPeriod(days)}
                disabled={isLoading}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                  analysisPeriodDays === days
                    ? 'bg-emerald-800 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Past {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Coverage Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>
              Analysis Baseline: <strong>{coverage.start_date || 'Past'} to {coverage.end_date || 'Present'}</strong> ({coverage.actual_days_retrieved ?? analysisPeriodDays} of {coverage.requested_period_days ?? analysisPeriodDays} days retrieved)
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Coverage Rate: {coverage.coverage_percentage ?? 100}%
          </span>
        </div>

        {/* Statistical Period Averages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean Temperature</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {periodAverages.mean_temperature !== null && periodAverages.mean_temperature !== undefined ? `${periodAverages.mean_temperature}°C` : '--'}
            </div>
            <div className="text-[10px] text-slate-500">
              Trend: <strong className="text-slate-700">{tempTrend.direction || 'Stable'}</strong> ({tempTrend.delta_c ? `${tempTrend.delta_c > 0 ? '+' : ''}${tempTrend.delta_c}°C` : '0°C'})
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Precipitation Accumulation</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {periodAverages.total_rainfall !== null && periodAverages.total_rainfall !== undefined ? `${periodAverages.total_rainfall} mm` : '--'}
            </div>
            <div className="text-[10px] text-slate-500">
              Wet Days: <strong className="text-slate-700">{periodAverages.rainy_days ?? 0}</strong> • Dry Days: <strong className="text-slate-700">{periodAverages.dry_days ?? 0}</strong> {rainTrend.direction ? `(${rainTrend.direction})` : ''}
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean Relative Humidity</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {periodAverages.mean_humidity !== null && periodAverages.mean_humidity !== undefined ? `${periodAverages.mean_humidity}%` : '--'}
            </div>
            <div className="text-[10px] text-slate-500">
              Normal Baseline: 40% – 60%
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Mean Air Quality Index</span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {periodAverages.mean_aqi !== null && periodAverages.mean_aqi !== undefined ? `${periodAverages.mean_aqi} AQI` : '--'}
            </div>
            <div className="text-[10px] text-slate-500">
              Trend: <strong className="text-slate-700">{aqiTrend.direction || 'Stable'}</strong>
            </div>
          </div>
        </div>

        {/* Academic Synthesis Conclusion Text */}
        <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            Academic Environmental Synthesis
          </h4>
          <p>
            The environmental evaluation for <strong>{selectedCity?.name}</strong> indicates an overall Environmental Indicator Score of{' '}
            <strong className="text-slate-900 font-mono">{isOverallValid ? `${overall.overall_score}/100 (${overall.tier})` : 'Data Incomplete'}</strong>. 
            The primary contributing factor to atmospheric loading is evaluated through the predominant pollutant stream{' '}
            (<strong className="text-slate-900">{current?.predominant_pollutant || 'Criteria Aerosols'}</strong>), while boundary layer thermodynamics 
            maintain a recorded temperature of <strong>{current?.temperature !== null ? `${current?.temperature}°C` : 'N/A'}</strong> and relative humidity of{' '}
            <strong>{current?.relative_humidity !== null ? `${current?.relative_humidity}%` : 'N/A'}</strong>.
          </p>
          <p className="text-[11px] text-slate-500">
            All calculations strictly adhere to the defined mathematical piecewise normalization functions. Users requiring deeper longitudinal time-series, multi-week variance breakdowns, or regression modeling should proceed to Module 06 (Historical Analysis) or Module 07 (Prediction System).
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. NAVIGATION ACTIONS                                             */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigateToModule && onNavigateToModule('module-04')}
          className="px-4 py-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Return to Module 04: Environmental Monitoring</span>
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
            onClick={() => onNavigateToModule && onNavigateToModule('module-06')}
            className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <span>Proceed to Module 06: Historical Analysis</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>
    </div>
  );
}
