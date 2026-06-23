import axios from 'axios';

const defaultRenderUrl = 'https://makati-human-milk-bank-api.onrender.com';
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || defaultRenderUrl;
export const API_BASE_URL = envApiUrl.replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let resolvedBaseUrl: string | null = null;

async function getDynamicBaseUrl(): Promise<string> {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  // In production or test environments, immediately resolve to the standard URL
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    resolvedBaseUrl = API_BASE_URL;
    return resolvedBaseUrl;
  }

  // During development, attempt to probe the local backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    
    await fetch('http://localhost:5000/health', {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    resolvedBaseUrl = 'http://localhost:5000';
  } catch (err) {
    resolvedBaseUrl = API_BASE_URL;
  }

  return resolvedBaseUrl;
}

// Request interceptor to set baseURL dynamically
api.interceptors.request.use(async (config) => {
  try {
    config.baseURL = await getDynamicBaseUrl();
  } catch (e) {
    config.baseURL = API_BASE_URL;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
