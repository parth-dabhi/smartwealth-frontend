import { UserRole } from '@/types';
import { AdminUsersView } from './AdminUsersView';

export const AdminRolesPage = () => {
  return (
    <AdminUsersView
      title="Role Based Users"
      subtitle="Use case for role filter (USER/ADMIN)"
      initialFilters={{ role: UserRole.USER, page: 0, size: 20 }}
    />
  );
};
