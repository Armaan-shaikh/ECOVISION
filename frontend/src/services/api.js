/**
 * EcoVision API Client
 * Manages frontend-to-backend communication with Flask API endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Extract human-readable error messages with friendly guidance for offline backends.
 */
async function extractErrorMessage(response, defaultMsg) {
  try {
    const errorData = await response.json();
    if (errorData && errorData.message) {
      return errorData.message;
    }
  } catch {
    // Non-JSON response
  }
  if (response.status === 502 || response.status === 504) {
    return 'Flask backend is offline or unreachable on port 5001. Please run "run_backend.bat" or "python backend/run.py".';
  }
  return `${defaultMsg} (${response.status})`;
}

/**
 * Check backend and database health
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    const msg = await extractErrorMessage(response, 'Health check failed');
    throw new Error(msg);
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
    const msg = await extractErrorMessage(response, 'City search failed');
    throw new Error(msg);
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
    const msg = await extractErrorMessage(response, 'Failed to fetch environmental data');
    throw new Error(msg);
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
    const msg = await extractErrorMessage(response, 'Failed to fetch environmental analysis');
    throw new Error(msg);
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
    const msg = await extractErrorMessage(response, 'Failed to fetch prediction models');
    throw new Error(msg);
  }
  return await response.json();
}

/**
 * Retrieve saved cities from SQLite database
 */
export async function fetchSavedCities() {
  const response = await fetch(`${API_BASE_URL}/cities/saved`);
  if (!response.ok) {
    const msg = await extractErrorMessage(response, 'Failed to load saved cities');
    throw new Error(msg);
  }
  const data = await response.json();
  return data.cities || [];
}

/**
 * Retrieve stored historical observations from SQLite database for a city or all cities
 */
export async function fetchCityObservations(city = null, limit = 100) {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });
  if (city && !city.all) {
    if (city.record_id) {
      params.set('record_id', city.record_id.toString());
    }
    if (city.id) {
      params.set('city_id', city.id.toString());
    }
    if (city.latitude !== undefined && city.latitude !== null) {
      params.set('lat', city.latitude.toString());
    }
    if (city.longitude !== undefined && city.longitude !== null) {
      params.set('lon', city.longitude.toString());
    }
  }

  const response = await fetch(`${API_BASE_URL}/environmental/observations?${params.toString()}`);
  if (!response.ok) {
    const msg = await extractErrorMessage(response, 'Failed to load SQLite observations');
    throw new Error(msg);
  }
  const data = await response.json();
  return data.observations || [];
}
