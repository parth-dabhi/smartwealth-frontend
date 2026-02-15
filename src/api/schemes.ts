import { apiClient } from './client';
import { MutualFundScheme, PaginatedResponse, FilterChoices } from '@/types';
import { unwrapApiResponse } from './unwrap';

export interface SchemeFilters {
  amcId?: number;
  assetId?: number;
  categoryId?: number;
  optionTypeId?: number;
  search?: string;
}

export const schemesApi = {
  getSchemes: async (
    filters?: SchemeFilters,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<MutualFundScheme>> => {
    const response = await apiClient.get('/public/schemes', {
      params: {
        ...filters,
        page,
        size,
      },
    });
    const raw = response.data as any;
    const content = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.schemes)
      ? raw.schemes
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    const backendMeta = raw?.meta ?? {};
    const currentPage = Number(
      backendMeta.page ?? backendMeta.currentPage ?? page
    );
    const pageSize = Number(
      backendMeta.size ?? backendMeta.pageSize ?? size
    );
    const totalElements = Number(
      backendMeta.totalElements ?? content.length
    );
    const totalPages = Number(
      backendMeta.totalPages ??
        (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 1)
    );
    const hasNext =
      typeof backendMeta.hasNext === 'boolean'
        ? backendMeta.hasNext
        : currentPage + 1 < totalPages;
    const hasPrevious =
      typeof backendMeta.hasPrevious === 'boolean'
        ? backendMeta.hasPrevious
        : currentPage > 0;

    return {
      content,
      meta: {
        currentPage,
        totalPages: Math.max(totalPages, 1),
        pageSize,
        totalElements,
        first: !hasPrevious,
        last: !hasNext,
      },
    };
  },

  getPlanDetails: async (planId: number) => {
    const response = await apiClient.get(`/public/plans/${planId}`);
    return unwrapApiResponse(response.data);
  },

  getFilterChoices: async (): Promise<FilterChoices> => {
    const response = await apiClient.get('/public/filters');
    return unwrapApiResponse<FilterChoices>(response.data);
  },

  getNavHistory: async (planId: number, days = 365) => {
    const response = await apiClient.get('/public/nav-history', {
      params: { planId, days },
    });
    return unwrapApiResponse(response.data);
  },

  getNavHistoryFromLink: async (historyLink: string) => {
    const trimmed = (historyLink || '').trim();
    if (!trimmed) {
      return null;
    }

    // apiClient baseURL already includes /api, so normalize links like /api/public/nav-history...
    let normalized = trimmed;
    if (trimmed.startsWith('/api/')) {
      normalized = trimmed.replace(/^\/api/, '');
    }

    const response = await apiClient.get(normalized);
    return unwrapApiResponse(response.data);
  },
};
