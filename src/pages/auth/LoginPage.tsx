import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { UserRole } from '@/types';

const loginSchema = z.object({
  customerId: z
    .string()
    .trim()
    .length(8, 'Customer ID must be exactly 8 characters'),
  password: z
    .string()
    .min(8, 'Password must be between 8 and 15 characters')
    .max(15, 'Password must be between 8 and 15 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({
        customerId: data.customerId.trim(),
        password: data.password,
      });
      if (response.user.role === UserRole.ADMIN) {
        toast.error('This account is admin. Please use admin login.');
        return;
      }
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">SmartWealth</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
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
              placeholder="Enter your customer ID"
            />
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              {...register('password')}
              className="input-field"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Register here
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Admin account?{' '}
            <Link to="/admin/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in as admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
