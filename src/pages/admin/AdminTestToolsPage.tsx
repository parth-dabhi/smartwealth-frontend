import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { adminOpsApi } from '@/api/adminOps';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const ADMIN_LINKS = [
  { to: '/admin/users', label: 'All Users' },
  { to: '/admin/kyc-review', label: 'KYC Review' },
  { to: '/admin/test-tools', label: 'Test Tools' },
];

const toDdMmmYyyy = (inputDate: string) => {
  if (!inputDate) return '';
  const [yyyy, mm, dd] = inputDate.split('-');
  const monthMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = Number(mm) - 1;
  const monthText = monthMap[monthIndex] ?? 'Jan';
  return `${dd}-${monthText}-${yyyy}`;
};

export const AdminTestToolsPage = () => {
  const location = useLocation();
  const { admin, logout } = useAdminAuthStore();
  const [historicalDate, setHistoricalDate] = useState('');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [result, setResult] = useState<{
    action: string;
    ok: boolean;
    payload: unknown;
  } | null>(null);

  const runAction = async (key: string, action: string, fn: () => Promise<unknown>) => {
    try {
      setLoadingKey(key);
      const payload = await fn();
      setResult({ action, ok: true, payload });
      toast.success(`${action} success`);
    } catch (error) {
      const err = error as AxiosError<any>;
      const payload = err?.response?.data ?? err?.message ?? 'Request failed';
      setResult({ action, ok: false, payload });
      toast.error(`${action} failed`);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Test Tools</h1>
          <p className="text-sm text-gray-600 mt-1">Trigger backend test operations and inspect response payloads.</p>
          <p className="text-gray-600 text-sm">
            Logged in as {admin?.fullName || admin?.customerId || 'Admin'}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              location.pathname === link.to
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <Card title="API Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="secondary"
            isLoading={loadingKey === 'importToday'}
            onClick={() => runAction('importToday', 'NAV Import Today', () => adminOpsApi.importNavToday())}
          >
            NAV Import Today
          </Button>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              className="input-field flex-1 min-w-[170px]"
              value={historicalDate}
              onChange={(e) => setHistoricalDate(e.target.value)}
            />
            <Button
              variant="secondary"
              isLoading={loadingKey === 'importHistorical'}
              disabled={!historicalDate}
              onClick={() =>
                runAction('importHistorical', 'NAV Import Historical', () =>
                  adminOpsApi.importNavHistorical(toDdMmmYyyy(historicalDate))
                )
              }
            >
              Import Historical
            </Button>
          </div>

          <Button
            variant="secondary"
            isLoading={loadingKey === 'runPending'}
            onClick={() =>
              runAction('runPending', 'Investment Allotment Pending', () => adminOpsApi.runPendingAllotment())
            }
          >
            Run Pending Allotment
          </Button>

          <Button
            variant="secondary"
            isLoading={loadingKey === 'runNavPending'}
            onClick={() =>
              runAction('runNavPending', 'Investment Allotment NAV Pending', () => adminOpsApi.runNavPendingAllotment())
            }
          >
            Run NAV Pending Allotment
          </Button>

          <Button
            variant="secondary"
            isLoading={loadingKey === 'sipExecute'}
            onClick={() => runAction('sipExecute', 'SIP Execution', () => adminOpsApi.executeSips())}
          >
            Execute SIP
          </Button>

          <Button
            variant="secondary"
            isLoading={loadingKey === 'tradingHoliday'}
            onClick={() => runAction('tradingHoliday', 'Trading Holiday Import', () => adminOpsApi.importTradingHoliday())}
          >
            Import Trading Holiday
          </Button>
        </div>
      </Card>

      <Card title="Response">
        {!result ? (
          <p className="text-sm text-gray-500">Run an action to view API response.</p>
        ) : (
          <div className="space-y-2">
            <p className={`text-sm font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.action}: {result.ok ? 'SUCCESS' : 'FAILED'}
            </p>
            <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg overflow-auto max-h-[420px]">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};
