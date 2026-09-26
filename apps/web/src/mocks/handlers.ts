import { http, HttpResponse } from 'msw';
import type { MovieDetailResponse } from '@umt/shared/dto/media';
import {
    MOVIE_DETAILS,
    MOVIES,
    PURCHASE_LINKS,
    RUMOR_EVIDENCE,
    RUMOR_HISTORY,
    RUMOR_SNAPSHOTS,
    STATUS_HISTORY,
} from './fixtures';

// Serves the fixtures in mocks/fixtures.ts over the contract mediaApi.ts calls,
// so the app renders real data locally without core-service running. The list/getById
// handlers below now mirror endpoints core-service actually has; everything else is
// still a placeholder for ones it doesn't (see the "not backed yet" notes in
// packages/shared/dto/media.ts).

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const detailFor = (id: string): MovieDetailResponse | undefined => {
    if (MOVIE_DETAILS[id]) return MOVIE_DETAILS[id];
    const listed = MOVIES.find((m) => m.id === id);
    if (!listed) return undefined;
    return {
        ...listed,
        tagline: null,
        backdropImageUrl: null,
        studio: null,
        country: null,
        language: null,
        budgetUsd: null,
        videos: [],
        cast: [],
        regionalReleases: listed.releaseDate
            ? [{ countryCode: 'US', releaseDate: listed.releaseDate, type: 'THEATRICAL' }]
            : [],
    };
};

export const handlers = [
    http.get(`${API_BASE}/api/core/media`, ({ request }) => {
        const url = new URL(request.url);
        const mediaCategory = url.searchParams.get('mediaCategory');
        const status = url.searchParams.get('status');
        const sort = url.searchParams.get('sort');
        let items = MOVIES.filter((m) => !mediaCategory || m.mediaCategory === mediaCategory);
        if (status && status !== 'ALL') items = items.filter((m) => m.releaseDateStatus === status);
        if (sort === 'DELAY_RISK') items = [...items].sort((a, b) => (b.latestDelayProbability ?? -1) - (a.latestDelayProbability ?? -1));
        else if (sort === 'POPULARITY') items = [...items].sort((a, b) => b.popularityScore - a.popularityScore);
        else items = [...items].sort((a, b) => (a.releaseDate ?? '9999-12-31').localeCompare(b.releaseDate ?? '9999-12-31'));
        return HttpResponse.json(items);
    }),

    http.get(`${API_BASE}/api/core/media/search`, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
        const results = q ? MOVIES.filter((m) => m.title.toLowerCase().includes(q)).slice(0, 5) : [];
        return HttpResponse.json(results);
    }),

    http.get(`${API_BASE}/api/core/media/:id/rumor/history`, ({ params }) => {
        return HttpResponse.json(RUMOR_HISTORY[params.id as string] ?? []);
    }),

    http.get(`${API_BASE}/api/core/media/:id/rumor/evidence`, ({ params }) => {
        return HttpResponse.json(RUMOR_EVIDENCE[params.id as string] ?? []);
    }),

    http.get(`${API_BASE}/api/core/media/:id/status-history`, ({ params }) => {
        return HttpResponse.json(STATUS_HISTORY[params.id as string] ?? []);
    }),

    http.get(`${API_BASE}/api/core/media/:id/purchase-links`, ({ params }) => {
        return HttpResponse.json(PURCHASE_LINKS[params.id as string] ?? []);
    }),

    http.get(`${API_BASE}/api/core/media/:id/rumor`, ({ params }) => {
        const snapshot = RUMOR_SNAPSHOTS[params.id as string];
        return snapshot ? HttpResponse.json(snapshot) : new HttpResponse(null, { status: 404 });
    }),

    http.get(`${API_BASE}/api/core/media/:id/similar`, ({ params }) => {
        const results = MOVIES.filter((m) => m.id !== params.id).sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 5);
        return HttpResponse.json(results);
    }),

    http.get(`${API_BASE}/api/core/media/:id`, ({ params }) => {
        const detail = detailFor(params.id as string);
        return detail ? HttpResponse.json(detail) : new HttpResponse(null, { status: 404 });
    }),
];
