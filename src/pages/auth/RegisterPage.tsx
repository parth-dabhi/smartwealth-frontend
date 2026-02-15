import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Gender } from '@/types';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Full name must be between 3 and 100 characters').max(100, 'Full name must be between 3 and 100 characters'),
    email: z.string().trim().email('Enter valid email'),
    mobileNumber: z.string().trim().regex(/^\d{10}$/, 'Mobile number must have exactly 10 digits'),
    password: z.string().min(8, 'Password must be between 8 and 15 characters').max(15, 'Password must be between 8 and 15 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((value) => {
        const dob = new Date(value);
        if (Number.isNaN(dob.getTime())) return false;
        const today = new Date();
        if (dob >= today) return false;
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();
        const isAdult = age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
        return isAdult;
      }, 'You must be at least 18 years old'),
    gender: z.nativeEnum(Gender, { message: 'Gender is required' }),
    addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255, 'Address line 1 is too long'),
    addressLine2: z.string().trim().max(255, 'Address line 2 is too long').optional().or(z.literal('')),
    city: z.string().trim().min(1, 'City is required').max(100, 'City is too long'),
    state: z.string().trim().min(1, 'State is required').max(100, 'State is too long'),
    postalCode: z.string().trim().min(6, 'Postal code must be at least 6 characters').max(20, 'Postal code must be at most 20 characters'),
    country: z.string().trim().min(1, 'Country is required').max(100, 'Country is too long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: Gender.MALE,
      country: 'India',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const registeredUser = await authApi.register({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        mobileNumber: data.mobileNumber.trim(),
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: {
          addressLine1: data.addressLine1.trim(),
          addressLine2: data.addressLine2?.trim() || '',
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim(),
          country: data.country.trim(),
        },
      });

      // Backend register response returns user profile. Use returned customerId to auto-login.
      const loginResponse = await authApi.login({
        customerId: registeredUser.customerId,
        password: data.password,
      });

      setTokens(loginResponse.accessToken, loginResponse.refreshToken);
      setUser(loginResponse.user);
      toast.success(`Registration successful. Welcome, ${loginResponse.user.fullName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-sky-100 py-10 px-4">
      <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-xl border border-gray-100 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-600">Create Your SmartWealth Account</h1>
          <p className="text-gray-600 mt-2">Complete your details to register and start investing.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" placeholder="Enter full name" {...register('fullName')} />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="Enter email" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input className="input-field" placeholder="10-digit mobile number" maxLength={10} {...register('mobileNumber')} />
              {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber.message}</p>}
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input-field" {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" {...register('gender')}>
                <option value={Gender.MALE}>MALE</option>
                <option value={Gender.FEMALE}>FEMALE</option>
                <option value={Gender.OTHER}>OTHER</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input-field" placeholder="Country" {...register('country')} />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Address Line 1</label>
              <input className="input-field" placeholder="House / Street / Area" {...register('addressLine1')} />
              {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Address Line 2 (Optional)</label>
              <input className="input-field" placeholder="Landmark / Locality" {...register('addressLine2')} />
              {errors.addressLine2 && <p className="mt-1 text-sm text-red-600">{errors.addressLine2.message}</p>}
            </div>
            <div>
              <label className="label">City</label>
              <input className="input-field" placeholder="City" {...register('city')} />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>
            <div>
              <label className="label">State</label>
              <input className="input-field" placeholder="State" {...register('state')} />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
            </div>
            <div>
              <label className="label">Postal Code</label>
              <input className="input-field" placeholder="Postal code" {...register('postalCode')} />
              {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Password</label>
              <input type="password" className="input-field" placeholder="8 to 15 characters" {...register('password')} />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input-field" placeholder="Re-enter password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
