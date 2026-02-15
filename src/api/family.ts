import { apiClient } from './client';
import { FamilyActionResponse, FamilyMember, FamilyRequest } from '@/types';
import { unwrapApiResponse } from './unwrap';

export const familyApi = {
  getMembers: async (): Promise<FamilyMember[]> => {
    const response = await apiClient.get('/family/members');
    const data = unwrapApiResponse<unknown>(response.data);
    return Array.isArray(data) ? (data as FamilyMember[]) : [];
  },

  sendAccessRequest: async (memberCustomerId: string): Promise<FamilyActionResponse> => {
    const response = await apiClient.post('/family/request', { memberCustomerId });
    return unwrapApiResponse<FamilyActionResponse>(response.data);
  },

  getPendingRequests: async (): Promise<FamilyRequest[]> => {
    const response = await apiClient.get('/family/request/pending');
    const data = unwrapApiResponse<unknown>(response.data);
    return Array.isArray(data) ? (data as FamilyRequest[]) : [];
  },

  acceptRequest: async (requestId: number): Promise<FamilyActionResponse> => {
    const response = await apiClient.post(`/family/request/${requestId}/accept`);
    return unwrapApiResponse<FamilyActionResponse>(response.data);
  },

  revokeAccess: async (memberCustomerId: string): Promise<FamilyActionResponse> => {
    const response = await apiClient.post('/family/revoke', { memberCustomerId });
    return unwrapApiResponse<FamilyActionResponse>(response.data);
  },
};
