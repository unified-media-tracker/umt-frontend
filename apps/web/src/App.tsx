import "./App.css";
import React, { useEffect } from 'react';
import { useAuth } from "./context/AuthContext";
import { setAccessTokenProvider } from "./lib/apiClient";
import { createUserApi } from '@umt/api';
import { apiClient } from './lib/apiClient';

const userApi = createUserApi(apiClient);

function App() {
    const { isAuthenticated, isInitializing, session, login, logout, getToken } = useAuth();

    useEffect(() => {
        setAccessTokenProvider(getToken);
    }, [getToken]);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && session) {
                try {
                    console.log('Syncing user with backend...');
                    await userApi.create({
                        keycloakId: session.keycloakId,
                        username: session.username,
                        email: session.email,
                        avatarUrl: '',
                    });
                    console.log('User synced successfully');
                } catch (error) {
                    console.error('Failed to sync user:', error);
                }
            }
        };

        syncUser();
    }, [isAuthenticated, session]);

    if (isInitializing) {
        return <div>Initializing...</div>;
    }

    return (
        <main className="app">
            <h1>UMT</h1>
            <p>Unified Media Tracker</p>

            <header style={{ marginBottom: '20px' }}>
                {isAuthenticated ? (
                    <div>
                        <p>Welcome, {session?.username}!</p>
                        <button onClick={logout}>Logout</button>
                    </div>
                ) : (
                    <button onClick={login}>Login</button>
                )}
            </header>

            {isAuthenticated ? (
                <section>
                    <p>You are logged in and synced!</p>
                </section>
            ) : (
                <p>Please login to start.</p>
            )}
        </main>
    );
}

export default App;
