import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { setAccessTokenProvider } from './src/lib/apiClient';
import { createUserApi } from '@umt/api';
import { apiClient } from './src/lib/apiClient';

const userApi = createUserApi(apiClient);

function Main() {
    const { isAuthenticated, isInitializing, session, login, logout, getToken } = useAuth();

    useEffect(() => {
        setAccessTokenProvider(getToken);
    }, [getToken]);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && session) {
                try {
                    console.log('Syncing user with backend (mobile)...');
                    await userApi.create({
                        keycloakId: session.keycloakId,
                        username: session.username,
                        email: session.email,
                        avatarUrl: '',
                    });
                    console.log('User synced successfully (mobile)');
                } catch (error) {
                    console.error('Failed to sync user (mobile):', error);
                }
            }
        };

        syncUser();
    }, [isAuthenticated, session]);

    if (isInitializing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Initializing Auth...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="auto" />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>UMT</Text>
                    <Text style={styles.subtitle}>Unified Media Tracker</Text>
                </View>

                <View style={styles.authSection}>
                    {isAuthenticated ? (
                        <View>
                            <Text style={styles.welcomeText}>Welcome, {session?.username}!</Text>
                            <Button title="Logout" onPress={logout} />
                        </View>
                    ) : (
                        <Button title="Login with Keycloak" onPress={login} />
                    )}
                </View>

                {isAuthenticated ? (
                    <View style={styles.syncStatus}>
                        <Text style={styles.syncStatusText}>You are logged in and synced!</Text>
                    </View>
                ) : (
                    <Text style={styles.infoText}>Please login to start.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

export function App() {
    return (
        <AuthProvider>
            <Main />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authSection: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
    },
    welcomeText: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
    },
    syncStatus: {
        padding: 20,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        marginTop: 10,
    },
    syncStatusText: {
        color: '#2e7d32',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    infoText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    }
});
