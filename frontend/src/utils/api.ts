/**
 * Utility for making API requests.
 * Uses VITE_API_URL if defined (for production), otherwise defaults to relative path (for local dev proxy).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
}
