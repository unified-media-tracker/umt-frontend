import type { AxiosInstance } from 'axios';
import type {
    DelayHistoryPoint,
    EvidenceItemResponse,
    MediaItemResponse,
    MediaSortOption,
    MediaCategory,
    MovieDetailResponse,
    PurchaseLinkResponse,
    ReleaseStatus,
    ReleaseStatusHistoryResponse,
    RumorSnapshotResponse,
} from '@umt/shared/dto/media';


export interface ListMediaParams {
    mediaCategory: MediaCategory;
    status?: ReleaseStatus;
    sort?: MediaSortOption;
}

export const createMediaApi = (httpClient: AxiosInstance) => ({
    list: (params: ListMediaParams) =>
        httpClient.get<MediaItemResponse[]>('/api/core/media', { params }),

    // mediaCategory is optional - pass it when the caller already knows the type (e.g. a page that
    // only ever deals in one type, like MovieDetailPage) to skip straight to that table server
    // side instead of it trying all five in turn. A mediaCategory that doesn't match the id's real
    // type 404s, same as an unknown id - it will not fall back to searching the other tables.
    getById: (id: string, mediaCategory?: MediaCategory) =>
        httpClient.get<MovieDetailResponse>(`/api/core/media/${id}`, { params: { mediaCategory } }),

    getSimilar: (id: string, mediaCategory?: MediaCategory) =>
        httpClient.get<MediaItemResponse[]>(`/api/core/media/${id}/similar`, { params: { mediaCategory } }),

    search: (query: string, mediaCategory?: MediaCategory) =>
        httpClient.get<MediaItemResponse[]>('/api/core/media/search', {
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
