import type {CreateUserRequest} from "@umt/shared/dto/user";
import type {AxiosInstance} from "axios";

export const createUserApi = (httpClient: AxiosInstance) => ({
  create: (request: CreateUserRequest) =>
      httpClient.post('/api/core/user/create', request),
});