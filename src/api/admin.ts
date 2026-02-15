import { adminApiClient } from './adminClient';
import { AdminUserListItem, AdminUserDetail, PaginatedResponse, KycStatus, UserRole } from '@/types';
import { unwrapApiResponse } from './unwrap';

export interface AdminUserFilters {
  customerId?: string;
  fullName?: string;
  kycStatus?: KycStatus;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  size?: number;
}

export const adminApi = {
  getUsers: async (
    filters: AdminUserFilters = {}
  ): Promise<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]> => {
    const {
      customerId,
      fullName,
      kycStatus,
      role,
      isActive,
      page = 0,
      size = 20,
    } = filters;

    const response = await adminApiClient.get('/admin/users', {
      params: { customerId, fullName, kycStatus, role, isActive, page, size },
    });
    return unwrapApiResponse<PaginatedResponse<AdminUserListItem> | AdminUserListItem[]>(response.data);
  },

  getUserDetail: async (customerId: string): Promise<AdminUserDetail> => {
    const response = await adminApiClient.get(`/admin/users/${customerId}`);
    return unwrapApiResponse<AdminUserDetail>(response.data);
  },

  getUserDetailBySelfLink: async (selfLink: string): Promise<AdminUserDetail> => {
    const normalizedPath = selfLink.startsWith('/api/')
      ? selfLink.replace('/api', '')
      : selfLink;
    const response = await adminApiClient.get(normalizedPath);
    return unwrapApiResponse<AdminUserDetail>(response.data);
  },

  updateKycStatus: async (customerId: string, kycStatus: KycStatus): Promise<void> => {
    await adminApiClient.put(`/admin/users/${customerId}/kyc-status`, { kycStatus });
  },
};
