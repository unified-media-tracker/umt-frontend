export interface UserResponse {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
}

export interface CreateUserRequest {
    keycloakId: string;
    username: string;
    email: string;
    avatarUrl?: string;
}