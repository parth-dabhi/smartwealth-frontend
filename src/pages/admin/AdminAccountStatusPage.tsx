import { AdminUsersView } from './AdminUsersView';

export const AdminAccountStatusPage = () => {
  return (
    <AdminUsersView
      title="Account Status"
      subtitle="Use case for active/inactive account filtering"
      initialFilters={{ isActive: true, page: 0, size: 20 }}
    />
  );
};
