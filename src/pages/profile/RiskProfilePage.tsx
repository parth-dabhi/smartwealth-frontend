import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userApi } from '@/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, ShieldCheck, Scale, Gauge, Flame, Rocket } from 'lucide-react';

type DurationBucket = 'SHORT' | 'MID' | 'LONG';

interface RiskRow {
  riskProfileId: number;
  label: string;
  summary: string;
  suitableFor: string;
  mix: Record<DurationBucket, { equity: number; debt: number }>;
}

const RISK_ROWS: RiskRow[] = [
  {
    riskProfileId: 1,
    label: 'Risk Averse',
    summary: 'Minimal risk, capital preservation focus',
    suitableFor: 'Risk-averse investors, short-term goals',
    mix: {
      SHORT: { equity: 0, debt: 100 },
      MID: { equity: 5, debt: 95 },
      LONG: { equity: 20, debt: 80 },
    },
  },
  {
    riskProfileId: 2,
    label: 'Conservative',
    summary: 'Low risk, stable returns',
    suitableFor: 'Low risk tolerance, near-term goals',
    mix: {
      SHORT: { equity: 5, debt: 95 },
      MID: { equity: 25, debt: 75 },
      LONG: { equity: 55, debt: 45 },
    },
  },
  {
    riskProfileId: 3,
    label: 'Moderate',
    summary: 'Balanced risk and returns',
    suitableFor: 'Medium-term goals, balanced approach',
    mix: {
      SHORT: { equity: 35, debt: 65 },
      MID: { equity: 55, debt: 45 },
      LONG: { equity: 85, debt: 15 },
    },
  },
  {
    riskProfileId: 4,
    label: 'Aggressive',
    summary: 'High risk, higher potential returns',
    suitableFor: 'Long-term goals, high risk tolerance',
    mix: {
      SHORT: { equity: 55, debt: 45 },
      MID: { equity: 75, debt: 25 },
      LONG: { equity: 90, debt: 10 },
    },
  },
  {
    riskProfileId: 5,
    label: 'Very Aggressive',
    summary: 'Maximum risk, maximum growth potential',
    suitableFor: 'Very long-term goals, highest risk appetite',
    mix: {
      SHORT: { equity: 70, debt: 30 },
      MID: { equity: 90, debt: 10 },
      LONG: { equity: 95, debt: 5 },
    },
  },
];

const iconForRisk = (id: number) => {
  if (id === 1) return <ShieldCheck className="h-10 w-10 text-sky-700" />;
  if (id === 2) return <Scale className="h-10 w-10 text-emerald-700" />;
  if (id === 3) return <Gauge className="h-10 w-10 text-indigo-700" />;
  if (id === 4) return <Flame className="h-10 w-10 text-amber-700" />;
  return <Rocket className="h-10 w-10 text-rose-700" />;
};

const durationLabel: Record<DurationBucket, string> = {
  SHORT: 'Short (<= 36 months)',
  MID: 'Mid (37-84 months)',
  LONG: 'Long (> 84 months)',
};

export const RiskProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [selectedRiskId, setSelectedRiskId] = useState<number>(Number(user?.riskProfileId || 3));
  const [isSaving, setIsSaving] = useState(false);
  const selectedRow = useMemo(
    () => RISK_ROWS.find((row) => row.riskProfileId === selectedRiskId) ?? RISK_ROWS[2],
    [selectedRiskId]
  );

  const updateRiskProfile = async () => {
    try {
      setIsSaving(true);
      await userApi.updateRiskProfile(selectedRiskId);
      if (user) {
        setUser({
          ...user,
          riskProfileId: selectedRiskId,
          riskProfile: selectedRow.label,
        });
      }
      toast.success('Risk profile updated');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update risk profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/profile')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={updateRiskProfile} isLoading={isSaving}>
          Save Risk Profile
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Change Risk Profile</h1>
        <p className="text-gray-600 mt-1">Choose your risk appetite and see Equity/Debt mix by goal duration.</p>
      </div>

      <Card title="Risk Levels">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {RISK_ROWS.map((row) => (
            <button
              key={row.riskProfileId}
              type="button"
              onClick={() => setSelectedRiskId(row.riskProfileId)}
              className={`border rounded-xl p-3 text-left transition-colors ${
                selectedRiskId === row.riskProfileId
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {iconForRisk(row.riskProfileId)}
                <p className="font-semibold text-gray-900">{row.label}</p>
              </div>
              <p className="mt-1 text-sm text-gray-700">{row.summary}</p>
              <p className="mt-1 text-xs text-gray-500">{row.suitableFor}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Allocation Mix" subtitle="Based on backend risk and duration bucket rules">
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
          <div className="flex items-center gap-2">
            {iconForRisk(selectedRow.riskProfileId)}
            <p className="font-semibold text-gray-900">{selectedRow.label}</p>
          </div>
          <p className="text-sm text-gray-700 mt-1">{selectedRow.summary}</p>
          <p className="text-xs text-gray-500 mt-1">{selectedRow.suitableFor}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(durationLabel) as DurationBucket[]).map((bucket) => {
            const equity = selectedRow.mix[bucket].equity;
            const debt = selectedRow.mix[bucket].debt;
            return (
              <div key={bucket} className="rounded-xl border border-gray-200 p-3 bg-white">
                <p className="text-xs text-gray-600">{durationLabel[bucket]}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">
                    Eq {equity}%
                  </span>
                  <span className="inline-flex rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-xs">
                    Debt {debt}%
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${equity}%` }}
                    />
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${debt}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};
