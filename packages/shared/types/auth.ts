export type AccessTokenProvider = () => string | null;

export interface UserSession {
    keycloakId: string;
    username: string;
    email: string;
    roles: string[];
}

export interface AuthState {
    isAuthenticated: boolean;
    isInitializing: boolean;
    session: UserSession | null;
    token: string | null;
}
