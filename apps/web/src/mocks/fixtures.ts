import type {
    CastMemberResponse,
    ContributorResponse,
    DelayHistoryPoint,
    EvidenceItemResponse,
    GenreResponse,
    MediaVideoResponse,
    MovieDetailResponse,
    MovieResponse,
    PurchaseLinkResponse,
    RegionalReleaseResponse,
    ReleaseStatusHistoryResponse,
    RumorSnapshotResponse,
} from '@umt/shared/dto/media';

// Stand-in for what core-service should eventually return. Same dataset as the
// Main.dc.html / Detail.dc.html design mockups, reshaped to the real DTOs.

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

let genreSeq = 0;
const genre = (name: string): GenreResponse => ({ id: `genre-${++genreSeq}`, name });

const director = (name: string): ContributorResponse[] => [
    { id: `person-${slug(name)}`, name, contributorType: 'PERSON', role: 'DIRECTOR' },
];

interface RawMovie {
    title: string;
    directorName: string | null;
    runtimeMinutes: number | null;
    genreNames: string[];
    ageRating: string | null;
    releaseDate: string | null;
    status: MovieResponse['releaseDateStatus'];
    delayProbability: number | null;
    trend: 'RISING' | 'FALLING' | 'STABLE' | null;
    previousReleaseDate: string | null;
    popularityScore: number;
}

const RAW_MOVIES: RawMovie[] = [
    { title: 'Meridian Line', directorName: 'Tomas Adeyemi', runtimeMinutes: 134, genreNames: ['Sci-Fi', 'Thriller'], ageRating: 'PG-13', releaseDate: '2026-10-02', status: 'CONFIRMED', delayProbability: 9, trend: 'STABLE', previousReleaseDate: null, popularityScore: 88 },
    { title: 'Paper Kingdoms', directorName: 'Yuki Hale', runtimeMinutes: 96, genreNames: ['Animation', 'Family'], ageRating: 'PG', releaseDate: '2026-10-09', status: 'CONFIRMED', delayProbability: 4, trend: 'FALLING', previousReleaseDate: null, popularityScore: 74 },
    { title: 'The Understudy', directorName: 'Priya Raman', runtimeMinutes: 104, genreNames: ['Comedy', 'Drama'], ageRating: 'R', releaseDate: '2026-10-16', status: 'ANNOUNCED', delayProbability: 22, trend: 'STABLE', previousReleaseDate: null, popularityScore: 52 },
    { title: 'Nightshift at Carrow Hall', directorName: 'Emil Novak', runtimeMinutes: 99, genreNames: ['Horror'], ageRating: 'R', releaseDate: '2026-10-30', status: 'CONFIRMED', delayProbability: 12, trend: 'STABLE', previousReleaseDate: null, popularityScore: 67 },
    { title: 'The Quiet Flood', directorName: 'Mara Lindqvist', runtimeMinutes: 121, genreNames: ['Drama', 'Mystery'], ageRating: 'PG-13', releaseDate: '2026-11-14', status: 'CONFIRMED', delayProbability: 18, trend: 'STABLE', previousReleaseDate: null, popularityScore: 71 },
    { title: 'Ember & Ash', directorName: 'Callum Reyes', runtimeMinutes: 148, genreNames: ['Fantasy', 'Adventure'], ageRating: 'PG-13', releaseDate: '2026-11-20', status: 'RUMORED', delayProbability: 58, trend: 'RISING', previousReleaseDate: null, popularityScore: 93 },
    { title: 'Long Way Down Under', directorName: 'Sadie Okoro', runtimeMinutes: 112, genreNames: ['Adventure', 'Comedy'], ageRating: 'PG', releaseDate: '2026-12-04', status: 'ANNOUNCED', delayProbability: 31, trend: 'STABLE', previousReleaseDate: null, popularityScore: 58 },
    { title: 'Salt & Static', directorName: 'Ilya Brandt', runtimeMinutes: 127, genreNames: ['Sci-Fi', 'Drama'], ageRating: 'R', releaseDate: '2026-12-19', status: 'CONFIRMED', delayProbability: 34, trend: 'STABLE', previousReleaseDate: null, popularityScore: 64 },
    { title: 'Glasshouse', directorName: 'Noor Haddad', runtimeMinutes: 109, genreNames: ['Thriller', 'Crime'], ageRating: 'R', releaseDate: '2027-01-15', status: 'DELAYED', delayProbability: 94, trend: 'RISING', previousReleaseDate: '2026-11-06', popularityScore: 69 },
    { title: 'Hollow Crown', directorName: 'Aurelia Voss', runtimeMinutes: 152, genreNames: ['Fantasy', 'Drama'], ageRating: 'PG-13', releaseDate: '2027-02-06', status: 'RUMORED', delayProbability: 62, trend: 'RISING', previousReleaseDate: null, popularityScore: 86 },
    { title: 'Signal Fire', directorName: 'Mateo Duarte', runtimeMinutes: 117, genreNames: ['Action', 'Thriller'], ageRating: 'PG-13', releaseDate: '2027-03-12', status: 'DELAYED', delayProbability: 88, trend: 'STABLE', previousReleaseDate: '2026-12-11', popularityScore: 61 },
    { title: 'Small Hours', directorName: 'Hana Petersen', runtimeMinutes: 93, genreNames: ['Drama'], ageRating: 'PG-13', releaseDate: '2027-04-23', status: 'ANNOUNCED', delayProbability: 15, trend: 'STABLE', previousReleaseDate: null, popularityScore: 38 },
    { title: 'Tidewater', directorName: 'Bram Costa', runtimeMinutes: 126, genreNames: ['Adventure', 'Drama'], ageRating: 'PG-13', releaseDate: '2027-06-11', status: 'ANNOUNCED', delayProbability: 27, trend: 'FALLING', previousReleaseDate: null, popularityScore: 55 },
    { title: 'Untitled Ravenmoor Project', directorName: null, runtimeMinutes: null, genreNames: ['Horror', 'Mystery'], ageRating: null, releaseDate: null, status: 'TBA', delayProbability: null, trend: null, previousReleaseDate: null, popularityScore: 47 },
    { title: 'Kestrel', directorName: null, runtimeMinutes: null, genreNames: ['Action'], ageRating: null, releaseDate: null, status: 'TBA', delayProbability: null, trend: null, previousReleaseDate: null, popularityScore: 33 },
];

export const MOVIES: MovieResponse[] = RAW_MOVIES.map((m, i) => ({
    id: slug(m.title),
    mediaCategory: 'MOVIE',
    title: m.title,
    description: null,
    coverImageUrl: null,
    ageRating: m.ageRating,
    releaseDate: m.releaseDate,
    releaseDateStatus: m.status,
    popularityScore: m.popularityScore,
    averageUserRating: null,
    ratingCount: 0,
    franchiseId: null,
    externalSource: 'TMDB',
    externalSourceId: String(100000 + i),
    genres: m.genreNames.map(genre),
    contributors: m.directorName ? director(m.directorName) : [],
    runtimeMinutes: m.runtimeMinutes,
    previousReleaseDate: m.previousReleaseDate,
    latestDelayProbability: m.delayProbability,
    latestConfidenceTrend: m.trend,
}));

const MERIDIAN_LINE_CAST: CastMemberResponse[] = [
    { id: 'cast-1', name: 'Adaeze Okafor', character: 'Ines Marlow', profileImageUrl: null },
    { id: 'cast-2', name: 'Jonas Keller', character: 'Cmdr. Rusk', profileImageUrl: null },
    { id: 'cast-3', name: 'Sofia Reyes', character: 'Dr. Amara Lind', profileImageUrl: null },
    { id: 'cast-4', name: 'Kenji Watanabe', character: 'Toru', profileImageUrl: null },
    { id: 'cast-5', name: 'Bea Lindholm', character: 'Pilot Noor', profileImageUrl: null },
    { id: 'cast-6', name: 'Marcus Hale', character: 'Voice of the Station', profileImageUrl: null },
    { id: 'cast-7', name: 'Elena Petrova', character: 'Chief Sava', profileImageUrl: null },
    { id: 'cast-8', name: 'Dmitri Vale', character: 'Halloran', profileImageUrl: null },
];

const MERIDIAN_LINE_VIDEOS: MediaVideoResponse[] = [
    { key: 'dQw4w9WgXcQ', site: 'YouTube', type: 'Trailer', name: 'Official Trailer', official: true },
    { key: 'dQw4w9WgXcQ', site: 'YouTube', type: 'Teaser', name: 'Teaser', official: true },
    { key: 'dQw4w9WgXcQ', site: 'YouTube', type: 'Clip', name: 'Clip: Signal Room', official: true },
    { key: 'dQw4w9WgXcQ', site: 'YouTube', type: 'Featurette', name: 'Featurette: Building the Station', official: true },
];

const MERIDIAN_LINE_RELEASES: RegionalReleaseResponse[] = [
    { countryCode: 'US', releaseDate: '2026-10-02', type: 'THEATRICAL' },
    { countryCode: 'GB', releaseDate: '2026-10-02', type: 'THEATRICAL' },
    { countryCode: 'DE', releaseDate: '2026-10-08', type: 'THEATRICAL' },
    { countryCode: 'JP', releaseDate: '2026-10-23', type: 'THEATRICAL' },
];

export const MOVIE_DETAILS: Record<string, MovieDetailResponse> = {
    [slug('Meridian Line')]: {
        ...MOVIES[0],
        description:
            'When relay engineer Ines Marlow picks up a transmission from a station decommissioned a decade ago, ' +
            'she must decide whether to report it, or answer. As the crew\'s stories begin to disagree, the line ' +
            'between the message and the messenger starts to blur.',
        tagline: 'Some signals were never meant to be answered.',
        backdropImageUrl: null,
        studio: 'Nightbird Pictures',
        country: 'United States',
        language: 'English',
        budgetUsd: null,
        videos: MERIDIAN_LINE_VIDEOS,
        cast: MERIDIAN_LINE_CAST,
        regionalReleases: MERIDIAN_LINE_RELEASES,
    },
};

export const RUMOR_SNAPSHOTS: Record<string, RumorSnapshotResponse> = {
    [slug('Meridian Line')]: {
        id: 'snapshot-meridian-line-latest',
        mediaItemId: slug('Meridian Line'),
        delayProbability: 9,
        aggregateSentimentScore: 0.62,
        confidenceTrend: 'FALLING',
        topSourceName: 'Frame Rate Weekly',
        computedAt: '2026-09-21T09:00:00Z',
    },
};

// 60 days of history ending today (9%), peaking at 38% around the reshoot rumor.
export const RUMOR_HISTORY: Record<string, DelayHistoryPoint[]> = {
    [slug('Meridian Line')]: [
        { computedAt: '2026-07-23T09:00:00Z', delayProbability: 14 },
        { computedAt: '2026-07-29T09:00:00Z', delayProbability: 16 },
        { computedAt: '2026-08-04T09:00:00Z', delayProbability: 19 },
        { computedAt: '2026-08-10T09:00:00Z', delayProbability: 24 },
        { computedAt: '2026-08-15T09:00:00Z', delayProbability: 31 },
        { computedAt: '2026-08-21T09:00:00Z', delayProbability: 38 },
        { computedAt: '2026-08-25T09:00:00Z', delayProbability: 36 },
        { computedAt: '2026-08-29T09:00:00Z', delayProbability: 33 },
        { computedAt: '2026-09-02T09:00:00Z', delayProbability: 27 },
        { computedAt: '2026-09-04T09:00:00Z', delayProbability: 15 },
        { computedAt: '2026-09-08T09:00:00Z', delayProbability: 13 },
        { computedAt: '2026-09-12T09:00:00Z', delayProbability: 12 },
        { computedAt: '2026-09-16T09:00:00Z', delayProbability: 10 },
        { computedAt: '2026-09-19T09:00:00Z', delayProbability: 9.5 },
        { computedAt: '2026-09-21T09:00:00Z', delayProbability: 9 },
    ],
};

export const STATUS_HISTORY: Record<string, ReleaseStatusHistoryResponse[]> = {
    [slug('Meridian Line')]: [
        { id: 'hist-1', status: 'ANNOUNCED', changedAt: '2026-03-14T00:00:00Z', sourceNote: 'Announced, release set for 2 Oct' },
        { id: 'hist-2', status: 'CONFIRMED', changedAt: '2026-06-02T00:00:00Z', sourceNote: 'Confirmed, date locked' },
    ],
};

export const PURCHASE_LINKS: Record<string, PurchaseLinkResponse[]> = {
    [slug('Meridian Line')]: [
        { id: 'buy-1', platformName: 'SeatNow', affiliateUrl: '#', price: 13.5, currency: 'USD', availabilityStatus: 'AVAILABLE', lastCheckedAt: '2026-09-21T06:00:00Z' },
        { id: 'buy-2', platformName: 'Digital pre-order', affiliateUrl: '#', price: null, currency: null, availabilityStatus: 'UNAVAILABLE', lastCheckedAt: '2026-09-21T06:00:00Z' },
    ],
};

export const RUMOR_EVIDENCE: Record<string, EvidenceItemResponse[]> = {
    [slug('Meridian Line')]: [
        { sourceName: 'CineWire', sourceReputationScore: 0.93, stance: 'SUPPORTS_DATE', quote: 'Press screenings are booked from 24 Sep, ahead of the 2 Oct opening.', publishedAt: '2026-09-19T00:00:00Z' },
        { sourceName: 'Frame Rate Weekly', sourceReputationScore: 0.88, stance: 'SUPPORTS_DATE', quote: 'Studio locks 2 October after strong test-screening scores.', publishedAt: '2026-09-15T00:00:00Z' },
        { sourceName: 'The Reel Ledger', sourceReputationScore: 0.81, stance: 'POINTS_TO_DELAY', quote: 'Reshoot chatter puts an October release in doubt, crew members say.', publishedAt: '2026-08-21T00:00:00Z' },
        { sourceName: 'Popcorn Signal', sourceReputationScore: 0.42, stance: 'NO_DATE_CLAIM', quote: 'Frame-by-frame breakdown of the new trailer.', publishedAt: '2026-09-18T00:00:00Z' },
    ],
};
