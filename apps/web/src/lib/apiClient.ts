import { createHttpClient } from '@umt/api';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let accessTokenProvider: () => string | null = () => null;

export const setAccessTokenProvider = (provider: () => string | null) => {
  accessTokenProvider = provider;
};

export const apiClient = createHttpClient({
  baseURL,
  getAccessToken: () => accessTokenProvider(),
});
