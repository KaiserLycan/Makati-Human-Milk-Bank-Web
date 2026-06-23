import axios from 'axios';

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://makati-human-milk-bank-api.onrender.com';
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
