import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { adminAuthApi } from '@/api';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { Button } from '@/components/common/Button';

const adminLoginSchema = z.object({
  customerId: z.string().trim().length(8, 'Customer ID must be exactly 8 characters'),
  password: z.string().min(8, 'Password must be between 8 and 15 characters').max(15, 'Password must be between 8 and 15 characters'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { setAdmin, setTokens } = useAdminAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    try {
      const response = await adminAuthApi.login({
        customerId: data.customerId.trim(),
        password: data.password,
      });
      setTokens(response.accessToken, response.refreshToken);
      setAdmin(response.user);
      toast.success('Admin login successful');
      navigate('/admin/users');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-700">SmartWealth Admin</h1>
          <p className="text-gray-600 mt-2">Sign in with an admin account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="label">Customer ID</label>
            <input
              type="text"
              {...register('customerId', {
                setValueAs: (value: string) => (typeof value === 'string' ? value.trim() : value),
              })}
              className="input-field"
              placeholder="Enter admin customer ID"
            />
            {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" {...register('password')} className="input-field" placeholder="Enter password" />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Admin Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            User account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Go to user login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
