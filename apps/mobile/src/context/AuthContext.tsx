import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery, exchangeCodeAsync, TokenResponse } from 'expo-auth-session';
import { jwtDecode } from 'jwt-decode';
import type { AuthState, UserSession } from '@umt/shared/types/auth';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType extends AuthState {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const keycloakConfig = {
    discoveryUrl: (process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://10.0.2.2:8180') + '/realms/' + (process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'umt'),
    clientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'umt-mobile',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        console.log('Keycloak discoveryUrl:', keycloakConfig.discoveryUrl);
    }, []);

    const discovery = useAutoDiscovery(keycloakConfig.discoveryUrl);
    const redirectUri = makeRedirectUri({
        scheme: 'umt-mobile',
        path: 'auth',
    });

    const [auth, setAuth] = useState<AuthState>({
        isAuthenticated: false,
        isInitializing: true,
        session: null,
        token: null,
    });

    const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: keycloakConfig.clientId,
            redirectUri,
            scopes: ['openid', 'profile', 'email'],
        },
        discovery
    );

    const handleTokenResponse = useCallback((tokenRes: TokenResponse) => {
        const decoded: any = jwtDecode(tokenRes.accessToken);
        const session: UserSession = {
            keycloakId: decoded.sub || '',
            username: decoded.preferred_username || '',
            email: decoded.email || '',
            roles: decoded.realm_access?.roles || [],
        };

        setAuth({
            isAuthenticated: true,
            isInitializing: false,
            session,
            token: tokenRes.accessToken,
        });
        setTokenResponse(tokenRes);
    }, []);

    const login = async () => {
        const result = await promptAsync();
        if (result.type === 'success') {
            const { code } = result.params;
            if (discovery) {
                const tokenRes = await exchangeCodeAsync({
                    clientId: keycloakConfig.clientId,
                    code,
                    redirectUri,
                    extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
                }, discovery);
                handleTokenResponse(tokenRes);
            }
        }
    };

    const logout = async () => {
        setAuth({
            isAuthenticated: false,
            isInitializing: false,
            session: null,
            token: null,
        });
        setTokenResponse(null);
    };

    const getToken = () => auth.token;

    useEffect(() => {
        if (discovery) {
            setAuth(prev => ({ ...prev, isInitializing: false }));
        }
    }, [discovery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAuth(prev => {
                if (prev.isInitializing) {
                    console.error(
                        'Keycloak discovery timeout.',
                        keycloakConfig.discoveryUrl
                    );
                    return { ...prev, isInitializing: false };
                }
                return prev;
            });
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AuthContext.Provider value={{ ...auth, login, logout, getToken }}>
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