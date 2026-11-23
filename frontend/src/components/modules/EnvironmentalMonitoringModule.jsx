import React from 'react';
import { 
  Activity, 
  Wind, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Compass, 
  Layers, 
  Radio, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  Gauge, 
  CheckCircle2
} from 'lucide-react';

import MetricCard from '../dashboard/MetricCard';
import EnvironmentalChart from '../dashboard/EnvironmentalChart';
import PollutantBreakdown from '../dashboard/PollutantBreakdown';
import UnavailableDataAlert from '../dashboard/UnavailableDataAlert';

export default function EnvironmentalMonitoringModule({
  selectedCity,
  environmentalData,
  isLoading = false,
  errorMessage = null,
  onRefresh,
  onNavigateToModule
}) {
  const current = environmentalData?.current;
  const series = environmentalData?.hourly_series || [];
  const groundMonitoring = current?.ground_monitoring;
  const isGroundAvailable = groundMonitoring?.status === 'success';
  const groundStation = isGroundAvailable ? groundMonitoring.station : null;
  const hasData = !!environmentalData && !!current;

  // Format cardinal coordinates
  const latFormatted = typeof selectedCity?.latitude === 'number'
    ? `${Math.abs(selectedCity.latitude).toFixed(4)}° ${selectedCity.latitude >= 0 ? 'N' : 'S'}`
    : '--';
  const lonFormatted = typeof selectedCity?.longitude === 'number'
    ? `${Math.abs(selectedCity.longitude).toFixed(4)}° ${selectedCity.longitude >= 0 ? 'E' : 'W'}`
    : '--';

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE OVERVIEW: PURPOSE & SCOPE                               */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-04
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 04
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Real-Time Environmental Monitoring & Multi-Parameter Surveillance
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              Scope: Live Telemetry & Diurnal Trends
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Purpose & Observational Scope:</strong> Module 04 executes 
            continuous multi-parameter environmental surveillance over the active spatial domain. The monitoring engine 
            assesses surface meteorological thermodynamics and atmospheric criteria pollutants against national statutory thresholds 
            (India CPCB National AQI) and international benchmarks (US EPA / WHO air quality standards).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Criteria Pollutants</span>
              <span className="text-[11px] text-slate-500">
                Surveillance of respirable aerosols (PM2.5, PM10) and reactive trace gases (NO₂, SO₂, CO, O₃).
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Meteorological Ingestion</span>
              <span className="text-[11px] text-slate-500">
                Real-time tracking of boundary temperature, relative humidity, precipitation, and wind velocity.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Diurnal Dynamics</span>
              <span className="text-[11px] text-slate-500">
                24-hour time-series evaluation identifying diurnal peaks, dispersion cycles, and nocturnal accumulation.
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
                Active Monitoring Domain: {selectedCity?.name}
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
            <span>Refresh Monitoring</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <UnavailableDataAlert
          message={errorMessage}
          onRetry={onRefresh}
        />
      )}

      {/* Loading state indicator */}
      {isLoading && !hasData && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 text-center shadow-xs">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
          <p className="text-sm text-slate-800 font-medium">Retrieving verified observations for {selectedCity?.name}...</p>
          <p className="text-xs text-slate-500 font-mono">In Situ CPCB CAAQMS Ground Telemetry & Copernicus CAMS Atmospheric Model</p>
        </div>
      )}

      {/* Ground Station vs Atmospheric Model Callout (if Ground station is linked) */}
      {hasData && isGroundAvailable && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700" />
              <span className="text-xs uppercase font-bold tracking-wider text-slate-800">
                Observational Baseline: Ground Station CAAQMS vs Copernicus CAMS
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Primary Standard: {current.aqi_scale || 'India National AQI (CPCB)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Ground Station Card */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 uppercase tracking-wide text-[11px] flex items-center space-x-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Ground CAAQMS Station (Primary)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold font-mono">
                  AQI {current.aqi} • {current.aqi_category}
                </span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">{groundStation.name}</p>
                <p className="text-[11px] text-slate-500">
                  Agency: {groundStation.operator} • Distance: {groundStation.distance_km} km
                </p>
                <div className="pt-1.5 flex items-center justify-between border-t border-slate-200 font-mono text-[11px]">
                  <span>1-Hr Peak: <strong className="text-slate-900">{current.hourly_peak_aqi ?? '--'}</strong></span>
                  <span>24-Hr Rolling Avg: <strong className="text-emerald-800">{current.running_24h_aqi ?? '--'}</strong></span>
                  <span>Predominant: <strong className="text-amber-800">{current.predominant_pollutant}</strong></span>
                </div>
              </div>
            </div>

            {/* Modelled CAMS Card */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px] flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Atmospheric Model (Copernicus CAMS)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold font-mono">
                  US AQI {current.cams_aqi ?? '--'} • {current.cams_category || 'Moderate'}
                </span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">European Copernicus Atmosphere Service</p>
                <p className="text-[11px] text-slate-500">
                  Resolution: ~11 km (0.1°) regional atmospheric grid • Standard: US EPA Breakpoints
                </p>
                <div className="pt-1.5 flex items-center justify-between border-t border-slate-200 font-mono text-[11px]">
                  <span>Grid PM2.5: <strong className="text-slate-900">{current.pm25} µg/m³</strong></span>
                  <span>Grid PM10: <strong className="text-slate-900">{current.pm10} µg/m³</strong></span>
                  <span className="text-[10px] text-slate-500">Unmodified Baseline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. CURRENT ENVIRONMENTAL CONDITIONS & PARAMETERS SUMMARY          */}
      {/* ================================================================= */}
      {hasData && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Current Environmental Conditions (Complete Measurement Matrix)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              10 Monitored Parameters
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {/* 1. Temperature */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <Thermometer className="w-3 h-3 text-amber-600" />
                <span>Temperature</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.temperature !== null && current.temperature !== undefined ? `${current.temperature.toFixed(1)} ${current.temperature_unit || '°C'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Surface 2m level</p>
            </div>

            {/* 2. Relative Humidity */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-sky-600" />
                <span>Relative Humidity</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.relative_humidity !== null && current.relative_humidity !== undefined ? `${current.relative_humidity} ${current.humidity_unit || '%'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Moisture ratio</p>
            </div>

            {/* 3. Rainfall / Precipitation */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <CloudRain className="w-3 h-3 text-teal-600" />
                <span>Rainfall</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.rain !== null && current.rain !== undefined ? `${current.rain} ${current.rain_unit || 'mm'}` : (current.precipitation !== null && current.precipitation !== undefined ? `${current.precipitation} mm` : '0.0 mm')}
              </p>
              <p className="text-[10px] text-slate-500">Liquid precipitation</p>
            </div>

            {/* 4. Wind Speed */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <Wind className="w-3 h-3 text-slate-600" />
                <span>Wind Speed</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.wind_speed !== null && current.wind_speed !== undefined ? `${current.wind_speed} ${current.wind_unit || 'km/h'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">10m anemometer</p>
            </div>

            {/* 5. PM2.5 */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <Activity className="w-3 h-3 text-emerald-700" />
                <span>PM2.5</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {(current.ground_pm25 ?? current.pm25) !== null && (current.ground_pm25 ?? current.pm25) !== undefined ? `${current.ground_pm25 ?? current.pm25} ${current.pm25_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Fine particulates</p>
            </div>

            {/* 6. PM10 */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                <Activity className="w-3 h-3 text-emerald-700" />
                <span>PM10</span>
              </span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {(current.ground_pm10 ?? current.pm10) !== null && (current.ground_pm10 ?? current.pm10) !== undefined ? `${current.ground_pm10 ?? current.pm10} ${current.pm10_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Coarse particulates</p>
            </div>

            {/* 7. Nitrogen Dioxide (NO2) */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Nitrogen Dioxide (NO₂)</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.no2 !== null && current.no2 !== undefined ? `${current.no2} ${current.no2_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Vehicle combustion</p>
            </div>

            {/* 8. Sulphur Dioxide (SO2) */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Sulphur Dioxide (SO₂)</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.so2 !== null && current.so2 !== undefined ? `${current.so2} ${current.so2_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Industrial combustion</p>
            </div>

            {/* 9. Carbon Monoxide (CO) */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Carbon Monoxide (CO)</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.co !== null && current.co !== undefined ? `${current.co} ${current.co_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Fossil fuel emission</p>
            </div>

            {/* 10. Surface Ozone (O3) */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Surface Ozone (O₃)</span>
              <p className="text-base font-bold text-slate-900 font-mono">
                {current.ozone !== null && current.ozone !== undefined ? `${current.ozone} ${current.ozone_unit || 'µg/m³'}` : '--'}
              </p>
              <p className="text-[10px] text-slate-500">Photochemical smog</p>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 3. AIR QUALITY ASSESSMENT & EXECUTIVE METRICS                     */}
      {/* ================================================================= */}
      {hasData && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700">
              Executive Air Quality & Meteorological Status
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Standard: {current.aqi_scale || 'US EPA (0–500)'} • Primary: {isGroundAvailable ? 'CPCB CAAQMS Network' : 'Copernicus CAMS & Open-Meteo'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Air Quality Index"
              value={current.aqi !== null && current.aqi !== undefined ? current.aqi : "Unavailable"}
              unit={current.aqi_scale === 'India National AQI (CPCB)' ? 'CPCB NAQI' : (current.aqi_scale || "US EPA")}
              status={current.aqi_category || "Unavailable"}
              description={isGroundAvailable 
                ? `${groundStation.name.split(',')[0]} (${groundStation.distance_km} km)` 
                : "Modelled CAMS estimate (0.1° grid)"}
              icon={Gauge}
              color="emerald"
            />

            <MetricCard
              title="Fine Particulates (PM2.5)"
              value={current.ground_pm25 ?? current.pm25}
              unit={current.pm25_unit || "µg/m³"}
              status={current.ground_pm25 !== undefined 
                ? (current.ground_pm25 <= 30 ? "Good" : (current.ground_pm25 <= 60 ? "Satisfactory" : (current.ground_pm25 <= 90 ? "Moderate" : (current.ground_pm25 <= 120 ? "Poor" : "Very Poor"))))
                : (current.pm25 !== null && current.pm25 <= 12 ? "Optimal" : (current.pm25 <= 35 ? "Moderate" : "Elevated"))}
              description={current.ground_pm25 !== undefined ? `Ground CAAQMS (${groundStation?.distance_km} km)` : "Copernicus CAMS aerosol model"}
              icon={Activity}
              color="teal"
            />

            <MetricCard
              title="Ambient Temperature"
              value={current.temperature}
              unit={current.temperature_unit || "°C"}
              status={current.temperature !== null ? `${current.temperature.toFixed(1)}°C Actual` : undefined}
              description="Surface 2m temperature"
              icon={Thermometer}
              color="amber"
            />

            <MetricCard
              title="Relative Humidity"
              value={current.relative_humidity}
              unit={current.humidity_unit || "%"}
              status={current.rain !== null && current.rain > 0 ? `Rain: ${current.rain} mm` : "Dry / Clear"}
              description="Atmospheric moisture level"
              icon={Droplets}
              color="sky"
            />
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 4. POLLUTANT MONITORING (REUSING POLLUTANTBREAKDOWN)               */}
      {/* ================================================================= */}
      {hasData && (
        <section>
          <PollutantBreakdown current={current} />
        </section>
      )}

      {/* ================================================================= */}
      {/* 5. 24-HOUR MONITORING (REUSING ENVIRONMENTALCHART)                */}
      {/* ================================================================= */}
      {hasData && (
        <section>
          <EnvironmentalChart
            seriesData={series}
            cityName={selectedCity?.name || 'Selected City'}
          />
        </section>
      )}

      {/* Fallback when no data has been acquired yet */}
      {!hasData && !isLoading && !errorMessage && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Activity className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No Environmental Monitoring Telemetry Active
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Telemetry has not yet been acquired for {selectedCity?.name || 'the selected location'}. 
            Click the button below to query the environmental microservice or navigate to Module 03.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Fetch Telemetry Now</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToModule('module-03')}
              className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              <span>Go to Module 03: Data Acquisition</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. MONITORING STATUS & AUDIT METADATA                             */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Monitoring Lifecycle & Ingestion Audit
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono">
            State: {hasData ? 'Active Observations' : 'Awaiting Telemetry'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Observation Time</span>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {current?.observation_time || 'Pending'}
            </p>
            <p className="text-[10px] text-slate-500">Provider measurement epoch</p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Primary Data Source</span>
            <p className="text-xs font-bold text-slate-900 truncate" title={environmentalData?.data_source}>
              {environmentalData?.data_source || 'Open-Meteo & Copernicus CAMS'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Scale: {current?.aqi_scale || 'US EPA'}</p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Ground Station Link</span>
            <div className="flex items-center space-x-1.5 pt-0.5">
              <span className={`w-2 h-2 rounded-full ${isGroundAvailable ? 'bg-emerald-600' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-900 text-xs truncate">
                {isGroundAvailable ? groundStation.name : 'Satellite/Modelled Grid'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isGroundAvailable ? `Distance: ${groundStation.distance_km} km` : 'CAAQMS out of 50 km range'}
            </p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">24h Data Resolution</span>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {series.length > 0 ? `${series.length} Hourly Points` : 'Pending'}
            </p>
            <p className="text-[10px] text-slate-500">Aligned temporal dynamics</p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. PIPELINE NAVIGATION ACTIONS                                    */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pipeline Stage & Cross-Module Navigation
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold">
            Stage 04: Surveillance Verified
          </span>
        </div>

        <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-bold text-slate-900">
                Environmental Monitoring Active: {selectedCity?.name}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Real-time atmospheric parameters and pollutant breakdowns are established. 
              Proceed to Module 05: Environmental Analysis to evaluate multi-criteria index scoring, historical longitudinal distributions, and rule-based insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToModule('module-03')}
              className="px-3.5 py-2 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Data Acquisition (MOD-03)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToModule('module-05')}
              className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Proceed to Module 05: Environmental Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
