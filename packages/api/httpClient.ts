import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface HttpClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
}

export function createHttpClient(config: HttpClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
  });

  instance.interceptors.request.use((axiosConfig) => {
    if (config.getAccessToken) {
      const token = config.getAccessToken();
      if (token) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
    }
    return axiosConfig;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}
