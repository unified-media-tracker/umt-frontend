import { createHttpClient } from '@umt/api';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

let accessTokenProvider: () => string | null = () => null;

export const setAccessTokenProvider = (provider: () => string | null) => {
  accessTokenProvider = provider;
};

export const apiClient = createHttpClient({
  baseURL,
  getAccessToken: () => accessTokenProvider(),
});
