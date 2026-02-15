import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { formatDate } from '@/utils/helpers';
import { Button } from '@/components/common/Button';

const display = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);

  const fullAddress = useMemo(() => {
    if (!user?.address) return '-';
    const parts = [
      user.address.addressLine1,
      user.address.addressLine2,
      user.address.city,
      user.address.state,
      user.address.postalCode,
      user.address.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  }, [user]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-600 mt-1">Your account information</p>
      </div>

      <Card className="p-5">
        <div className="space-y-4 text-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Basic Details</h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Full Name</span>
                <span className="font-semibold text-right">{display(user?.fullName)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Customer ID</span>
                <span className="font-semibold text-right">{display(user?.customerId)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Email</span>
                <span className="font-semibold text-right">{display(user?.email)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Mobile Number</span>
                <span className="font-semibold text-right">{display(user?.mobileNumber ?? user?.phoneNumber)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Date Of Birth</span>
                <span className="font-semibold text-right">{user?.dateOfBirth ? formatDate(user.dateOfBirth) : '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Gender</span>
                <span className="font-semibold text-right">{display(user?.gender)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
            <div className="mt-2 mb-3">
              <Link to="/profile/risk-profile">
                <Button type="button" size="sm">Change Risk Profile</Button>
              </Link>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Role</span>
                <span className="font-semibold text-right">{display(user?.role)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">KYC Status</span>
                <span className="font-semibold text-right">{display(user?.kycStatus)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Risk Profile</span>
                <span className="font-semibold text-right">{display(user?.riskProfile)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
                <span className="text-gray-600">Last Login</span>
                <span className="font-semibold text-right">{display(user?.lastLoginAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5 md:col-span-2">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-right">{user?.active === true || user?.isActive === true ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
            <p className="mt-2 text-gray-800">{fullAddress}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
