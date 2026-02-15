import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '@/api';
import { AdminUserListItem, KycStatus } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { formatDate } from '@/utils/helpers';

export const AdminPage = () => {
  const { admin, logout } = useAdminAuthStore();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const safeUsers = Array.isArray(users) ? users : [];

  const totalUsers = useMemo(() => safeUsers.length, [safeUsers]);
  const pendingKyc = useMemo(
    () => safeUsers.filter((user) => user.kycStatus === KycStatus.PENDING).length,
    [safeUsers]
  );

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers({ page: 0, size: 50 });
      const normalizedUsers = Array.isArray((response as any)?.content)
        ? (response as any).content
        : Array.isArray(response)
        ? response
        : [];
      setUsers(normalizedUsers);
    } catch (error) {
      toast.error('Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateKycStatus = async (customerId: string, status: KycStatus) => {
    try {
      setIsSaving(customerId);
      await adminApi.updateKycStatus(customerId, status);
      toast.success(`KYC updated to ${status}`);
      setUsers((prev) =>
        prev.map((user) =>
          user.customerId === customerId ? { ...user, kycStatus: status } : user
        )
      );
    } catch (error) {
      toast.error('Failed to update KYC');
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-gray-600 text-sm mt-1">
            Logged in as {admin?.fullName || admin?.customerId || 'Admin'}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Users Loaded</p>
          <p className="text-2xl font-bold mt-1">{totalUsers}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Pending KYC</p>
          <p className="text-2xl font-bold mt-1">{pendingKyc}</p>
        </Card>
      </div>

      <Card title="User KYC Management">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Customer ID</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Created</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">KYC</th>
                <th className="text-right py-3 px-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                safeUsers.map((user) => (
                  <tr key={user.customerId} className="border-b">
                    <td className="py-3 px-3 text-sm font-medium">{user.customerId}</td>
                    <td className="py-3 px-3 text-sm">{user.fullName}</td>
                    <td className="py-3 px-3 text-sm">{user.email}</td>
                    <td className="py-3 px-3 text-sm">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                    <td className="py-3 px-3 text-sm">{user.kycStatus}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={isSaving === user.customerId}
                          disabled={user.kycStatus === KycStatus.VERIFIED}
                          onClick={() => updateKycStatus(user.customerId, KycStatus.VERIFIED)}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={isSaving === user.customerId}
                          disabled={user.kycStatus === KycStatus.REJECTED}
                          onClick={() => updateKycStatus(user.customerId, KycStatus.REJECTED)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
