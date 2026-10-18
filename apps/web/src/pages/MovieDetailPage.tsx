import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
    DelayHistoryPoint,
    EvidenceItemResponse,
    MovieDetailResponse,
    MovieListItemResponse,
    PurchaseLinkResponse,
    ReleaseStatusHistoryResponse,
    RumorSnapshotResponse,
} from '@umt/shared/dto/media';
import { mediaApi } from '../lib/api';
import { posterGradient, posterInitials } from '../lib/posterPlaceholder';
import { BookmarkIcon, PlayIcon } from '../components/icons';
import { DelayTrendChart } from '../components/DelayTrendChart';
import styles from './MovieDetailPage.module.css';

const STATUS_LABEL: Record<string, string> = {
    TBA: 'TBA',
    ANNOUNCED: 'Announced',
    RUMORED: 'Rumored',
    CONFIRMED: 'Confirmed',
    DELAYED: 'Delayed',
    RELEASED: 'Released',
    CANCELED: 'Canceled',
};

const STANCE_LABEL: Record<EvidenceItemResponse['stance'], string> = {
    SUPPORTS_DATE: 'Supports date',
    POINTS_TO_DELAY: 'Pointed to delay',
    NO_DATE_CLAIM: 'No date claim',
};

const STANCE_CLASS: Record<EvidenceItemResponse['stance'], string> = {
    SUPPORTS_DATE: styles.low,
    POINTS_TO_DELAY: styles.high,
    NO_DATE_CLAIM: '',
};

function riskClass(p: number): 'low' | 'mid' | 'high' {
    if (p < 35) return 'low';
    if (p < 65) return 'mid';
    return 'high';
}

function verdictCopy(p: number) {
    const level = riskClass(p);
    return {
        level,
        label: level === 'low' ? 'Low risk' : level === 'mid' ? 'Worth watching' : 'Likely to slip',
        sentence:
            level === 'low'
                ? 'Nothing in the press points away from the known date.'
                : level === 'mid'
                  ? 'Reports are mixed; the date could move.'
                  : 'Reports point to a later date.',
    };
}

function useCountdown(targetIso: string | null | undefined) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!targetIso) return;
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, [targetIso]);
    if (!targetIso) return null;
    const diff = new Date(`${targetIso}T00:00:00Z`).getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
    };
}

function fullDateLabel(iso: string) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(`${iso}T00:00:00Z`);
    return `${dows[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatRuntime(minutes: number | null | undefined) {
    if (!minutes) return null;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export function MovieDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<MovieDetailResponse | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [rumor, setRumor] = useState<RumorSnapshotResponse | null>(null);
    const [history, setHistory] = useState<DelayHistoryPoint[]>([]);
    const [evidence, setEvidence] = useState<EvidenceItemResponse[]>([]);
    const [statusHistory, setStatusHistory] = useState<ReleaseStatusHistoryResponse[]>([]);
    const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLinkResponse[]>([]);
    const [more, setMore] = useState<MovieListItemResponse[]>([]);
    const [tracked, setTracked] = useState(false);

    useEffect(() => {
        if (!id) return;
        setMovie(null);
        setNotFound(false);
        setTracked(false);

        // This page only ever deals in movies - passing the type lets the backend skip straight
        // to the movie table instead of trying all five in turn.
        mediaApi.getById(id, 'MOVIE').then((res) => setMovie(res.data)).catch(() => setNotFound(true));
        mediaApi.getRumorSnapshot(id).then((res) => setRumor(res.data)).catch(() => setRumor(null));
        mediaApi.getRumorHistory(id).then((res) => setHistory(res.data)).catch(() => setHistory([]));
        mediaApi.getEvidence(id).then((res) => setEvidence(res.data)).catch(() => setEvidence([]));
        mediaApi.getStatusHistory(id).then((res) => setStatusHistory(res.data)).catch(() => setStatusHistory([]));
        mediaApi.getPurchaseLinks(id).then((res) => setPurchaseLinks(res.data)).catch(() => setPurchaseLinks([]));
        // Real TMDb recommendations, filtered to titles already in our own catalog - can come
        // back thin or empty for a niche title, since UMT only tracks upcoming releases while
        // TMDb's recommendations aren't scoped to release status at all.
        mediaApi.getSimilar(id, 'MOVIE').then((res) => setMore(res.data)).catch(() => setMore([]));
    }, [id]);

    const countdown = useCountdown(movie?.releaseDate);

    if (notFound) {
        return (
            <div className="wrap">
                <p style={{ padding: '60px 0', color: 'var(--muted)' }}>
                    Couldn't find that title. <Link to="/movies">Back to Movies</Link>
                </p>
            </div>
        );
    }

    if (!movie) {
        return <div className={styles.loading}>Loading…</div>;
    }

    const director = movie.contributors.find((c) => c.role === 'DIRECTOR');
    const trailer = movie.videos.find((v) => v.type === 'Trailer') ?? movie.videos[0];
    const otherVideos = movie.videos.filter((v) => v !== trailer);
    const verdict = rumor ? verdictCopy(rumor.delayProbability) : null;
    const leds = Array.from({ length: 20 }, (_, i) => {
        const mid = (i + 0.5) * 5;
        return rumor && mid <= rumor.delayProbability ? riskClass(mid) : '';
    });

    return (
        <div className={styles.page}>
            <nav className={`wrap ${styles.crumb}`} aria-label="Breadcrumb">
                <Link to="/movies">← Movies</Link>
                <span>/</span>
                <Link to="/movies">Upcoming</Link>
                <span>/</span>
                <b>{movie.title}</b>
            </nav>

            <section className="wrap">
                <article className={styles.hero}>
                    <div className={styles.hPoster} style={{ background: posterGradient(movie.id) }}>
                        {movie.coverImageUrl ? (
                            <img className={styles.posterImg} src={movie.coverImageUrl} alt="" loading="lazy" />
                        ) : (
                            <span className={styles.glyph}>{posterInitials(movie.title)}</span>
                        )}
                    </div>

                    <div className={styles.hMain}>
                        <div className={styles.tags}>
                            <span className={`${styles.chip} ${styles[movie.releaseDateStatus.toLowerCase()] ?? ''}`}>
                                {STATUS_LABEL[movie.releaseDateStatus]}
                            </span>
                            {movie.genres.map((g) => (
                                <span key={g.id} className={styles.tag}>
                                    {g.name}
                                </span>
                            ))}
                        </div>
                        <h1 className={styles.hTitle}>{movie.title}</h1>
                        {movie.tagline && <p className={styles.hTag}>{movie.tagline}</p>}
                        <div className={styles.hMeta}>
                            {[movie.ageRating, formatRuntime(movie.runtimeMinutes), director ? `Dir. ${director.name}` : null, movie.studio]
                                .filter(Boolean)
                                .map((item) => (
                                    <span key={item}>{item}</span>
                                ))}
                        </div>
                        {countdown && (
                            <div className={styles.count} role="group" aria-label="Time until release">
                                <div className={styles.tile}>
                                    <b>{countdown.days}</b>
                                    <small>days</small>
                                </div>
                                <div className={styles.tile}>
                                    <b>{String(countdown.hours).padStart(2, '0')}</b>
                                    <small>hrs</small>
                                </div>
                                <div className={styles.tile}>
                                    <b>{String(countdown.minutes).padStart(2, '0')}</b>
                                    <small>min</small>
                                </div>
                                <span className={styles.countLabel}>
                                    until release
                                    <br />
                                    {movie.releaseDate && fullDateLabel(movie.releaseDate)}
                                </span>
                            </div>
                        )}
                        <div className={styles.hActions}>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSolid} ${tracked ? styles.on : ''}`}
                                aria-pressed={tracked}
                                onClick={() => setTracked((t) => !t)}
                            >
                                <BookmarkIcon filled={tracked} size={16} />
                                {tracked ? 'Tracking' : 'Track release'}
                            </button>
                            {trailer && (
                                <a className={`${styles.btn} ${styles.btnGhost}`} href="#trailer">
                                    <PlayIcon size={14} />
                                    Watch trailer
                                </a>
                            )}
                        </div>
                    </div>

                    <aside className={styles.out} aria-label="Delay outlook">
                        <div className={styles.outTop}>
                            <div className={styles.eyebrow}>Delay outlook</div>
                            {rumor && <small>Updated {fullDateLabel(rumor.computedAt.slice(0, 10))}</small>}
                        </div>
                        {rumor && verdict ? (
                            <>
                                <div className={styles.verdict}>
                                    <div className={styles.big}>
                                        {rumor.delayProbability}
                                        <sup>%</sup>
                                    </div>
                                    <div className={styles.vSide}>
                                        <span className={`${styles.chip} ${styles[verdict.level]}`}>{verdict.label}</span>
                                        <p>{verdict.sentence}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.ledWrap} role="img" aria-label={`Delay risk ${rumor.delayProbability} percent`}>
                                        <div className={styles.led}>
                                            {leds.map((cls, i) => (
                                                <i key={i} className={cls ? styles[cls] : ''} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.zones}>
                                        <span>On time</span>
                                        <span>Watch</span>
                                        <span>Likely to slip</span>
                                    </div>
                                </div>
                                <div className={styles.oFacts}>
                                    {rumor.confidenceTrend && (
                                        <div className={styles.oFact}>
                                            <small>Trend</small>
                                            <span className={`${styles.chip} ${styles.low}`}>
                                                {rumor.confidenceTrend === 'RISING' ? '↑ Risk rising' : rumor.confidenceTrend === 'FALLING' ? '↓ Risk falling' : '→ Stable'}
                                            </span>
                                        </div>
                                    )}
                                    {rumor.aggregateSentimentScore != null && (
                                        <div className={styles.oFact}>
                                            <small>Press sentiment</small>
                                            <b>{rumor.aggregateSentimentScore >= 0 ? 'Positive' : 'Negative'} · {rumor.aggregateSentimentScore.toFixed(2)}</b>
                                        </div>
                                    )}
                                    {rumor.topSourceName && (
                                        <div className={styles.oFact}>
                                            <small>Top source</small>
                                            <b>{rumor.topSourceName}</b>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>No signal computed for this title yet.</p>
                        )}
                    </aside>
                </article>
            </section>

            <section className={`wrap ${styles.sec}`} id="trailer">
                <div className={styles.two}>
                    <div>
                        <div className={styles.secHead}>
                            <div>
                                <h2>Synopsis</h2>
                            </div>
                        </div>
                        {movie.description && <p className={styles.syn}>{movie.description}</p>}
                        {movie.contributors.length > 0 && (
                            <dl className={styles.dl}>
                                {movie.contributors.map((c) => (
                                    <div key={c.id} style={{ display: 'contents' }}>
                                        <dt>{c.role[0]}{c.role.slice(1).toLowerCase()}</dt>
                                        <dd>{c.name}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                    {trailer && (
                        <div>
                            <div className={styles.secHead}>
                                <div>
                                    <h2>Trailer</h2>
                                </div>
                            </div>
                            <a className={styles.video} href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                                <span className={styles.play} aria-hidden="true">
                                    <PlayIcon size={26} />
                                </span>
                                <span className={styles.cap}>
                                    <b>{trailer.name}</b>
                                    <span>YouTube</span>
                                </span>
                            </a>
                            {otherVideos.length > 0 && (
                                <div className={styles.thumbs}>
                                    {otherVideos.slice(0, 3).map((v) => (
                                        <div key={v.key + v.name}>
                                            <a
                                                className={styles.thumb}
                                                style={{ background: posterGradient(v.name) }}
                                                href={`https://www.youtube.com/watch?v=${v.key}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label={`Play ${v.name}`}
                                            >
                                                <span>{v.type}</span>
                                            </a>
                                            <div className={styles.thumbLabel}>{v.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {rumor && (
                <section className={`wrap ${styles.sec}`}>
                    <div className={styles.secHead}>
                        <div>
                            <h2>Delay analysis</h2>
                            <p>How likely the known date is to slip, and what the signal is built on.</p>
                        </div>
                    </div>
                    <div className={styles.two}>
                        <div className={`${styles.card} ${styles.chart}`}>
                            <div className={styles.chartTop}>
                                <div>
                                    <b>Delay signal history</b>
                                    <p>{history.length} snapshot{history.length === 1 ? '' : 's'} so far</p>
                                </div>
                            </div>
                            <DelayTrendChart history={history} />
                            {movie.releaseDate && (
                                <div className={styles.dcheck}>
                                    <div className={styles.dcCell}>
                                        <small>Known date · TMDB</small>
                                        <b>{fullDateLabel(movie.releaseDate)}</b>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={`${styles.card} ${styles.evi}`}>
                            <div className={styles.eviHead}>
                                <div className={styles.eyebrow}>What the signal is built on</div>
                                {evidence.length > 0 && <p>{evidence.length} signals</p>}
                            </div>
                            {evidence.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13.5, padding: '0 0 18px' }}>No sourced evidence yet.</p>}
                            {evidence.map((e, i) => (
                                <div key={i} className={styles.sigRow}>
                                    <div className={styles.sigHead}>
                                        <span className={styles.src}>{e.sourceName}</span>
                                        <span className={`${styles.chip} ${STANCE_CLASS[e.stance]}`}>{STANCE_LABEL[e.stance]}</span>
                                    </div>
                                    <q>{e.quote}</q>
                                    <small>Reputation {e.sourceReputationScore.toFixed(2)}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {movie.cast.length > 0 && (
                <section className={`wrap ${styles.sec}`}>
                    <div className={styles.secHead}>
                        <div>
                            <h2>Cast</h2>
                        </div>
                    </div>
                    <div className={styles.cast}>
                        {movie.cast.map((member) => (
                            <div key={member.id} className={styles.person}>
                                <div className={styles.face} style={{ background: posterGradient(member.id) }}>
                                    {posterInitials(member.name)}
                                </div>
                                <b>{member.name}</b>
                                <span>{member.character}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className={`wrap ${styles.sec}`}>
                <div className={styles.secHead}>
                    <div>
                        <h2>Details</h2>
                    </div>
                </div>
                <div className={styles.info}>
                    {movie.regionalReleases.length > 0 && (
                        <div className={styles.card}>
                            <h3>Release dates</h3>
                            {movie.regionalReleases.map((r) => (
                                <div key={r.countryCode + r.type} className={styles.kv}>
                                    <span>
                                        {r.countryCode} · {r.type[0]}
                                        {r.type.slice(1).toLowerCase()}
                                    </span>
                                    <b>{fullDateLabel(r.releaseDate)}</b>
                                </div>
                            ))}
                        </div>
                    )}
                    {statusHistory.length > 0 && (
                        <div className={styles.card}>
                            <h3>Status history</h3>
                            <ul className={styles.tl}>
                                {statusHistory.map((h) => (
                                    <li key={h.id}>
                                        <small>{fullDateLabel(h.changedAt.slice(0, 10))}</small>
                                        {h.sourceNote ?? STATUS_LABEL[h.status]}
                                    </li>
                                ))}
                                {movie.releaseDate && (
                                    <li className={styles.next}>
                                        <small>{fullDateLabel(movie.releaseDate)}</small>
                                        Release
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                    <div className={styles.card}>
                        <h3>Facts</h3>
                        <div className={styles.kv}>
                            <span>Original title</span>
                            <b>{movie.title}</b>
                        </div>
                        <div className={styles.kv}>
                            <span>Language</span>
                            <b>{movie.language ?? '—'}</b>
                        </div>
                        <div className={styles.kv}>
                            <span>Studio</span>
                            <b>{movie.studio ?? '—'}</b>
                        </div>
                        <div className={styles.kv}>
                            <span>Country</span>
                            <b>{movie.country ?? '—'}</b>
                        </div>
                        <div className={styles.kv}>
                            <span>Budget</span>
                            <b>{movie.budgetUsd ? `$${movie.budgetUsd.toLocaleString('en-US')}` : 'Undisclosed'}</b>
                        </div>
                    </div>
                    {purchaseLinks.length > 0 && (
                        <div className={styles.card}>
                            <h3>Tickets &amp; pre-order</h3>
                            {purchaseLinks.map((link) => (
                                <div key={link.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                        <b>{link.platformName}</b>
                                        <span
                                            className={styles.chip}
                                            style={{
                                                color: link.availabilityStatus === 'AVAILABLE' ? 'var(--ontime)' : 'var(--muted)',
                                                background: link.availabilityStatus === 'AVAILABLE' ? 'color-mix(in srgb, var(--ontime) 14%, transparent)' : 'var(--surface-2)',
                                            }}
                                        >
                                            {link.availabilityStatus === 'AVAILABLE' ? 'On sale' : 'Not listed'}
                                        </span>
                                    </div>
                                    <small style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)' }}>
                                        {link.price ? `From $${link.price.toFixed(2)}` : 'No store has listed it yet'}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {more.length > 0 && (
                <section className={`wrap ${styles.sec}`}>
                    <div className={styles.secHead}>
                        <div>
                            <h2>More like this</h2>
                        </div>
                        <Link to="/movies">All upcoming →</Link>
                    </div>
                    <div className={styles.more}>
                        {more.map((m) => (
                            <Link key={m.id} to={`/movies/${m.id}`}>
                                <div className={styles.poster} style={{ background: posterGradient(m.id) }}>
                                    {m.coverImageUrl ? (
                                        <img className={styles.posterImg} src={m.coverImageUrl} alt="" loading="lazy" />
                                    ) : (
                                        <span className={styles.glyph}>{posterInitials(m.title)}</span>
                                    )}
                                </div>
                                <b>{m.title}</b>
                                <span>{m.releaseDate ? m.releaseDate.slice(0, 10) : 'TBA'}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <footer className={`wrap ${styles.foot}`}>
                <span className={styles.fbrand}>UMT · Unified Media Tracker</span>
                <span>Film data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
            </footer>
        </div>
    );
}
