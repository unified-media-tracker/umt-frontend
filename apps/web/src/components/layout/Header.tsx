import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { MediaItemResponse } from '@umt/shared/dto/media';
import { useAuth } from '../../context/AuthContext';
import { mediaApi } from '../../lib/api';
import { posterGradient, posterInitials } from '../../lib/posterPlaceholder';
import { CloseIcon, SearchIcon } from '../icons';
import styles from './Header.module.css';

const COMING_SOON = ['Home', 'TV', 'Games', 'Books', 'Music'] as const;

export function Header() {
    const { isAuthenticated, session, login } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MediaItemResponse[]>([]);

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
    };

    useEffect(() => {
        if (!searchOpen) return;
        inputRef.current?.focus();
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && closeSearch();
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchOpen]);

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            mediaApi
                .search(trimmed, 'MOVIE')
                .then((res) => setResults(res.data))
                .catch(() => setResults([]));
        }, 200);
        return () => clearTimeout(timeout);
    }, [query]);

    const goToResult = (id: string) => {
        closeSearch();
        navigate(`/movies/${id}`);
    };

    return (
        <>
            <header className={styles.mast}>
                <div className={`wrap ${styles.mastRow}`}>
                    <div className={styles.brand}>
                        <Link to="/movies">UMT</Link>
                    </div>
                    <nav className={styles.nav} aria-label="Media types">
                        <span className={styles.navComingSoon} aria-disabled="true" title="Coming soon">
                            {COMING_SOON[0]}
                        </span>
                        <button type="button" onClick={() => setSearchOpen(true)} aria-haspopup="dialog">
                            Search
                        </button>
                        <NavLink to="/movies" className={({ isActive }) => (isActive ? styles.navCurrent : undefined)}>
                            Movies
                        </NavLink>
                        {COMING_SOON.slice(1).map((item) => (
                            <span key={item} className={styles.navComingSoon} aria-disabled="true" title="Coming soon">
                                {item}
                            </span>
                        ))}
                    </nav>
                    <div className={styles.mastRight}>
                        {isAuthenticated ? (
                            <div className={styles.acct}>
                                <b>{session?.username}</b>
                            </div>
                        ) : (
                            <button type="button" className={styles.signIn} onClick={login}>
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {searchOpen && (
                <div className={styles.scrim} onClick={closeSearch}>
                    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.field}>
                            <SearchIcon size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search movies, directors…"
                                aria-label="Search movies"
                            />
                            <button type="button" className={styles.closeBtn} onClick={closeSearch} aria-label="Close search">
                                <CloseIcon />
                            </button>
                        </div>
                        {!query.trim() && <div className={styles.hint}>Try a title or a director</div>}
                        {query.trim() && results.length > 0 && (
                            <div className={styles.results}>
                                {results.map((r) => (
                                    <button key={r.id} type="button" className={styles.resultRow} onClick={() => goToResult(r.id)}>
                                        <span className={styles.posterSm} style={{ background: posterGradient(r.id) }}>
                                            {posterInitials(r.title)}
                                        </span>
                                        <span>
                                            <b>{r.title}</b>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {query.trim() && results.length === 0 && <div className={styles.empty}>No matches for "{query}"</div>}
                    </div>
                </div>
            )}
        </>
    );
}
