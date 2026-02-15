import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { investmentApi, portfolioApi } from '@/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/utils/helpers';
import { ArrowLeft } from 'lucide-react';

type SellMode = 'UNITS' | 'AMOUNT';

interface SellLocationState {
  planId?: number;
  planName?: string;
  availableUnits?: number;
  latestNav?: number;
  from?: string;
}

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const SellPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SellLocationState | null) ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responsePopup, setResponsePopup] = useState<{
    title: string;
    payload: any;
    isError?: boolean;
  } | null>(null);

  const [planId] = useState<number | null>(state?.planId ?? null);
  const [planName, setPlanName] = useState<string>(state?.planName ?? '-');
  const [availableUnits, setAvailableUnits] = useState<number>(Number(state?.availableUnits ?? 0));
  const [latestNav, setLatestNav] = useState<number>(Number(state?.latestNav ?? 0));

  const [mode, setMode] = useState<SellMode>('UNITS');
  const [unitsInput, setUnitsInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const backRoute = state?.from || '/dashboard';

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!planId) {
        toast.error('Missing plan details for sell');
        navigate(backRoute);
        return;
      }

      try {
        // Fallback fetch if nav/units are not in navigation state.
        if (!(availableUnits > 0) || !(latestNav > 0) || planName === '-') {
          const detail: any = await portfolioApi.getPlanPortfolio(planId);
          if (!mounted) return;
          setPlanName(String(detail?.planName ?? state?.planName ?? '-'));
          setAvailableUnits(Number(detail?.units ?? detail?.totalUnits ?? 0));
          setLatestNav(Number(detail?.latestNav ?? detail?.currentNav ?? 0));
        }
      } catch (error) {
        toast.error('Failed to load latest holding data');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();
    return () => {
      mounted = false;
    };
  }, [planId, availableUnits, latestNav, planName, state?.planName, navigate, backRoute]);

  const parsedUnits = useMemo(() => toNumber(unitsInput), [unitsInput]);
  const parsedAmount = useMemo(() => toNumber(amountInput), [amountInput]);

  const calculated = useMemo(() => {
    if (mode === 'UNITS') {
      const units = parsedUnits;
      const amount = Number.isFinite(units) && units > 0 && latestNav > 0 ? units * latestNav : 0;
      return { units, amount };
    }

    const amount = parsedAmount;
    const units = Number.isFinite(amount) && amount > 0 && latestNav > 0 ? amount / latestNav : 0;
    return { units, amount };
  }, [mode, parsedUnits, parsedAmount, latestNav]);

  const validationError = useMemo(() => {
    if (!planId) return 'Plan is required.';
    if (availableUnits <= 0) return 'No active holding units available for sell.';

    if (mode === 'UNITS') {
      if (!unitsInput.trim()) return 'Enter units to sell.';
      if (!Number.isFinite(parsedUnits) || parsedUnits <= 0) return 'Units must be a positive number.';
      if (parsedUnits > availableUnits) {
        return `Sell exceeds holding units. Maximum available is ${availableUnits.toFixed(4)}.`;
      }
      return '';
    }

    if (!amountInput.trim()) return 'Enter amount to sell.';
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 'Amount must be a positive number.';
    if (latestNav <= 0) return 'Latest NAV is unavailable. Cannot sell by amount right now.';
    if (calculated.units > availableUnits) {
      return `Sell exceeds holding units. Equivalent units ${calculated.units.toFixed(4)} are above available ${availableUnits.toFixed(4)}.`;
    }
    return '';
  }, [planId, availableUnits, mode, unitsInput, amountInput, parsedUnits, parsedAmount, latestNav, calculated.units]);

  const submitSell = async () => {
    if (validationError || !planId) return;

    try {
      setIsSubmitting(true);

      const payload =
        mode === 'UNITS'
          ? { planId, units: Number(parsedUnits.toFixed(8)) }
          : { planId, amount: Number(parsedAmount.toFixed(2)) };

      const response = await investmentApi.sell(payload);
      setResponsePopup({
        title: 'Sell Order Response',
        payload: response,
      });
      toast.success('Sell order placed successfully');
      setUnitsInput('');
      setAmountInput('');
    } catch (error: any) {
      setResponsePopup({
        title: 'Sell Order Failed',
        payload: error?.response?.data ?? error,
        isError: true,
      });
      toast.error(error?.response?.data?.message || 'Failed to place sell order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate(backRoute)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-red-600">Sell</h1>
      </div>

      <Card title="Holding Snapshot">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Plan</p>
            <p className="font-semibold">{planName}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Plan ID</p>
            <p className="font-semibold">{planId ?? '-'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Available Units</p>
            <p className="font-semibold">{availableUnits.toFixed(4)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Latest NAV</p>
            <p className="font-semibold">{formatCurrency(latestNav || 0)}</p>
          </div>
        </div>
      </Card>

      <Card title="Sell Type (Lumpsum Only)">
        <div className="flex gap-3">
          <Button
            variant={mode === 'UNITS' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('UNITS');
              setAmountInput('');
            }}
          >
            Sell by Units
          </Button>
          <Button
            variant={mode === 'AMOUNT' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('AMOUNT');
              setUnitsInput('');
            }}
          >
            Sell by Amount
          </Button>
        </div>
      </Card>

      <Card title={mode === 'UNITS' ? 'Units Input' : 'Amount Input'}>
        <div className="max-w-md space-y-3">
          {mode === 'UNITS' ? (
            <>
              <label className="label">Units to Sell</label>
              <input
                type="number"
                className="input-field"
                placeholder="Enter units"
                value={unitsInput}
                onChange={(e) => setUnitsInput(e.target.value)}
                min="0.00000001"
                step="0.00000001"
              />
              <p className="text-sm text-gray-600">
                Estimated Amount: <span className="font-semibold">{formatCurrency(calculated.amount || 0)}</span>
              </p>
            </>
          ) : (
            <>
              <label className="label">Amount to Sell</label>
              <input
                type="number"
                className="input-field"
                placeholder="Enter amount"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                min="1"
                step="0.01"
              />
              <p className="text-sm text-gray-600">
                Estimated Units: <span className="font-semibold">{Number.isFinite(calculated.units) ? calculated.units.toFixed(4) : '0.0000'}</span>
              </p>
            </>
          )}

          {!!validationError && <p className="text-sm text-red-600">{validationError}</p>}
        </div>
      </Card>

      <div>
        <Button
          variant="danger"
          onClick={submitSell}
          isLoading={isSubmitting}
          disabled={!!validationError}
        >
          Confirm Sell
        </Button>
      </div>

      {responsePopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setResponsePopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${responsePopup.isError ? 'text-red-600' : 'text-green-700'}`}>
                {responsePopup.title}
              </h3>
              <Button variant="secondary" size="sm" onClick={() => setResponsePopup(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Order ID</p>
                <p className="font-semibold">{String(responsePopup.payload?.investmentOrderId ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Plan ID</p>
                <p className="font-semibold">{String(responsePopup.payload?.planId ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">{String(responsePopup.payload?.amount ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Units Sold</p>
                <p className="font-semibold">{String(responsePopup.payload?.unitsSold ?? responsePopup.payload?.units ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Status</p>
                <p className="font-semibold">{String(responsePopup.payload?.status ?? responsePopup.payload?.orderStatus ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Applicable NAV Date</p>
                <p className="font-semibold">{String(responsePopup.payload?.applicableNavDate ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Order Time</p>
                <p className="font-semibold">{String(responsePopup.payload?.orderTime ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Message</p>
                <p className="font-semibold">{String(responsePopup.payload?.message ?? '-')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
