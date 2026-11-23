import React from 'react';
import { 
  Radio, 
  Layers, 
  CloudSun, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  Server, 
  Clock, 
  MapPin, 
  Gauge, 
  Wind, 
  Thermometer, 
  Droplets,
  Activity,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function DataAcquisitionModule({
  selectedCity,
  environmentalData,
  isLoading = false,
  errorMessage = null,
  onRefresh,
  onNavigateToModule
}) {
  const current = environmentalData?.current;
  const groundMonitoring = current?.ground_monitoring;
  const isGroundAvailable = groundMonitoring?.status === 'success';
  const groundStation = isGroundAvailable ? groundMonitoring.station : null;
  const hasData = !!environmentalData && !!current;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE OVERVIEW: ACADEMIC EXPLANATION                         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Radio className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-03
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 03
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Environmental Data Acquisition & Telemetry Ingestion
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              Protocol: REST / RSS Multi-Source
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Scientific Telemetry Architecture:</strong> Module 03 
            governs the multi-source data ingestion pipeline for the ECOVISION platform. Real-world observations are acquired 
            through a dual-stream methodology that reconciles empirical surface measurements with regional numerical simulations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
                <Building2 className="w-4 h-4 text-emerald-800" />
                <span>In Situ Ground CAAQMS</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Direct physical sensor streams from continuous monitoring stations (CPCB network) capturing hyper-local urban concentrations.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
                <Layers className="w-4 h-4 text-emerald-800" />
                <span>Atmospheric CAMS Model</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Copernicus Atmosphere Service 0.1° (~11 km) chemical transport reanalysis providing continuous spatial aerosol grids.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
                <CloudSun className="w-4 h-4 text-emerald-800" />
                <span>Meteorological NWP Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Numerical Weather Prediction models via Open-Meteo API providing boundary layer temperature, moisture, and precipitation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. DATA RETRIEVAL ACTION & RUNTIME STATUS                         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Telemetry Ingestion Controller
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Target Municipality:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-emerald-800" />
              <span>{selectedCity?.name || 'None Selected'}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({typeof selectedCity?.latitude === 'number' ? selectedCity.latitude.toFixed(2) : selectedCity?.latitude}°, {typeof selectedCity?.longitude === 'number' ? selectedCity.longitude.toFixed(2) : selectedCity?.longitude}°)
              </span>
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : hasData ? 'bg-emerald-600' : 'bg-slate-400'}`} />
              <span className="font-bold text-slate-900 text-sm">
                {isLoading 
                  ? `Acquiring Real-Time Telemetry for ${selectedCity?.name}...`
                  : hasData 
                    ? `Verified Observations Active (${selectedCity?.name})` 
                    : `Telemetry Awaiting Ingestion for ${selectedCity?.name}`}
              </span>
            </div>
            <p className="text-slate-600">
              {hasData 
                ? `Last successful acquisition completed at ${new Date(environmentalData.last_updated || current.observation_time).toLocaleString()}.`
                : 'Click "Execute Telemetry Retrieval" to query backend environmental endpoints for the active municipality.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading || !selectedCity}
              className="px-4 py-2.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingesting Telemetry...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Execute Telemetry Retrieval</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State Banner */}
        {errorMessage && (
          <div className="p-4 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>Telemetry Acquisition Notice: {errorMessage}</span>
            </div>
            <p className="text-rose-700">
              The ingestion microservice was unable to retrieve observations for this spatial target. 
              EcoVision does not invent artificial data when external APIs are unreachable.
            </p>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 3. DATA SOURCES: REAL EXTERNAL PROVIDERS                         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Data Providers & Integration Status
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            3 Real Integration Pipelines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Provider 1: Open-Meteo Weather */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <CloudSun className="w-4 h-4 text-amber-600" />
                  <span>Open-Meteo Weather</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${hasData && current?.temperature !== undefined ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                  {hasData && current?.temperature !== undefined ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-slate-600 leading-normal">
                Numerical Weather Prediction (NWP) model providing surface weather observations and boundary-layer thermodynamics.
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Endpoint:</span>
                  <span>/v1/forecast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cache TTL:</span>
                  <span>300 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplied Parameters:</span>
                  <span className="text-slate-800 font-bold">Temp, Humidity, Rain, Wind</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-emerald-900 font-medium">
              Source: Global NWP Ensemble (NOAA/DWD/ECMWF)
            </div>
          </div>

          {/* Provider 2: Copernicus CAMS */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>Copernicus CAMS</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${hasData && current?.cams_aqi !== undefined ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                  {hasData && current?.cams_aqi !== undefined ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-slate-600 leading-normal">
                European Copernicus Atmosphere Monitoring Service providing regional chemical transport aerosol models on 0.1° grids.
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Endpoint:</span>
                  <span>/v1/air-quality</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolution:</span>
                  <span>~11 km (0.1° grid)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplied Parameters:</span>
                  <span className="text-slate-800 font-bold">US AQI, PM2.5, PM10, Trace Gases</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-teal-900 font-medium">
              Standard: US EPA Breakpoints (0–500)
            </div>
          </div>

          {/* Provider 3: CPCB Ground Station (India) */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>CPCB CAAQMS</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                  groundMonitoring?.status === 'success' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : groundMonitoring?.status === 'insufficient_data'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {groundMonitoring?.status === 'success' ? 'STATION LINKED' : groundMonitoring?.status ? groundMonitoring.status.toUpperCase() : 'STANDBY'}
                </span>
              </div>
              <p className="text-slate-600 leading-normal">
                Central Pollution Control Board official real-time ground-station telemetry network (India jurisdiction).
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocol:</span>
                  <span>CAAQMS XML Feed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Station Distance:</span>
                  <span>{isGroundAvailable ? `${groundStation?.distance_km} km` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplied Parameters:</span>
                  <span className="text-slate-800 font-bold">India NAQI, Ground PM2.5/10</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 font-medium">
              {isGroundAvailable ? `Linked: ${groundStation?.name}` : 'Availability: India CAAQMS Radius (50 km)'}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. ACQUISITION PARAMETERS: REAL COLLECTED VALUES & UNITS          */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ingested Environmental Telemetry Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Observation Time: {current?.observation_time || 'Pending Retrieval'}
          </span>
        </div>

        {hasData ? (
          <div className="space-y-4">
            {/* Meteorological NWP Ingestion Grid */}
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600 block mb-2">
                1. Meteorological Stream (Open-Meteo NWP)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Surface Temperature</span>
                    <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.temperature !== null && current.temperature !== undefined ? `${current.temperature.toFixed(1)} ${current.temperature_unit || '°C'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">2-meter surface level</p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Relative Humidity</span>
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.relative_humidity !== null && current.relative_humidity !== undefined ? `${current.relative_humidity} ${current.humidity_unit || '%'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">Atmospheric vapor ratio</p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Precipitation / Rain</span>
                    <CloudSun className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.rain !== null && current.rain !== undefined ? `${current.rain} ${current.rain_unit || 'mm'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">Liquid precipitation rate</p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Wind Velocity</span>
                    <Wind className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.wind_speed !== null && current.wind_speed !== undefined ? `${current.wind_speed} ${current.wind_unit || 'km/h'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">10-meter anemometer height</p>
                </div>
              </div>
            </div>

            {/* Atmospheric Aerosol & Particulate Ingestion Grid */}
            <div className="pt-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600 block mb-2">
                2. Particulate Matter & Criteria Air Quality Indices
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Primary AQI Index</span>
                    <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.aqi !== null && current.aqi !== undefined ? current.aqi : 'Unavailable'}
                  </p>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    Standard: {current.aqi_scale || 'US EPA'}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Fine Particulates (PM2.5)</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {(current.ground_pm25 ?? current.pm25) !== null && (current.ground_pm25 ?? current.pm25) !== undefined ? `${current.ground_pm25 ?? current.pm25} ${current.pm25_unit || 'µg/m³'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Source: {current.ground_pm25 !== undefined ? 'Ground CAAQMS' : 'CAMS Aerosol Model'}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Coarse Particulates (PM10)</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {(current.ground_pm10 ?? current.pm10) !== null && (current.ground_pm10 ?? current.pm10) !== undefined ? `${current.ground_pm10 ?? current.pm10} ${current.pm10_unit || 'µg/m³'}` : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Source: {current.ground_pm10 !== undefined ? 'Ground CAAQMS' : 'CAMS Aerosol Model'}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-semibold">Modelled CAMS US AQI</span>
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {current.cams_aqi !== null && current.cams_aqi !== undefined ? current.cams_aqi : '--'}
                  </p>
                  <p className="text-[10px] text-slate-500">0.1° regional grid estimate</p>
                </div>
              </div>
            </div>

            {/* Trace Gases Table */}
            <div className="pt-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600 block mb-2">
                3. Gaseous Chemical Transport Parameters (Copernicus CAMS)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Nitrogen Dioxide (NO₂)</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {current.no2 !== null && current.no2 !== undefined ? `${current.no2} ${current.no2_unit || 'µg/m³'}` : '--'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Sulphur Dioxide (SO₂)</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {current.so2 !== null && current.so2 !== undefined ? `${current.so2} ${current.so2_unit || 'µg/m³'}` : '--'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Carbon Monoxide (CO)</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {current.co !== null && current.co !== undefined ? `${current.co} ${current.co_unit || 'µg/m³'}` : '--'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Surface Ozone (O₃)</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {current.ozone !== null && current.ozone !== undefined ? `${current.ozone} ${current.ozone_unit || 'µg/m³'}` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center space-y-2">
            <Radio className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">Telemetry Not Yet Ingested</p>
            <p className="max-w-md mx-auto">
              No active observations have been fetched for {selectedCity?.name || 'this location'} in this session. 
              Click &ldquo;Execute Telemetry Retrieval&rdquo; above to query live observations.
            </p>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. ACQUISITION RECORDS: RETRIEVAL TIMESTAMPS & PERSISTENCE        */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ingestion Audit & Record Metadata
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono">
            SQLite Table: environmental_observations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Observation Timestamp</span>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {current?.observation_time || 'Pending'}
            </p>
            <p className="text-[10px] text-slate-500">Provider reporting hour</p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Ingestion Timestamp</span>
            <p className="text-sm font-bold text-slate-900 font-mono truncate" title={environmentalData?.last_updated || current?.recorded_at}>
              {environmentalData?.last_updated 
                ? new Date(environmentalData.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Pending'}
            </p>
            <p className="text-[10px] text-slate-500">System acquisition time</p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Hourly Series Records</span>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {environmentalData?.hourly_series?.length ? `${environmentalData.hourly_series.length} steps` : 'None'}
            </p>
            <p className="text-[10px] text-slate-500">24-hour temporal resolution</p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Relational Database Record</span>
            <div className="flex items-center space-x-1 pt-0.5">
              <Database className="w-3.5 h-3.5 text-emerald-800" />
              <span className="text-xs font-semibold text-slate-900">
                {environmentalData?.city?.stored_in_sqlite ? 'Persisted in SQLite' : 'Session Memory'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Indexed for historical analytics</p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. PIPELINE NAVIGATION ACTIONS                                    */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pipeline Stage & Cross-Module Navigation
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold">
            Stage 03: Telemetry Verified
          </span>
        </div>

        <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-bold text-slate-900">
                Data Acquisition Ready for Environmental Monitoring
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Multi-source observation streams are ingested and aligned. Proceed to Module 04 to evaluate real-time health indicators, particulate breakdowns, and 24-hour atmospheric curves.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToModule('module-02')}
              className="px-3.5 py-2 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Location Selection (MOD-02)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToModule('module-04')}
              className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Proceed to Module 04: Environmental Monitoring</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
