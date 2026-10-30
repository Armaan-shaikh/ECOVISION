/**
 * EcoVision API Client
 * Manages frontend-to-backend communication with Flask API endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Check backend and database health
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Search for cities using Open-Meteo Geocoding via Flask backend
 */
export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  const encoded = encodeURIComponent(query.trim());
  const response = await fetch(`${API_BASE_URL}/cities/search?q=${encoded}`);
  if (!response.ok) {
    throw new Error(`City search failed with status: ${response.status}`);
  }
  const data = await response.json();
  return data.results || [];
}

/**
 * Fetch real weather and air quality observations for a city from Open-Meteo
 */
export async function fetchCityEnvironmentalData(city) {
  const params = new URLSearchParams({
    lat: city.latitude,
    lon: city.longitude,
    name: city.name || '',
    state: city.state || '',
    country: city.country || '',
    country_code: city.country_code || '',
    timezone: city.timezone || 'auto',
  });

  const response = await fetch(`${API_BASE_URL}/environmental/data?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch environmental data (${response.status})`);
  }
  return await response.json();
}

/**
 * Fetch Environmental Analysis: indicator scoring, multi-day historical trends,
 * rule-based insights, and targeted recommendations.
 */
export async function fetchEnvironmentalAnalysis(city, days = 7) {
  const params = new URLSearchParams({
    lat: city.latitude,
    lon: city.longitude,
    days: days.toString(),
    name: city.name || '',
    state: city.state || '',
    country: city.country || '',
    timezone: city.timezone || 'auto',
  });

  const response = await fetch(`${API_BASE_URL}/environmental/analysis?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch environmental analysis (${response.status})`);
  }
  return await response.json();
}

/**
 * Fetch Machine Learning Environmental Prediction: 6-month temperature forecast,
 * Random Forest vs seasonal baseline evaluation, and feature importances.
 */
export async function fetchCityPrediction(city, forceRetrain = false) {
  const params = new URLSearchParams({
    lat: city.latitude,
    lon: city.longitude,
    name: city.name || '',
    state: city.state || '',
    country: city.country || '',
    country_code: city.country_code || '',
    timezone: city.timezone || 'auto',
    city_id: city.id ? city.id.toString() : '',
    retrain: forceRetrain ? 'true' : 'false',
  });

  const response = await fetch(`${API_BASE_URL}/environmental/prediction?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData && (errorData.status === 'unavailable' || errorData.message)) {
      return errorData;
    }
    throw new Error(errorData.message || `Failed to fetch prediction models (${response.status})`);
  }
  return await response.json();
}

/**
 * Retrieve saved cities from SQLite database
 */
export async function fetchSavedCities() {
  const response = await fetch(`${API_BASE_URL}/cities/saved`);
  if (!response.ok) {
    throw new Error(`Failed to load saved cities (${response.status})`);
  }
  const data = await response.json();
  return data.cities || [];
}
