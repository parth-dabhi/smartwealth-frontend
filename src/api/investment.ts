import { apiClient } from './client';
import { unwrapApiResponse } from './unwrap';
import {
  InvestmentBuyRequest,
  InvestmentSellRequest,
  InvestmentOrder,
  PaginatedResponse,
} from '@/types';
import { generateIdempotencyKey } from '@/utils/helpers';

export const investmentApi = {
  buyLumpsum: async (data: InvestmentBuyRequest): Promise<InvestmentOrder> => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiClient.post('/investment/lumpsum', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return unwrapApiResponse<InvestmentOrder>(response.data);
  },

  sell: async (data: InvestmentSellRequest): Promise<InvestmentOrder> => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiClient.post('/investment/sell', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return unwrapApiResponse<InvestmentOrder>(response.data);
  },

  getOrderHistory: async (page = 0, size = 20): Promise<PaginatedResponse<InvestmentOrder>> => {
    const response = await apiClient.get('/investment/order-history', {
      params: { page, size },
    });
    const raw = response.data as any;

    const contentSource = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.orders)
      ? raw.orders
      : [];

    const content: InvestmentOrder[] = contentSource.map((order: any) => ({
      ...order,
      orderId: order?.orderId ?? order?.investmentOrderId,
      orderDate: order?.orderDate ?? order?.orderTime ?? order?.navDate,
      schemeName: order?.schemeName ?? order?.planName,
    }));

    const backendMeta = raw?.meta ?? {};
    const currentPage = Number(backendMeta.page ?? backendMeta.currentPage ?? page);
    const pageSize = Number(backendMeta.size ?? backendMeta.pageSize ?? size);
    const totalElements = Number(backendMeta.totalElements ?? content.length);
    const totalPages = Number(
      backendMeta.totalPages ??
        (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 1)
    );
    const hasNext =
      typeof backendMeta.hasNext === 'boolean'
        ? backendMeta.hasNext
        : currentPage + 1 < Math.max(totalPages, 1);
    const hasPrevious =
      typeof backendMeta.hasPrevious === 'boolean' ? backendMeta.hasPrevious : currentPage > 0;

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
};
