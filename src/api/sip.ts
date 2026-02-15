import { apiClient } from './client';
import { CreateSipRequest, SipMandate } from '@/types';
import { unwrapApiResponse } from './unwrap';
import { generateIdempotencyKey } from '@/utils/helpers';

interface CreateSipMandatePayload {
  planId: number;
  sipAmount: number;
  sipDay: number;
  totalInstallments: number;
}

interface SipListResponse {
  totalSips: number;
  activeSips: number;
  pausedSips: number;
  cancelledSips: number;
  completedSips: number;
  suspendedSips: number;
  sipMandates: SipMandate[];
  sips: SipMandate[];
}

export const sipApi = {
  createSip: async (data: CreateSipRequest): Promise<SipMandate> => {
    const response = await apiClient.post('/sips/create', data);
    return unwrapApiResponse<SipMandate>(response.data);
  },

  createSipMandate: async (data: CreateSipMandatePayload) => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiClient.post('/sips/create', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return unwrapApiResponse(response.data);
  },

  getAllSips: async (): Promise<SipListResponse> => {
    const response = await apiClient.get('/sips/all');
    const raw = response.data as any;

    const sipMandates = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.sipMandates)
      ? raw.sipMandates
      : Array.isArray(raw?.sips)
      ? raw.sips
      : Array.isArray(raw?.content)
      ? raw.content
      : [];

    const normalizedSipMandates = sipMandates.map((sip: any) => ({
      ...sip,
      amount: Number(sip?.amount ?? sip?.sipAmount ?? 0),
      dayOfMonth: Number(sip?.dayOfMonth ?? sip?.sipDay ?? 0),
      nextExecutionDate: sip?.nextExecutionDate ?? sip?.nextRunAt,
      totalExecutions:
        sip?.totalExecutions ??
        sip?.completedInstallments ??
        0,
      successfulExecutions:
        sip?.successfulExecutions ??
        sip?.completedInstallments ??
        0,
      failedExecutions: sip?.failedExecutions ?? 0,
    }));

    return {
      totalSips: Number(raw?.totalSips ?? normalizedSipMandates.length),
      activeSips: Number(
        raw?.activeSips ??
          normalizedSipMandates.filter((s: any) => s.status === 'ACTIVE').length
      ),
      pausedSips: Number(
        raw?.pausedSips ??
          normalizedSipMandates.filter((s: any) => s.status === 'PAUSED').length
      ),
      cancelledSips: Number(
        raw?.cancelledSips ??
          normalizedSipMandates.filter((s: any) => s.status === 'CANCELLED').length
      ),
      completedSips: Number(
        raw?.completedSips ??
          normalizedSipMandates.filter((s: any) => s.status === 'COMPLETED').length
      ),
      suspendedSips: Number(
        raw?.suspendedSips ??
          normalizedSipMandates.filter((s: any) => s.status === 'SUSPENDED').length
      ),
      sipMandates: normalizedSipMandates,
      sips: normalizedSipMandates,
    };
  },

  pauseSip: async (sipMandateId: number): Promise<string> => {
    const response = await apiClient.post('/sips/pause', null, {
      params: { sipMandateId },
    });
    return unwrapApiResponse<string>(response.data);
  },

  resumeSip: async (sipMandateId: number): Promise<string> => {
    const response = await apiClient.post('/sips/resume', null, {
      params: { sipMandateId },
    });
    return unwrapApiResponse<string>(response.data);
  },

  cancelSip: async (sipMandateId: number): Promise<string> => {
    const response = await apiClient.post('/sips/cancel', null, {
      params: { sipMandateId },
    });
    return unwrapApiResponse<string>(response.data);
  },
};
