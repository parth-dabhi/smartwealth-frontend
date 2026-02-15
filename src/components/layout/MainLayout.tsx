import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { walletApi } from '@/api';
import { WalletBalance } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import {
  LayoutDashboard,
  Wallet,
  WalletCards,
  Landmark,
  History,
  Goal,
  CalendarDays,
  Users,
  User,
  LogOut,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Family Portfolio', href: '/family-portfolio', icon: WalletCards },
  { name: 'Goals', href: '/goals', icon: Goal },
  { name: 'Mutual Fund Schemes', href: '/mutual-fund-schemes', icon: Landmark },
  { name: 'SIPs', href: '/sips', icon: CalendarDays },
  { name: 'Family Access', href: '/family', icon: Users },
  { name: 'Order History', href: '/order-history', icon: History },
];

export const MainLayout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const walletPopoverRef = useRef<HTMLDivElement | null>(null);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!showWalletPopup) return;
      if (!walletPopoverRef.current) return;
      if (!walletPopoverRef.current.contains(event.target as Node)) {
        setShowWalletPopup(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showWalletPopup]);

  const isNavItemActive = (href: string) => {
    if (location.pathname === href) return true;
    return location.pathname.startsWith(`${href}/`);
  };

  const openWalletPopup = async () => {
    const nextOpen = !showWalletPopup;
    setShowWalletPopup(nextOpen);
    if (!nextOpen || isWalletLoading) return;

    try {
      setIsWalletLoading(true);
      const data = await walletApi.getBalance();
      setWalletBalance(data);
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="no-underline">
              <h1 className="m-0 text-2xl font-bold tracking-normal text-primary-700 hover:text-primary-800 transition-colors">
                SmartWealth
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden sm:block text-lg text-gray-800">
              Welcome, <span className="font-semibold text-gray-900">{user?.fullName || 'User'}</span>
            </p>
            <div className="relative" ref={walletPopoverRef}>
              <button
                type="button"
                onClick={openWalletPopup}
                className="inline-flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 p-2 text-primary-700 hover:bg-primary-100 transition-colors"
                title="Wallet"
                aria-label="Wallet"
              >
                <Wallet className="h-4 w-4" />
              </button>

              {showWalletPopup && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg p-1.5 z-50">
                  <p className="text-sm font-semibold text-gray-900 text-center mb-1.5">Wallet</p>

                  {isWalletLoading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="rounded-lg bg-white px-2 py-1">
                        <p className="text-[11px] text-gray-600">Total Balance</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(walletBalance?.balance ?? 0)}</p>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-1">
                        <p className="text-[11px] text-gray-600">Available Balance</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(walletBalance?.availableBalance ?? 0)}</p>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-1">
                        <p className="text-[11px] text-gray-600">Locked Balance</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(walletBalance?.lockedBalance ?? 0)}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <Link
                      to="/wallet"
                      onClick={() => setShowWalletPopup(false)}
                      className="text-xs font-semibold text-primary-700 hover:text-primary-800"
                    >
                      More
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 p-2 text-primary-700 hover:bg-primary-100 transition-colors"
              title="Profile"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-11 mb-2 flex justify-center px-">
        <nav className="w-fit rounded-2xl border border-gray-200 bg-white shadow-sm px-3 py-2 overflow-x-auto max-w-full">
          <div className="flex items-center justify-center gap-2 min-w-max">
            {navigation.map((item) => {
              const isActive = isNavItemActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-100'
                      : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <main className="p-6 md:p-8">{children}</main>

      <footer className="mt-8 border-t border-gray-200">
        <div className="px-4 md:px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} SmartWealth. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
