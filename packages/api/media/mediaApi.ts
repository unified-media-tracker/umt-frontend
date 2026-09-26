import type { AxiosInstance } from 'axios';
import type {
    DelayHistoryPoint,
    EvidenceItemResponse,
    MediaResponseOf,
    MediaSortOption,
    MediaCategory,
    MovieDetailResponse,
    PurchaseLinkResponse,
    ReleaseStatus,
    ReleaseStatusHistoryResponse,
    RumorSnapshotResponse,
} from '@umt/shared/dto/media';


export interface ListMediaParams<C extends MediaCategory = MediaCategory> {
    mediaCategory: C;
    status?: ReleaseStatus;
    sort?: MediaSortOption;
    // YYYY-MM-DD. Keeps items releasing on or after it, plus undated (TBA) ones - so a page can
    // skip the back catalogue instead of pulling every film the database has ever seen.
    releaseDateFrom?: string;
}

type DetailOf<C extends MediaCategory> = C extends 'MOVIE' ? MovieDetailResponse : MediaResponseOf<C>;

// Passing a category narrows the result to that category's own type; without one it is the union.
export const createMediaApi = (httpClient: AxiosInstance) => ({
    list: <C extends MediaCategory>(params: ListMediaParams<C>) =>
        httpClient.get<MediaResponseOf<C>[]>('/api/core/media', { params }),

    // mediaCategory is optional - pass it when the caller already knows the type (e.g. a page that
    // only ever deals in one type, like MovieDetailPage) to skip straight to that table server
    // side instead of it trying all five in turn. A mediaCategory that doesn't match the id's real
    // type 404s, same as an unknown id - it will not fall back to searching the other tables.
    getById: <C extends MediaCategory = MediaCategory>(id: string, mediaCategory?: C) =>
        httpClient.get<DetailOf<C>>(`/api/core/media/${id}`, { params: { mediaCategory } }),

    getSimilar: <C extends MediaCategory = MediaCategory>(id: string, mediaCategory?: C) =>
        httpClient.get<MediaResponseOf<C>[]>(`/api/core/media/${id}/similar`, { params: { mediaCategory } }),

    search: <C extends MediaCategory = MediaCategory>(query: string, mediaCategory?: C) =>
        httpClient.get<MediaResponseOf<C>[]>('/api/core/media/search', {
            params: { q: query, mediaCategory },
        }),

    getRumorSnapshot: (mediaItemId: string) =>
        httpClient.get<RumorSnapshotResponse>(`/api/core/media/${mediaItemId}/rumor`),

    getRumorHistory: (mediaItemId: string) =>
        httpClient.get<DelayHistoryPoint[]>(`/api/core/media/${mediaItemId}/rumor/history`),

    getEvidence: (mediaItemId: string) =>
        httpClient.get<EvidenceItemResponse[]>(`/api/core/media/${mediaItemId}/rumor/evidence`),

    getStatusHistory: (mediaItemId: string) =>
        httpClient.get<ReleaseStatusHistoryResponse[]>(`/api/core/media/${mediaItemId}/status-history`),

    getPurchaseLinks: (mediaItemId: string) =>
        httpClient.get<PurchaseLinkResponse[]>(`/api/core/media/${mediaItemId}/purchase-links`),
});
