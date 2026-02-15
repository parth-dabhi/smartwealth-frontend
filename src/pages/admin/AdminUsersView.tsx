import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi, AdminUserFilters } from '@/api/admin';
import { AdminUserDetail, AdminUserListItem, KycStatus, PaginationMeta, UserRole } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface AdminUsersViewProps {
  title: string;
  subtitle: string;
  initialFilters?: Partial<AdminUserFilters>;
  actionType?: 'profile' | 'kyc';
}

type UiFilters = {
  customerId: string;
  fullName: string;
  kycStatus: '' | KycStatus;
  role: '' | UserRole;
  isActive: '' | 'true' | 'false';
  size: number;
};

const ADMIN_LINKS = [
  { to: '/admin/users', label: 'All Users' },
  { to: '/admin/kyc-review', label: 'KYC Review' },
  { to: '/admin/test-tools', label: 'Test Tools' },
];

const defaultMeta: PaginationMeta = {
  currentPage: 0,
  totalPages: 1,
  pageSize: 20,
  totalElements: 0,
  first: true,
  last: true,
};

const display = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

export const AdminUsersView = ({
  title,
  subtitle,
  initialFilters,
  actionType = 'profile',
}: AdminUsersViewProps) => {
  const { admin, logout } = useAdminAuthStore();
  const location = useLocation();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [kycActionCustomerId, setKycActionCustomerId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [filters, setFilters] = useState<UiFilters>({
    customerId: initialFilters?.customerId ?? '',
    fullName: initialFilters?.fullName ?? '',
    kycStatus: initialFilters?.kycStatus ?? '',
    role: initialFilters?.role ?? '',
    isActive:
      typeof initialFilters?.isActive === 'boolean'
        ? String(initialFilters.isActive) as 'true' | 'false'
        : '',
    size: initialFilters?.size ?? 20,
  });
  const [appliedFilters, setAppliedFilters] = useState<AdminUserFilters>({
    customerId: initialFilters?.customerId,
    fullName: initialFilters?.fullName,
    kycStatus: initialFilters?.kycStatus,
    role: initialFilters?.role,
    isActive: initialFilters?.isActive,
    size: initialFilters?.size ?? 20,
  });
  const [page, setPage] = useState(initialFilters?.page ?? 0);

  const safeUsers = Array.isArray(users) ? users : [];
  const hasNext = meta.currentPage + 1 < Math.max(1, meta.totalPages);

  const fetchUsers = useCallback(async () => {
    try {
      const loadingNextPage = actionType === 'kyc' && page > 0;
      if (loadingNextPage) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }
      const response = await adminApi.getUsers({
        customerId: appliedFilters.customerId,
        fullName: appliedFilters.fullName,
        kycStatus: appliedFilters.kycStatus,
        role: appliedFilters.role,
        isActive: appliedFilters.isActive,
        page,
        size: appliedFilters.size ?? filters.size,
      });

      const content = Array.isArray((response as any)?.content)
        ? (response as any).content
        : Array.isArray((response as any)?.data)
        ? (response as any).data
        : Array.isArray((response as any)?.users)
        ? (response as any).users
        : Array.isArray(response)
        ? response
        : [];

      const responseMeta = (response as any)?.meta;
      const normalizedMeta: PaginationMeta = responseMeta
        ? {
            currentPage: Number(responseMeta.currentPage ?? responseMeta.page ?? page),
            totalPages: Math.max(1, Number(responseMeta.totalPages ?? 1)),
            pageSize: Number(responseMeta.pageSize ?? responseMeta.size ?? appliedFilters.size ?? filters.size),
            totalElements: Number(responseMeta.totalElements ?? content.length),
            first: Boolean(responseMeta.first ?? page <= 0),
            last: Boolean(responseMeta.last ?? true),
          }
        : {
            currentPage: page,
            totalPages: 1,
            pageSize: appliedFilters.size ?? filters.size,
            totalElements: content.length,
            first: true,
            last: true,
          };

      setUsers((prev) => (actionType === 'kyc' && page > 0 ? [...prev, ...content] : content));
      setMeta(normalizedMeta);
    } catch (error) {
      toast.error('Failed to load admin users');
    } finally {
      if (actionType === 'kyc' && page > 0) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [appliedFilters, page, actionType, filters.size]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const loadNextPage = useCallback(() => {
    if (actionType !== 'kyc') return;
    if (isLoading || isFetchingMore || !hasNext) return;
    setPage((prev) => prev + 1);
  }, [actionType, isLoading, isFetchingMore, hasNext]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: actionType === 'kyc' ? hasNext : false,
    isLoading: isLoading || isFetchingMore,
    onLoadMore: loadNextPage,
  });

  const openUserProfile = async (user: AdminUserListItem) => {
    try {
      setIsProfileLoading(true);
      const detail = user._links?.self
        ? await adminApi.getUserDetailBySelfLink(user._links.self)
        : await adminApi.getUserDetail(user.customerId);
      setSelectedUser(detail);
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const closeUserProfile = () => {
    setSelectedUser(null);
  };

  const updateKycStatus = async (customerId: string, kycStatus: KycStatus) => {
    try {
      setKycActionCustomerId(customerId);
      await adminApi.updateKycStatus(customerId, kycStatus);
      toast.success(`KYC updated to ${kycStatus}`);
      setUsers((prev) =>
        prev.map((user) =>
          user.customerId === customerId ? { ...user, kycStatus } : user
        )
      );
    } catch (error) {
      toast.error('Failed to update KYC status');
    } finally {
      setKycActionCustomerId(null);
    }
  };

  const onApplyFilters = () => {
    setAppliedFilters({
      customerId: filters.customerId.trim() || undefined,
      fullName: filters.fullName.trim() || undefined,
      kycStatus: filters.kycStatus || undefined,
      role: filters.role || undefined,
      isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
      size: filters.size,
    });
    setPage(0);
  };

  const onResetFilters = () => {
    setFilters({
      customerId: '',
      fullName: '',
      kycStatus: '',
      role: '',
      isActive: '',
      size: 20,
    });
    setAppliedFilters({
      customerId: undefined,
      fullName: undefined,
      kycStatus: undefined,
      role: undefined,
      isActive: undefined,
      size: 20,
    });
    setPage(0);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
          <p className="text-gray-600 text-sm">
            Logged in as {admin?.fullName || admin?.customerId || 'Admin'}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              location.pathname === link.to
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Page Users</p>
          <p className="text-2xl font-bold mt-1">{safeUsers.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Current Page</p>
          <p className="text-2xl font-bold mt-1">{meta.currentPage + 1}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Results</p>
          <p className="text-2xl font-bold mt-1">{meta.totalElements}</p>
        </Card>
      </div>

      {actionType !== 'kyc' && (
        <Card title="Backend Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input-field"
            placeholder="Customer ID"
            value={filters.customerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Full Name"
            value={filters.fullName}
            onChange={(e) => setFilters((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <select
            className="input-field"
            value={filters.kycStatus}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                kycStatus: e.target.value as UiFilters['kycStatus'],
              }))
            }
          >
            <option value="">All KYC</option>
            <option value={KycStatus.PENDING}>PENDING</option>
            <option value={KycStatus.VERIFIED}>VERIFIED</option>
            <option value={KycStatus.REJECTED}>REJECTED</option>
          </select>
          <select
            className="input-field"
            value={filters.role}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                role: e.target.value as UiFilters['role'],
              }))
            }
          >
            <option value="">All Roles</option>
            <option value={UserRole.USER}>USER</option>
            <option value={UserRole.ADMIN}>ADMIN</option>
          </select>
          <select
            className="input-field"
            value={filters.isActive}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                isActive: e.target.value as UiFilters['isActive'],
              }))
            }
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className="input-field"
            value={filters.size}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                size: Number(e.target.value),
              }))
            }
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onApplyFilters}>
            Apply Filters
          </Button>
          <Button size="sm" variant="secondary" onClick={onResetFilters}>
            Reset
          </Button>
        </div>
        </Card>
      )}

      <Card title="Users">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Customer ID</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-right py-3 px-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                safeUsers.map((user) => (
                  <tr key={user.customerId} className="border-b">
                    <td className="py-3 px-3 text-sm font-medium">{user.customerId}</td>
                    <td className="py-3 px-3 text-sm">{user.fullName}</td>
                    <td className="py-3 px-3 text-right">
                      {actionType === 'kyc' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateKycStatus(user.customerId, KycStatus.VERIFIED)}
                            isLoading={kycActionCustomerId === user.customerId}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateKycStatus(user.customerId, KycStatus.REJECTED)}
                            isLoading={kycActionCustomerId === user.customerId}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openUserProfile(user)}
                          isLoading={isProfileLoading}
                        >
                          View Profile
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {actionType === 'kyc' ? (
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingMore ? <span className="text-sm text-gray-500">Loading more users...</span> : null}
            {!hasNext && safeUsers.length > 0 ? <span className="text-sm text-gray-400">End of users list</span> : null}
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {meta.currentPage + 1} of {Math.max(1, meta.totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.currentPage <= 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.currentPage + 1 >= Math.max(1, meta.totalPages)}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {actionType === 'profile' && (isProfileLoading || selectedUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={closeUserProfile}>
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">User Profile</h3>
              <Button type="button" size="sm" variant="secondary" onClick={closeUserProfile}>
                Close
              </Button>
            </div>
            <div className="p-5">
              {isProfileLoading ? (
                <LoadingSpinner />
              ) : selectedUser ? (
                <div className="space-y-5 max-h-[70vh] overflow-auto pr-1">
                  <Card className="p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Basic Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Customer ID</span>
                        <span className="font-semibold">{display(selectedUser.customerId)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Full Name</span>
                        <span className="font-semibold">{display(selectedUser.fullName)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Email</span>
                        <span className="font-semibold">{display(selectedUser.email)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Mobile</span>
                        <span className="font-semibold">{display(selectedUser.mobileNumber ?? selectedUser.phoneNumber)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Date Of Birth</span>
                        <span className="font-semibold">{display(selectedUser.dateOfBirth)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Gender</span>
                        <span className="font-semibold">{display(selectedUser.gender)}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Account Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Role</span>
                        <span className="font-semibold">{display(selectedUser.role)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">KYC Status</span>
                        <span className="font-semibold">{display(selectedUser.kycStatus)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold">
                          {selectedUser.isActive === true || selectedUser.active === true ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="text-gray-600">Risk Profile</span>
                        <span className="font-semibold">{display(selectedUser.riskProfile)}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Address</h4>
                    <p className="text-sm text-gray-800">
                      {[
                        (selectedUser.address as any)?.addressLine1 ?? selectedUser.address?.street,
                        (selectedUser.address as any)?.addressLine2,
                        selectedUser.address?.city,
                        selectedUser.address?.state,
                        (selectedUser.address as any)?.postalCode ?? selectedUser.address?.pincode,
                        selectedUser.address?.country,
                      ]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </Card>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
