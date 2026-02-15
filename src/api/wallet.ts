import { apiClient } from './client';
import { unwrapApiResponse } from './unwrap';
import {
  WalletBalance,
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  PaginatedResponse,
} from '@/types';
import { generateIdempotencyKey } from '@/utils/helpers';

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeWalletBalance = (raw: any): WalletBalance => {
  const balance = toNumber(
    raw?.balance ?? raw?.totalBalance ?? raw?.walletBalance ?? raw?.currentBalance
  );
  const lockedBalance = toNumber(
    raw?.lockedBalance ?? raw?.blockedBalance ?? raw?.holdBalance
  );
  const availableBalance = toNumber(
    raw?.availableBalance ??
      raw?.withdrawableBalance ??
      raw?.balanceAvailable ??
      (balance - lockedBalance)
  );

  return { balance, lockedBalance, availableBalance };
};

const normalizeTransaction = (txn: any, index: number): Transaction => ({
  id: toNumber(txn?.id ?? index + 1),
  transactionId: String(txn?.transactionId ?? txn?.txnId ?? txn?.referenceId ?? '-'),
  customerId: String(txn?.customerId ?? txn?.userId ?? ''),
  amount: toNumber(txn?.amount ?? txn?.transactionAmount),
  type: (txn?.type ?? txn?.transactionType ?? 'DEBIT') as TransactionType,
  category: (txn?.category ?? txn?.transactionCategory ?? 'TOP_UP') as TransactionCategory,
  status: (txn?.status ?? txn?.transactionStatus ?? 'SUCCESS') as TransactionStatus,
  description: txn?.description,
  createdAt: String(txn?.createdAt ?? txn?.transactionDate ?? txn?.date ?? new Date().toISOString()),
  updatedAt: String(txn?.updatedAt ?? txn?.createdAt ?? txn?.transactionDate ?? new Date().toISOString()),
});

export const walletApi = {
  getBalance: async (): Promise<WalletBalance> => {
    const response = await apiClient.get('/wallet/balance');
    const raw = unwrapApiResponse<any>(response.data);
    return normalizeWalletBalance(raw);
  },

  creditWallet: async (amount: number): Promise<Transaction> => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiClient.post(
      '/wallet/credit',
      null,
      {
        params: { amount },
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    return unwrapApiResponse<Transaction>(response.data);
  },

  debitWallet: async (amount: number): Promise<Transaction> => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiClient.post(
      '/wallet/debit',
      null,
      {
        params: { amount },
        headers: { 'Idempotency-Key': idempotencyKey },
      }
    );
    return unwrapApiResponse<Transaction>(response.data);
  },

  getTransactions: async (
    page = 0,
    size = 10,
    sortBy = 'date',
    sortDirection = 'DESC',
    filters?: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get('/wallet/transactions', {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters,
      },
    });
    const payload = response.data as any;
    const raw = unwrapApiResponse<any>(payload);
    const contentSource = Array.isArray(raw)
      ? raw
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.transactions)
      ? raw.transactions
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    const content = contentSource.map(normalizeTransaction);
    const backendMeta = payload?.meta ?? payload?.data?.meta ?? raw?.meta ?? {};
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
};
