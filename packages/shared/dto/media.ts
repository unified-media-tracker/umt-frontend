// Mirrors umt-backend/open-api/src/main/resources/paths/media-api.yaml exactly.
// Keep these two in sync by hand until we generate the client from the spec.

export type MediaCategory = 'MOVIE' | 'TV_SHOW' | 'GAME' | 'BOOK' | 'MUSIC';

export type ReleaseStatus =
    | 'TBA'
    | 'ANNOUNCED'
    | 'RUMORED'
    | 'CONFIRMED'
    | 'DELAYED'
    | 'RELEASED'
    | 'CANCELED';

export type ExternalSourceType = 'TMDB' | 'IGDB' | 'MUSICBRAINZ' | 'HARDCOVER';

export type ContributorType = 'PERSON' | 'ORGANIZATION';

export type RoleType =
    | 'DIRECTOR'
    | 'DEVELOPER'
    | 'AUTHOR'
    | 'ARTIST'
    | 'WRITER'
    | 'STUDIO'
    | 'PUBLISHER';

export interface GenreResponse {
    id: string;
    name: string;
}

export interface ContributorResponse {
    id: string;
    name: string;
    contributorType: ContributorType;
    role: RoleType;
}

export type TrendDirection = 'RISING' | 'FALLING' | 'STABLE';

export type MediaSortOption = 'RELEASE_DATE' | 'DELAY_RISK' | 'POPULARITY';

// Real and live: GET /api/core/media and GET /api/core/media/{id} both return exactly
// this shape today, for every media type - runtimeMinutes is movie-only (null for
// everything else) and previousReleaseDate is always null for now (release_status_history
// only keeps a free-text note of a date change, not a structured prior value).
export interface MediaItemResponse {
    id: string;
    mediaCategory: MediaCategory;
    title: string;
    description?: string | null;
    coverImageUrl?: string | null;
    ageRating?: string | null;
    releaseDate?: string | null; // ISO date, e.g. "2026-10-02"
    releaseDateStatus: ReleaseStatus;
    popularityScore: number;
    averageUserRating?: number | null;
    ratingCount: number;
    franchiseId?: string | null;
    externalSource: ExternalSourceType;
    externalSourceId: string;
    genres: GenreResponse[];
    contributors: ContributorResponse[];
    runtimeMinutes?: number | null;
    previousReleaseDate?: string | null;
    latestDelayProbability?: number | null;
    latestConfidenceTrend?: TrendDirection | null;
}

// --- Below this line: still not backed by core-service. ---
// Evidence/videos/cast/release-by-country/rumor-history/status-history/purchase-links
// have no controller (some, like RumorSnapshot and ReleaseStatusHistory, mirror a real
// entity 1:1 and just need one; others have no backing table at all) - see the
// "not backed yet" note on each type below.

/** No longer adds anything - runtimeMinutes/previousReleaseDate/latestDelayProbability/
 * latestConfidenceTrend all moved onto MediaItemResponse once GET /api/core/media shipped
 * for real. Kept as an alias only because MoviesPage/MovieDetailPage already spell it out
 * this way; write new code against MediaItemResponse directly. */
export type MovieListItemResponse = MediaItemResponse;

/** Mirrors com.umt.core.rumor.RumorSnapshot. No REST endpoint yet. */
export interface RumorSnapshotResponse {
    id: string;
    mediaItemId: string;
    delayProbability: number;
    aggregateSentimentScore: number | null;
    confidenceTrend: TrendDirection | null;
    topSourceName: string | null;
    computedAt: string; // ISO instant
}

/** One point for the delay-probability trend chart. Same shape as RumorSnapshotResponse,
 * ordered oldest to newest - a thin projection of rumor_snapshot history. */
export interface DelayHistoryPoint {
    delayProbability: number;
    computedAt: string;
}

/** Not backed yet: rumor_signal has no persisted quote/reasoning text today,
 * only scores. Modeled here as the frontend's target shape for that gap. */
export interface EvidenceItemResponse {
    sourceName: string;
    sourceReputationScore: number;
    stance: 'SUPPORTS_DATE' | 'POINTS_TO_DELAY' | 'NO_DATE_CLAIM';
    quote: string;
    publishedAt: string;
}

/** Not backed yet: no videos/cast/release-by-country storage on media_item today. */
export interface MediaVideoResponse {
    key: string;
    site: 'YouTube';
    type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette';
    name: string;
    official: boolean;
}

export interface CastMemberResponse {
    id: string;
    name: string;
    character: string;
    profileImageUrl?: string | null;
}

export interface RegionalReleaseResponse {
    countryCode: string;
    releaseDate: string;
    type: 'THEATRICAL' | 'DIGITAL' | 'PHYSICAL';
}

/** Mirrors com.umt.core.media.ReleaseStatusHistory. No REST endpoint yet. */
export interface ReleaseStatusHistoryResponse {
    id: string;
    status: ReleaseStatus;
    changedAt: string;
    sourceNote: string | null;
}

export type AvailabilityStatus = 'AVAILABLE' | 'PREORDER' | 'UNAVAILABLE';

/** Mirrors the purchase_link table. No REST endpoint yet. */
export interface PurchaseLinkResponse {
    id: string;
    platformName: string;
    affiliateUrl: string;
    price: number | null;
    currency: string | null;
    availabilityStatus: AvailabilityStatus;
    lastCheckedAt: string;
}

/** Not backed yet: the movie table has no tagline/backdrop/studio/country/language/budget
 * columns today. What the detail page's hero and facts panel need beyond MediaItemResponse. */
export interface MovieDetailResponse extends MediaItemResponse {
    tagline?: string | null;
    backdropImageUrl?: string | null;
    studio?: string | null;
    country?: string | null;
    language?: string | null;
    budgetUsd?: number | null;
    videos: MediaVideoResponse[];
    cast: CastMemberResponse[];
    regionalReleases: RegionalReleaseResponse[];
}
