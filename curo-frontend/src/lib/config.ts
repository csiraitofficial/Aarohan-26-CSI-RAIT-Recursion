/**
 * API Configuration
 * Centralizes all backend API URLs
 */

const isDevelopment = import.meta.env.MODE === "development";

// Base URL for API calls
export const API_BASE_URL = isDevelopment
  ? "http://localhost:3000"
  : import.meta.env.VITE_API_BASE_URL || "https://curo-156q.onrender.com";

// Auth endpoints
export const AUTH_ENDPOINTS = {
  register: `${API_BASE_URL}/api/auth/register`,
  google: `${API_BASE_URL}/api/auth/google`,
  login: `${API_BASE_URL}/api/auth/login`,
};

// Appointments endpoints
export const APPOINTMENTS_ENDPOINTS = {
  providers: `${API_BASE_URL}/api/appointments/providers`,
  get: (email: string) =>
    `${API_BASE_URL}/api/appointments?email=${encodeURIComponent(email)}`,
  book: (email: string) =>
    `${API_BASE_URL}/api/appointments/book?email=${encodeURIComponent(email)}`,
  update: (id: string) => `${API_BASE_URL}/api/appointments/${id}`,
  recent: `${API_BASE_URL}/api/appointments/recent`,
  slots: (startDate: string, days: number, providerId: string) =>
    `${API_BASE_URL}/api/appointments/slots?startDate=${startDate}&days=${days}&providerId=${providerId}`,
  checkPatient: (email: string) =>
    `${API_BASE_URL}/api/appointments/patients/check?email=${encodeURIComponent(email)}`,
  createPatient: (providerId: number) =>
    `${API_BASE_URL}/api/appointments/patients?providerid=${providerId}`,
};

// Health records endpoints
export const HEALTH_ENDPOINTS = {
  records: `${API_BASE_URL}/api/health-records`,
};

// Medicine endpoints
export const MEDICINE_ENDPOINTS = {
  reminders: `${API_BASE_URL}/api/medicine-reminder`,
  reminder: (id: string) => `${API_BASE_URL}/api/medicine-reminder/${id}`,
  search: (query: string) =>
    `${API_BASE_URL}/api/medicine-search?query=${encodeURIComponent(query)}`,
  updateFcmToken: `${API_BASE_URL}/api/users/update-fcm-token`,
};

// Premium predictor endpoints
export const PREMIUM_ENDPOINTS = {
  predict: `${API_BASE_URL}/api/premium-predictor/predict`,
};

// Maps endpoints
export const MAPS_ENDPOINTS = {
  hospitals: (lat: number, lng: number, radius: number) =>
    `${API_BASE_URL}/api/maps/nearby-hospitals?lat=${lat}&lng=${lng}&radius=${radius}`,
  doctors: (lat: number, lng: number, radius: number) =>
    `${API_BASE_URL}/api/maps/nearby-doctor?lat=${lat}&lng=${lng}&radius=${radius}`,
  pharmacies: (lat: number, lng: number, radius: number) =>
    `${API_BASE_URL}/api/maps/nearby-pharmacy?lat=${lat}&lng=${lng}&radius=${radius}`,
  doctorType: (lat: number, lng: number, radius: number, keyword: string) =>
    `${API_BASE_URL}/api/maps/nearby-doctor-type?lat=${lat}&lng=${lng}&radius=${radius}&keyword=${keyword}`,
  nearby: (type: string, lat: number, lng: number, radius: number) =>
    `${API_BASE_URL}/api/maps/nearby-${type}?lat=${lat}&lng=${lng}&radius=${radius}`,
};

// User endpoints
export const USER_ENDPOINTS = {
  fetchUser: `${API_BASE_URL}/api/fetch-user`,
  updateProfile: `${API_BASE_URL}/api/update-profile`,
};
