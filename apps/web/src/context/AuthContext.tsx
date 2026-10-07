import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';
import type { AuthState, UserSession } from '@umt/shared/types/auth';

interface AuthContextType extends AuthState {
    login: () => Promise<void>;
    register: () => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const keycloakConfig = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'umt',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'umt-frontend',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>({
        isAuthenticated: false,
        isInitializing: true,
        session: null,
        token: null,
    });

    const keycloakRef = useRef<Keycloak | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initKeycloak = async () => {
            console.log('Starting Keycloak initialization...');
            const keycloak = new Keycloak(keycloakConfig);
            keycloakRef.current = keycloak;

            keycloak.onReady = (authenticated) => console.log('Keycloak Ready Event:', authenticated);
            keycloak.onAuthSuccess = () => console.log('Keycloak Auth Success Event');
            keycloak.onAuthError = (err) => console.error('Keycloak Auth Error Event:', err);
            keycloak.onAuthRefreshSuccess = () => console.log('Keycloak Auth Refresh Success Event');
            keycloak.onAuthRefreshError = () => console.error('Keycloak Auth Refresh Error Event');
            keycloak.onTokenExpired = () => console.log('Keycloak Token Expired Event');

            try {
                const authenticated = await keycloak.init({
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                    pkceMethod: 'S256',
                    redirectUri: window.location.origin + '/',
                    checkLoginIframe: false,
                    enableLogging: true,
                });
                console.log('Keycloak initialized. Authenticated:', authenticated);

                if (authenticated) {
                    const session: UserSession = {
                        keycloakId: keycloak.subject || '',
                        username: keycloak.tokenParsed?.preferred_username || '',
                        email: keycloak.tokenParsed?.email || '',
                        roles: (keycloak.tokenParsed?.realm_access?.roles as string[]) || [],
                    };

                    setAuth({
                        isAuthenticated: true,
                        isInitializing: false,
                        session,
                        token: keycloak.token || null,
                    });
                } else {
                    setAuth(prev => ({ ...prev, isInitializing: false }));
                }
            } catch (error) {
                console.error('Failed to initialize Keycloak', error);
                setAuth(prev => ({ ...prev, isInitializing: false }));
            }
        };

        initKeycloak();
    }, []);

    const login = async () => {
        console.log('Logging in...');
        try {
            await keycloakRef.current?.login({
                redirectUri: window.location.origin + '/',
            });
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const register = async () => {
        console.log('Registering...');
        try {
            await keycloakRef.current?.register({
                redirectUri: window.location.origin + '/',
            });
        } catch (error) {
            console.error('Registration failed', error);
        }
    };

    const logout = async () => {
        await keycloakRef.current?.logout();
    };

    const getToken = () => keycloakRef.current?.token || null;

    return (
        <AuthContext.Provider value={{ ...auth, login, register, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
