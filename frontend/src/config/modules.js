/**
 * ECOVISION Academic Module Registry
 * Authoritative module definitions for Phase 1 Academic Interface.
 * Ordered strictly per project specification.
 */
import { 
  LayoutDashboard, 
  MapPin, 
  Radio, 
  Activity, 
  Gauge, 
  LineChart, 
  Cpu, 
  Database, 
  Server 
} from 'lucide-react';

export const ACADEMIC_MODULES = [
  {
    id: 'module-01',
    number: '01',
    code: 'MOD-01',
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    icon: LayoutDashboard,
    category: 'System Core',
    description: 'Central integrated environmental monitoring, analysis and predictive observation workspace.',
    academicObjectives: [
      'Real-time synthesis of meteorological NWP observations and atmospheric aerosol models.',
      'Comprehensive urban environmental health indexing and air quality category classification.',
      'Unified executive telemetry display and multi-tier parameter visualization.'
    ]
  },
  {
    id: 'module-02',
    number: '02',
    code: 'MOD-02',
    title: 'Location Selection',
    shortTitle: 'Location Selection',
    icon: MapPin,
    category: 'Spatial Domain',
    description: 'Global municipal geocoding, coordinate resolution, and spatial target parameterization.',
    academicObjectives: [
      'Multi-region municipal geocoding query interface powered by Open-Meteo spatial index.',
      'Geographic boundary resolution, latitude/longitude parameterization, and timezone alignment.',
      'Spatial telemetry routing and persistent municipality observation tracking.'
    ]
  },
  {
    id: 'module-03',
    number: '03',
    code: 'MOD-03',
    title: 'Data Acquisition',
    shortTitle: 'Data Acquisition',
    icon: Radio,
    category: 'Data Engineering',
    description: 'Multi-source telemetry ingestion: CPCB CAAQMS ground monitors & Copernicus CAMS atmospheric models.',
    academicObjectives: [
      'In situ ground telemetry acquisition from continuous ambient air quality monitoring stations (CAAQMS).',
      'Spatial numerical integration of regional 0.1° Copernicus Atmosphere Monitoring Service (CAMS) grids.',
      'Sensor discrepancy analysis, completeness verification, and data validation protocols.'
    ]
  },
  {
    id: 'module-04',
    number: '04',
    code: 'MOD-04',
    title: 'Environmental Monitoring',
    shortTitle: 'Environmental Monitoring',
    icon: Activity,
    category: 'Observations',
    description: 'Real-time criteria air pollutants (PM2.5, PM10, NO2, SO2, CO, O3) and NWP meteorological telemetry.',
    academicObjectives: [
      'Real-time continuous measurement of respirable and fine particulate matter fractions.',
      'Secondary gaseous pollutant concentration profiling against WHO and EPA threshold baselines.',
      'Micro-climate atmospheric parameter logging: surface 2m temperature, relative humidity, and precipitation.'
    ]
  },
  {
    id: 'module-05',
    number: '05',
    code: 'MOD-05',
    title: 'Environmental Analysis',
    shortTitle: 'Environmental Analysis',
    icon: Gauge,
    category: 'Analytics',
    description: 'Multi-criteria environmental indicator scoring, index weighting, and rule-based diagnostic insights.',
    academicObjectives: [
      'Multi-criteria weighted index computation integrating air quality, thermal comfort, moisture, and rainfall.',
      'Algorithmic diagnosis of dominant environmental stressors and atmospheric anomalies.',
      'Deterministic rule-based public health guidance and urban mitigation strategy generation.'
    ]
  },
  {
    id: 'module-06',
    number: '06',
    code: 'MOD-06',
    title: 'Historical Analysis',
    shortTitle: 'Historical Analysis',
    icon: LineChart,
    category: 'Analytics',
    description: 'Longitudinal variance, multi-day historical distributions (7, 14, 30 days), and statistical trend evaluation.',
    academicObjectives: [
      'Multi-day longitudinal time-series evaluation over 7-day, 14-day, and 30-day temporal windows.',
      'Statistical distribution profiling: rolling period averages, extrema detection, and diurnal fluctuations.',
      'Historical variance correlation between meteorological dynamics and criteria pollutant concentrations.'
    ]
  },
  {
    id: 'module-07',
    number: '07',
    code: 'MOD-07',
    title: 'Prediction System',
    shortTitle: 'Prediction System',
    icon: Cpu,
    category: 'Machine Learning',
    description: 'Machine learning forecasting models (Random Forest regression vs seasonal baseline) with feature importance.',
    academicObjectives: [
      'Multi-month meteorological trajectory projection utilizing historical longitudinal telemetry.',
      'Ensemble machine learning regression (Random Forest) benchmarked against baseline persistence models.',
      'Feature importance attribution, cross-validation metrics (MAE, RMSE, R²), and on-demand model fitting.'
    ]
  },
  {
    id: 'module-08',
    number: '08',
    code: 'MOD-08',
    title: 'Saved Records',
    shortTitle: 'Saved Records',
    icon: Database,
    category: 'Storage',
    description: 'SQLite persistence archive, municipality observation history, and recorded environmental telemetry.',
    academicObjectives: [
      'Relational telemetry persistence utilizing embedded SQLite3 database engine.',
      'Spatial record auditing, cached environmental observation indexing, and rapid municipality recall.',
      'Audit logging of temporal queries and empirical sensor observations.'
    ]
  },
  {
    id: 'module-09',
    number: '09',
    code: 'MOD-09',
    title: 'System Information',
    shortTitle: 'System Information',
    icon: Server,
    category: 'System Diagnostics',
    description: 'Computational analytics stack diagnostics, Flask microservice runtime status, and database connectivity.',
    academicObjectives: [
      'Microservice infrastructure health inspection: Python Flask REST API runtime state.',
      'Database connectivity and schema validation: SQLite3 relational repository verification.',
      'Computational analytical dependency verification: NumPy, Pandas, Scikit-learn, and Open-Meteo client status.'
    ]
  }
];

export function getModuleById(moduleId) {
  return ACADEMIC_MODULES.find(m => m.id === moduleId) || ACADEMIC_MODULES[0];
}
