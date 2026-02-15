import { KycStatus } from '@/types';
import { AdminUsersView } from './AdminUsersView';

export const AdminKycReviewPage = () => {
  return (
    <AdminUsersView
      title="KYC Review Queue"
      subtitle="Preset for pending KYC verification use case"
      initialFilters={{ kycStatus: KycStatus.PENDING, page: 0, size: 20 }}
      actionType="kyc"
    />
  );
};
