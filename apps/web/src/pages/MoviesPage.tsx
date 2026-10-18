import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MovieResponse, ReleaseStatus, TrendDirection } from '@umt/shared/dto/media';
import { mediaApi } from '../lib/api';
import { posterGradient, posterInitials } from '../lib/posterPlaceholder';
import { BookmarkIcon } from '../components/icons';
import styles from './MoviesPage.module.css';

type SortKey = 'DATE' | 'RISK' | 'POP';
type StatusFilter = 'ALL' | ReleaseStatus;
type RiskLevel = 'low' | 'mid' | 'high' | '';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'ANNOUNCED', label: 'Announced' },
    { key: 'RUMORED', label: 'Rumored' },
    { key: 'DELAYED', label: 'Delayed' },
    { key: 'TBA', label: 'TBA' },
    { key: 'RELEASED', label: 'Released' },
];

const SORTS: { key: SortKey; label: string }[] = [
    { key: 'DATE', label: 'Soonest' },
    { key: 'RISK', label: 'Delay risk' },
    { key: 'POP', label: 'Popularity' },
];

const STATUS_LABEL: Record<ReleaseStatus, string> = {
    TBA: 'TBA',
    ANNOUNCED: 'Announced',
    RUMORED: 'Rumored',
    CONFIRMED: 'Confirmed',
    DELAYED: 'Delayed',
    RELEASED: 'Released',
    CANCELED: 'Canceled',
};

const TREND_ARROW: Record<TrendDirection, string> = { RISING: '↑', FALLING: '↓', STABLE: '→' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FAR_FUTURE = '9999-12-31';

// The list window opens on the first of the current month: films that already landed this month
// stay visible as Released next to everything still to come, and the back catalogue stays out.
function startOfCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// "Not out yet" - what the spotlight, the Upcoming count and the delay signal are about.
const isUpcoming = (m: MovieResponse) => m.releaseDateStatus !== 'RELEASED' && m.releaseDateStatus !== 'CANCELED';

function riskClass(p: number | null | undefined): RiskLevel {
    if (p == null) return '';
    if (p < 35) return 'low';
    if (p < 65) return 'mid';
    return 'high';
}

function signalText(p: number | null | undefined, trend: TrendDirection | null | undefined) {
    if (p == null) return 'No signal yet';
    return `${p}% ${trend ? TREND_ARROW[trend] : ''}`.trim();
}

function dateParts(iso: string | null | undefined) {
    if (!iso) return { day: 'TBA', mon: '' };
    const d = new Date(`${iso}T00:00:00Z`);
    return { day: String(d.getUTCDate()).padStart(2, '0'), mon: MONTHS[d.getUTCMonth()].slice(0, 3).toUpperCase() };
}

function fullDateLabel(iso: string) {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${DOWS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
}

function shortDateLabel(iso: string) {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}

function formatRuntime(minutes: number | null | undefined) {
    if (!minutes) return null;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function daysUntil(iso: string) {
    const target = new Date(`${iso}T00:00:00Z`).getTime();
    return Math.round((target - Date.now()) / 86_400_000);
}

export function MoviesPage() {
    const [movies, setMovies] = useState<MovieResponse[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [sort, setSort] = useState<SortKey>('DATE');
    const [tracked, setTracked] = useState<ReadonlySet<string>>(new Set());

    useEffect(() => {
        let cancelled = false;
        mediaApi
            .list({ mediaCategory: 'MOVIE', releaseDateFrom: startOfCurrentMonth() })
            .then((res) => !cancelled && setMovies(res.data))
            .catch(() => !cancelled && setLoadError('Could not load upcoming movies.'));
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleTracked = (id: string) => {
        setTracked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const feature = useMemo(() => {
        if (!movies) return null;
        return [...movies].filter((m) => m.releaseDate && isUpcoming(m)).sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!))[0] ?? null;
    }, [movies]);

    const filteredAndSorted = useMemo(() => {
        if (!movies) return [];
        const byStatus = status === 'ALL' ? movies : movies.filter((m) => m.releaseDateStatus === status);
        const sorters: Record<SortKey, (a: MovieResponse, b: MovieResponse) => number> = {
            DATE: (a, b) => (a.releaseDate ?? FAR_FUTURE).localeCompare(b.releaseDate ?? FAR_FUTURE),
            // a film that's already out has no delay to rank
            RISK: (a, b) => (isUpcoming(b) ? b.latestDelayProbability ?? -1 : -2) - (isUpcoming(a) ? a.latestDelayProbability ?? -1 : -2),
            POP: (a, b) => b.popularityScore - a.popularityScore,
        };
        return [...byStatus].sort(sorters[sort]);
    }, [movies, status, sort]);

    const groups = useMemo(() => {
        const byDate = sort === 'DATE';
        const order: string[] = [];
        const map = new Map<string, MovieResponse[]>();
        for (const m of filteredAndSorted) {
            const key = byDate ? (m.releaseDate ? m.releaseDate.slice(0, 7) : 'TBA') : 'ALL';
            if (!map.has(key)) {
                map.set(key, []);
                order.push(key);
            }
            map.get(key)!.push(m);
        }
        return order.map((key) => {
            const items = map.get(key)!;
            const label = !byDate
                ? sort === 'RISK'
                    ? 'Highest delay risk first'
                    : 'Most anticipated first'
                : key === 'TBA'
                  ? 'Date to be announced'
                  : `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
            return { key, label, items, countLabel: `${items.length} ${items.length === 1 ? 'film' : 'films'}` };
        });
    }, [filteredAndSorted, sort]);

    if (loadError) {
        return (
            <div className="wrap">
                <div className={styles.empty}>
                    <b>Something went wrong</b>
                    {loadError}
                </div>
            </div>
        );
    }

    if (!movies) {
        return <div className={styles.loading}>Loading upcoming movies…</div>;
    }

    const statCount = (predicate: (m: MovieResponse) => boolean) => movies.filter(predicate).length;

    return (
        <div className={styles.page}>
            <section className={`wrap ${styles.head}`}>
                <div>
                    <div className={styles.eyebrow}>Movies · synced daily from TMDB</div>
                    <h1>Out now. Up next.</h1>
                    <p>Every film still on its way, plus this month's releases, ordered by when they land. Each unreleased one carries an AI-read signal on how likely it is to slip.</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <b>{statCount(isUpcoming)}</b>
                        <span>Upcoming</span>
                    </div>
                    <div className={styles.stat}>
                        <b>{statCount((m) => m.releaseDateStatus === 'RUMORED')}</b>
                        <span>Rumored</span>
                    </div>
                    <div className={styles.stat}>
                        <b>{statCount((m) => m.releaseDateStatus === 'DELAYED')}</b>
                        <span>Delayed</span>
                    </div>
                </div>
            </section>

            {feature && <FeatureCard movie={feature} />}

            <section className="wrap">
                <div className={styles.bar}>
                    <div className={styles.chips} role="group" aria-label="Filter by release status">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                className={`${styles.chipBtn} ${status === f.key ? styles.on : ''}`}
                                aria-pressed={status === f.key}
                                onClick={() => setStatus(f.key)}
                            >
                                {f.label}
                                <i>{f.key === 'ALL' ? movies.length : statCount((m) => m.releaseDateStatus === f.key)}</i>
                            </button>
                        ))}
                    </div>
                    <div className={styles.sortBox}>
                        <small>Sort</small>
                        <div className={styles.seg} role="group" aria-label="Sort films">
                            {SORTS.map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={sort === s.key ? styles.on : ''}
                                    aria-pressed={sort === s.key}
                                    onClick={() => setSort(s.key)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.legend}>
                    <span><i style={{ background: 'var(--ontime)' }} />Under 35% · likely on time</span>
                    <span><i style={{ background: 'var(--rumor)' }} />35-65% · worth watching</span>
                    <span><i style={{ background: 'var(--delay)' }} />Over 65% · likely to slip</span>
                </div>

                {groups.map((g) => (
                    <div key={g.key} className={styles.grp}>
                        <div className={styles.grpHead}>
                            <h2>{g.label}</h2>
                            <span>{g.countLabel}</span>
                            <hr />
                        </div>
                        <div className={styles.grid}>
                            {g.items.map((m) => (
                                <MovieCard key={m.id} movie={m} tracked={tracked.has(m.id)} onToggleTracked={() => toggleTracked(m.id)} />
                            ))}
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <div className={styles.empty}>
                        <b>Nothing matches</b>
                        No films with that status right now. Try another filter.
                    </div>
                )}

                <footer className={styles.foot}>
                    <span className={styles.fbrand}>UMT · Unified Media Tracker</span>
                    <span>Film data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
                </footer>
            </section>
        </div>
    );
}

function FeatureCard({ movie }: { movie: MovieResponse }) {
    const { day, mon } = dateParts(movie.releaseDate);
    const director = movie.contributors.find((c) => c.role === 'DIRECTOR');
    const risk = riskClass(movie.latestDelayProbability);
    const inDays = movie.releaseDate ? daysUntil(movie.releaseDate) : null;

    return (
        <section className="wrap">
            <article className={styles.feature} style={{ background: movie.coverImageUrl ? undefined : posterGradient(`feature-${movie.id}`) }}>
                <div className={styles.fPoster} style={{ background: posterGradient(movie.id) }}>
                    {movie.coverImageUrl ? (
                        <img className={styles.posterImg} src={movie.coverImageUrl} alt="" loading="lazy" />
                    ) : (
                        <span className={styles.glyph}>{posterInitials(movie.title)}</span>
                    )}
                    <div className={styles.stub}>
                        <b>{day}</b>
                        <span>{mon}</span>
                    </div>
                </div>
                <div className={styles.fBody}>
                    <h2 className={styles.fTitle}>
                        <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
                    </h2>
                    <div className={styles.fMeta}>
                        {[director ? `Dir. ${director.name}` : 'Director TBA', formatRuntime(movie.runtimeMinutes), movie.ageRating].filter(Boolean).join(' · ')}
                    </div>
                    {movie.description && <p className={styles.fOver}>{movie.description}</p>}
                    <div className={styles.fFacts}>
                        <div className={styles.fFact}>
                            <small>Release{inDays != null ? ` · in ${inDays}d` : ''}</small>
                            <b>{movie.releaseDate ? fullDateLabel(movie.releaseDate) : 'To be announced'}</b>
                        </div>
                        <div className={styles.fFact}>
                            <small>Delay signal</small>
                            <b>{signalText(movie.latestDelayProbability, movie.latestConfidenceTrend)}</b>
                            <div className={`${styles.meter} ${risk ? styles[risk] : ''}`}>
                                <div className={`${styles.fill} ${risk ? styles[risk] : ''}`} style={{ width: `${movie.latestDelayProbability ?? 0}%` }} />
                            </div>
                        </div>
                        <div className={styles.fFact}>
                            <small>Status</small>
                            <b>{STATUS_LABEL[movie.releaseDateStatus]}</b>
                        </div>
                    </div>
                    <div className={styles.fActions}>
                        <Link to={`/movies/${movie.id}`} className={`${styles.btn} ${styles.btnGhost}`}>
                            Full details →
                        </Link>
                    </div>
                </div>
            </article>
        </section>
    );
}

function MovieCard({
    movie,
    tracked,
    onToggleTracked,
}: {
    movie: MovieResponse;
    tracked: boolean;
    onToggleTracked: () => void;
}) {
    const { day, mon } = dateParts(movie.releaseDate);
    const director = movie.contributors.find((c) => c.role === 'DIRECTOR');
    // a film that's already out has no delay left to signal
    const released = movie.releaseDateStatus === 'RELEASED';
    const risk = released ? '' : riskClass(movie.latestDelayProbability);

    return (
        <article className={styles.card}>
            <div className={styles.poster} style={{ background: posterGradient(movie.id) }}>
                {movie.coverImageUrl ? (
                    <img className={styles.posterImg} src={movie.coverImageUrl} alt="" loading="lazy" />
                ) : (
                    <span className={styles.glyph}>{posterInitials(movie.title)}</span>
                )}
                <button
                    type="button"
                    className={`${styles.track} ${tracked ? styles.on : ''}`}
                    aria-label={`Track ${movie.title}`}
                    aria-pressed={tracked}
                    onClick={onToggleTracked}
                >
                    <BookmarkIcon filled={tracked} />
                </button>
                <div className={styles.stub}>
                    <b>{day}</b>
                    <span>{mon}</span>
                </div>
            </div>
            <div>
                <h3 className={styles.title}>
                    <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
                </h3>
                <div className={styles.sub}>
                    {[director ? `Dir. ${director.name}` : 'Director TBA', formatRuntime(movie.runtimeMinutes), movie.ageRating].filter(Boolean).join(' · ')}
                </div>
                <div className={styles.gen}>{movie.genres.map((g) => g.name).join(', ')}</div>
            </div>
            <div className={styles.row}>
                <span className={`${styles.chip} ${styles[movie.releaseDateStatus.toLowerCase()] ?? ''}`}>{STATUS_LABEL[movie.releaseDateStatus]}</span>
                {movie.previousReleaseDate && <span className={styles.was}>was {shortDateLabel(movie.previousReleaseDate)}</span>}
            </div>
            <div className={styles.sig}>
                <div className={styles.sigTop}>
                    <span>Delay signal</span>
                    <b title={released ? 'Already released' : movie.latestConfidenceTrend ? `${movie.latestConfidenceTrend[0]}${movie.latestConfidenceTrend.slice(1).toLowerCase()} trend` : 'Not analysed yet'}>
                        {released ? 'Out now' : signalText(movie.latestDelayProbability, movie.latestConfidenceTrend)}
                    </b>
                </div>
                <div className={`${styles.meter} ${risk ? styles[risk] : ''}`}>
                    <div className={`${styles.fill} ${risk ? styles[risk] : ''}`} style={{ width: `${released ? 0 : movie.latestDelayProbability ?? 0}%` }} />
                </div>
            </div>
        </article>
    );
}
