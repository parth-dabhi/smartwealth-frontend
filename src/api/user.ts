import { apiClient } from './client';
import { User } from '@/types';
import { unwrapApiResponse } from './unwrap';

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return unwrapApiResponse<User>(response.data);
  },

  updateRiskProfile: async (riskProfileId: number): Promise<void> => {
    await apiClient.put('/users/risk-profile', { riskProfileId });
  },

  getRiskProfiles: async () => {
    const response = await apiClient.get('/public/risk-profiles');
    return unwrapApiResponse(response.data);
  },
};
