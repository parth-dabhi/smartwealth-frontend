import { AdminUsersView } from './AdminUsersView';

export const AdminUsersPage = () => {
  return (
    <AdminUsersView
      title="Admin Users"
      subtitle="All users with full backend filters"
      initialFilters={{ page: 0, size: 20 }}
    />
  );
};
