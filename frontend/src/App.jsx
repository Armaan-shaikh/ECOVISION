import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/layout/Navbar';
import CitySearch from './components/dashboard/CitySearch';
import CityHeader from './components/dashboard/CityHeader';
import MetricCard from './components/dashboard/MetricCard';
import EnvironmentalChart from './components/dashboard/EnvironmentalChart';
import PollutantBreakdown from './components/dashboard/PollutantBreakdown';
import EnvironmentalScoringCard from './components/dashboard/EnvironmentalScoringCard';
import HistoricalTrendsView from './components/dashboard/HistoricalTrendsView';
import InsightsAndRecommendations from './components/dashboard/InsightsAndRecommendations';
import PredictionCenter from './components/dashboard/PredictionCenter';
import DatabaseSavedCities from './components/dashboard/DatabaseSavedCities';
import BackendStatusPanel from './components/dashboard/BackendStatusPanel';
import UnavailableDataAlert from './components/dashboard/UnavailableDataAlert';
import { 
  fetchHealth, 
  fetchCityEnvironmentalData, 
  fetchEnvironmentalAnalysis, 
  fetchCityPrediction,
  fetchSavedCities 
} from './services/api';
import { Activity, Wind, Thermometer, Droplets, Compass, Loader2, Layers, AlertTriangle, Radio } from 'lucide-react';

const DEFAULT_INITIAL_CITY = {
  name: 'London',
  state: 'England',
  country: 'United Kingdom',
  country_code: 'GB',
  latitude: 51.50853,
  longitude: -0.12574,
  timezone: 'Europe/London'
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState(DEFAULT_INITIAL_CITY);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [analysisPeriodDays, setAnalysisPeriodDays] = useState(7);
  const [savedCities, setSavedCities] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  
  const [loadingCityData, setLoadingCityData] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active request sequence tracker to prevent race conditions and stale data
  const activeRequestIdRef = useRef(0);

  // Load environmental data, historical analysis, and ML predictions for a city
  const loadCityData = useCallback(async (city, days = 7) => {
    if (!city || typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
      return;
    }

    const currentReqId = ++activeRequestIdRef.current;

    // Immediately update city name and flush previous city's stale observations
    setSelectedCity(city);
    setEnvironmentalData(null);
    setAnalysisData(null);
    setPredictionData(null);
    setErrorMessage(null);

    setLoadingCityData(true);
    setLoadingAnalysis(true);
    setLoadingPrediction(true);

    try {
      // Fetch live telemetry, historical analysis, and ML forecast in parallel
      const [telemetryRes, analysisRes, predictionRes] = await Promise.allSettled([
        fetchCityEnvironmentalData(city),
        fetchEnvironmentalAnalysis(city, days),
        fetchCityPrediction(city, false)
      ]);

      // If a newer city request was initiated while this one was in-flight, discard stale responses
      if (currentReqId !== activeRequestIdRef.current) {
        return;
      }

      if (telemetryRes.status === 'fulfilled' && telemetryRes.value) {
        setEnvironmentalData(telemetryRes.value);
        if (telemetryRes.value.city) {
          setSelectedCity(prev => ({ ...prev, ...telemetryRes.value.city }));
        }
      } else {
        const failureReason = telemetryRes.reason?.message || 'Unable to retrieve real-time environmental telemetry for this location.';
        setErrorMessage(failureReason);
      }

      if (analysisRes.status === 'fulfilled' && analysisRes.value) {
        setAnalysisData(analysisRes.value);
      } else {
        setAnalysisData(null);
      }

      if (predictionRes.status === 'fulfilled' && predictionRes.value) {
        setPredictionData(predictionRes.value);
      } else {
        setPredictionData({
          status: 'unavailable',
          message: predictionRes.reason?.message || `Machine learning projections are currently unavailable for ${city.name}. Click 'Attempt Model Fit' to fetch.`
        });
      }

      // Refresh saved cities from SQLite database
      fetchSavedCities().then(citiesList => {
        if (currentReqId === activeRequestIdRef.current) {
          setSavedCities(citiesList);
        }
      }).catch(() => {});

    } catch (err) {
      if (currentReqId === activeRequestIdRef.current) {
        console.warn('Error loading environmental data:', err.message);
        setErrorMessage(err.message || 'Unable to retrieve environmental observations.');
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setLoadingCityData(false);
        setLoadingAnalysis(false);
        setLoadingPrediction(false);
      }
    }
  }, []);

  // Handle retraining or refreshing the ML prediction model
  const handleRetrainPrediction = async () => {
    if (!selectedCity) return;
    setLoadingPrediction(true);
    try {
      const data = await fetchCityPrediction(selectedCity, true);
      setPredictionData(data);
    } catch (err) {
      console.warn('Failed to retrain prediction model:', err);
      setPredictionData({
        status: 'error',
        message: err.message || 'Model fit attempt encountered a network or timeout error. Please retry.'
      });
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Handle switching time period (7, 14, 30 days)
  const handleSelectPeriod = async (days) => {
    setAnalysisPeriodDays(days);
    if (!selectedCity) return;
    setLoadingAnalysis(true);
    try {
      const data = await fetchEnvironmentalAnalysis(selectedCity, days);
      setAnalysisData(data);
    } catch (err) {
      console.warn('Failed to reload historical period analysis:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Initial boot: health check & load initial city once on mount
  useEffect(() => {
    let isMounted = true;
    async function boot() {
      setLoadingHealth(true);
      try {
        const health = await fetchHealth().catch(() => null);
        if (isMounted) setBackendHealth(health);

        const citiesList = await fetchSavedCities().catch(() => []);
        if (isMounted) setSavedCities(citiesList);

        const initialCity = (citiesList && citiesList.length > 0) ? citiesList[0] : DEFAULT_INITIAL_CITY;
        setSelectedCity(initialCity);
        loadCityData(initialCity, 7);
      } catch (err) {
        console.warn('Initial system boot check failed:', err);
        loadCityData(DEFAULT_INITIAL_CITY, 7);
      } finally {
        if (isMounted) setLoadingHealth(false);
      }
    }

    boot();
    return () => {
      isMounted = false;
    };
  }, [loadCityData]);

  const current = environmentalData?.current;
  const series = environmentalData?.hourly_series || [];

  return (
    <div className="min-h-screen bg-[#07130e] text-emerald-50 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        backendHealth={backendHealth}
        isChecking={loadingHealth}
        onRefresh={() => {
          fetchHealth().then(setBackendHealth).catch(() => {});
          if (selectedCity) loadCityData(selectedCity);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* City Search Bar & Quick Selectors */}
        <section className="eco-card rounded-2xl p-4 sm:p-5 border border-emerald-500/15 relative z-30">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400/80 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global Municipality Environmental Ingestion</span>
              </span>
              <span className="text-[11px] text-emerald-400/50">
                Powered by Open-Meteo Geocoding & Copernicus CAMS Model
              </span>
            </div>
            <CitySearch
              onSelectCity={(city) => {
                setSelectedCity(city);
                loadCityData(city);
              }}
              currentCity={selectedCity}
              isSearchingData={loadingCityData}
            />
          </div>
        </section>

        {/* Selected City Details Header */}
        <CityHeader
          city={selectedCity}
          lastUpdated={environmentalData?.last_updated || current?.observation_time}
          dataSource={environmentalData?.data_source}
          aqiScale={environmentalData?.aqi_scale || current?.aqi_scale}
          groundMonitoring={environmentalData?.ground_monitoring || current?.ground_monitoring}
          onRefresh={() => loadCityData(selectedCity)}
          isRefreshing={loadingCityData}
        />

        {/* Error or Unavailable Data Banner */}
        {errorMessage && (
          <UnavailableDataAlert
            message={errorMessage}
            onRetry={() => loadCityData(selectedCity)}
          />
        )}

        {/* Loading placeholder when observations are transitioning between cities */}
        {loadingCityData && !environmentalData && !errorMessage && (
          <div className="eco-card rounded-2xl p-8 border border-emerald-500/15 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-sm text-emerald-200 font-medium">Retrieving verified observations for {selectedCity?.name}...</p>
            <p className="text-xs text-emerald-400/60 font-mono">CPCB CAAQMS Ground Telemetry & Copernicus CAMS Atmospheric Model</p>
          </div>
        )}

        {/* Ground Station vs Atmospheric Model Comparison Banner (Active when Ground Station is reporting) */}
        {current && !errorMessage && current.ground_monitoring?.status === 'success' && (
          <div className="eco-card rounded-2xl p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-r from-[#071911] via-[#092218] to-[#071911] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-900/50">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
                  Data Discrepancy & Validation Analysis: Ground Telemetry vs Modelled CAMS
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/60">
                Methodology: CPCB National AQI (Primary) vs Copernicus US EPA (Modelled)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left: CPCB Ground Station */}
              <div className="p-3.5 rounded-xl bg-[#05140d]/80 border border-emerald-600/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300 uppercase tracking-wide text-[11px] flex items-center space-x-1">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ground CAAQMS Station (Primary)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold font-mono">
                    AQI {current.aqi} • {current.aqi_category}
                  </span>
                </div>
                <div className="space-y-1 text-emerald-200/90">
                  <p className="font-medium text-white">{current.ground_monitoring.station.name}</p>
                  <p className="text-[11px] text-emerald-400/70">
                    Agency: {current.ground_monitoring.station.operator} • Distance: {current.ground_monitoring.station.distance_km} km
                  </p>
                  <div className="pt-1.5 flex items-center justify-between border-t border-emerald-950/80 font-mono text-[11px]">
                    <span>1-Hr Peak: <strong className="text-white">{current.hourly_peak_aqi ?? '--'}</strong></span>
                    <span>24-Hr Rolling Avg: <strong className="text-emerald-300">{current.running_24h_aqi ?? '--'}</strong></span>
                    <span>Predominant: <strong className="text-amber-300">{current.predominant_pollutant}</strong></span>
                  </div>
                </div>
              </div>

              {/* Right: Copernicus CAMS Model */}
              <div className="p-3.5 rounded-xl bg-[#05140d]/80 border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400/70 uppercase tracking-wide text-[11px] flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400/60" />
                    <span>Atmospheric Model (Copernicus CAMS)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 font-bold font-mono">
                    US AQI {current.cams_aqi ?? '--'} • {current.cams_category || 'Moderate'}
                  </span>
                </div>
                <div className="space-y-1 text-emerald-200/80">
                  <p className="font-medium text-emerald-300">European Copernicus Atmosphere Service</p>
                  <p className="text-[11px] text-emerald-400/60">
                    Resolution: ~11 km (0.1°) regional atmospheric grid • Standard: US EPA Breakpoints
                  </p>
                  <div className="pt-1.5 flex items-center justify-between border-t border-emerald-950/80 font-mono text-[11px]">
                    <span>Grid PM2.5: <strong className="text-emerald-200">{current.pm25} µg/m³</strong></span>
                    <span>Grid PM10: <strong className="text-emerald-200">{current.pm10} µg/m³</strong></span>
                    <span className="text-[10px] text-emerald-400/60">No Relabeling / No Conversion</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400/60 italic leading-relaxed">
              * Ground monitors (CPCB/DPCC) capture direct surface concentrations in active urban transport and residential zones, whereas Copernicus CAMS computes a spatial numerical average over an 11-km grid cell. EcoVision displays India National AQI as primary without altering or substituting CAMS model projections.
            </p>
          </div>
        )}

        {/* CPCB Insufficient Data Callout */}
        {current && !errorMessage && current.ground_monitoring?.status === 'insufficient_data' && (
          <div className="eco-card rounded-2xl p-4 border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>India National AQI Unavailable — CPCB Data Completeness Criteria Not Met</span>
            </div>
            <p className="text-amber-200/80">
              Station {current.ground_monitoring?.station?.name} does not meet the minimum requirement of 3 valid monitored pollutants including PM2.5 or PM10. Per official CPCB methodology, EcoVision displays &ldquo;AQI unavailable&rdquo; rather than inventing substitute numbers. CAMS atmospheric model estimate is preserved below.
            </p>
          </div>
        )}

        {/* Primary Environmental Metrics Grid (Real Telemetry) */}
        {current && !errorMessage && (
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-emerald-400/70">
                {current.ground_monitoring?.status === 'success' 
                  ? 'Continuous Ground Station (CPCB) & NWP Meteorological Telemetry'
                  : 'Verified Meteorological NWP & Atmospheric CAMS Observations'}
              </h2>
              <span className="text-[11px] font-mono text-emerald-400/50">
                Standard: {current.aqi_scale || 'US EPA (0–500)'} • Primary: {current.ground_monitoring?.status === 'success' ? 'CPCB CAAQMS Network' : 'Copernicus CAMS & Open-Meteo'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Air Quality Index"
                value={current.aqi !== null && current.aqi !== undefined ? current.aqi : "Unavailable"}
                unit={current.aqi_scale === 'India National AQI (CPCB)' ? 'CPCB NAQI' : (current.aqi_scale || "US EPA")}
                status={current.aqi_category || "Unavailable"}
                description={current.ground_monitoring?.status === 'success' 
                  ? `${current.ground_monitoring.station.name.split(',')[0]} (${current.ground_monitoring.station.distance_km} km)` 
                  : "Modelled CAMS estimate (0.1° grid)"}
                icon={Activity}
                color="emerald"
              />

              <MetricCard
                title="Fine Particulates (PM2.5)"
                value={current.ground_pm25 ?? current.pm25}
                unit={current.pm25_unit || "µg/m³"}
                status={current.ground_pm25 !== undefined 
                  ? (current.ground_pm25 <= 30 ? "Good" : (current.ground_pm25 <= 60 ? "Satisfactory" : (current.ground_pm25 <= 90 ? "Moderate" : (current.ground_pm25 <= 120 ? "Poor" : "Very Poor"))))
                  : (current.pm25 !== null && current.pm25 <= 12 ? "Optimal" : (current.pm25 <= 35 ? "Moderate" : "Elevated"))}
                description={current.ground_pm25 !== undefined ? `Ground CAAQMS (${current.ground_monitoring?.station?.distance_km} km)` : "Copernicus CAMS aerosol model"}
                icon={Wind}
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

        {/* 24-Hour Dynamics Chart Section */}
        {current && !errorMessage && (
          <section>
            <EnvironmentalChart
              seriesData={series}
              cityName={selectedCity?.name || 'Selected City'}
            />
          </section>
        )}

        {/* Trace Gases & Secondary Pollutant Breakdown */}
        {current && !errorMessage && (
          <section>
            <PollutantBreakdown current={current} />
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 3: ENVIRONMENTAL ANALYSIS MODULE                     */}
        {/* ========================================================= */}
        {analysisData && !errorMessage && (
          <section className="space-y-6 pt-4 border-t border-emerald-950/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-300">
                  Environmental Analysis Engine
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-1.5">
                  Multi-Criteria Scoring, Trends & Urban Insights
                </h2>
              </div>
              <span className="text-xs text-emerald-400/60 font-mono">
                {selectedCity?.name}, {selectedCity?.country}
              </span>
            </div>

            {/* 1. Environmental Indicator Score Card */}
            <EnvironmentalScoringCard scoring={analysisData.scoring} />

            {/* 2. Historical Trend Analysis (7, 14, 30 days) */}
            <HistoricalTrendsView
              analysisData={analysisData}
              currentDays={analysisPeriodDays}
              onSelectDays={handleSelectPeriod}
              isLoading={loadingAnalysis}
            />

            {/* 3. Measured Insights & Action Recommendations */}
            <InsightsAndRecommendations
              insights={analysisData.insights}
              recommendations={analysisData.recommendations}
            />
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 4: MACHINE LEARNING & PREDICTION CENTRE              */}
        {/* ========================================================= */}
        <section className="space-y-6 pt-4 border-t border-emerald-950/70">
          <PredictionCenter
            predictionData={predictionData}
            cityName={selectedCity?.name || 'Selected City'}
            isLoading={loadingPrediction}
            onRetrain={handleRetrainPrediction}
          />
        </section>

        {/* SQLite Database Telemetry Records & Engine Diagnostics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-emerald-950/70">
          <DatabaseSavedCities
            savedCities={savedCities}
            onSelectCity={(city) => {
              setSelectedCity(city);
              loadCityData(city);
            }}
            currentCityId={selectedCity?.id}
            currentCityCoordinates={{ lat: selectedCity?.latitude, lon: selectedCity?.longitude }}
          />
          <BackendStatusPanel
            healthData={backendHealth}
            error={null}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/80 bg-[#05100b] py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/60 gap-3">
          <div>
            <strong className="text-emerald-300 font-medium">EcoVision</strong> – City Environmental Monitoring, Analysis and Prediction System
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span>Open-Meteo APIs</span>
            <span>•</span>
            <span>Copernicus CAMS</span>
            <span>•</span>
            <span>Pandas & NumPy Analysis</span>
            <span>•</span>
            <span>SQLite3</span>
            <span>•</span>
            <span>React + Recharts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
