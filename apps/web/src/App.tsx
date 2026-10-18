import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { setAccessTokenProvider } from './lib/apiClient';
import { userApi } from './lib/api';
import { Header } from './components/layout/Header';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import styles from './App.module.css';

function App() {
    const { isAuthenticated, isInitializing, session, getToken } = useAuth();

    useEffect(() => {
        setAccessTokenProvider(getToken);
    }, [getToken]);

    useEffect(() => {
        if (!isAuthenticated || !session) return;
        userApi
            .create({
                keycloakId: session.keycloakId,
                username: session.username,
                email: session.email,
                avatarUrl: '',
            })
            .catch((error) => console.error('Failed to sync user:', error));
    }, [isAuthenticated, session]);

    if (isInitializing) {
        return <div className={styles.boot}>Loading UMT…</div>;
    }

    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Navigate to="/movies" replace />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/movies/:id" element={<MovieDetailPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
