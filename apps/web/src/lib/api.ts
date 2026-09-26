import { createMediaApi, createUserApi } from '@umt/api';
import { apiClient } from './apiClient';

export const userApi = createUserApi(apiClient);
export const mediaApi = createMediaApi(apiClient);
