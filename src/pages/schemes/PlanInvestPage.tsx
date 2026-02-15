import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { investmentApi, schemesApi, sipApi } from '@/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ArrowLeft } from 'lucide-react';
import type { PlanDetailResponse } from './PlanDetailPage';

type InvestMode = 'LUMPSUM' | 'SIP';

const toIstToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    0,
    0,
    0
  );
};

const computeFirstRunDate = (sipDay: number) => {
  const today = toIstToday();
  let candidate = new Date(today.getFullYear(), today.getMonth(), sipDay);
  if (candidate.getTime() <= today.getTime()) {
    candidate = new Date(today.getFullYear(), today.getMonth() + 1, sipDay);
  }
  return candidate;
};

export const PlanInvestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();
  const locationState = (location.state as { planDetail?: PlanDetailResponse; from?: string } | null) ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [planDetail, setPlanDetail] = useState<PlanDetailResponse | null>(null);

  const [mode, setMode] = useState<InvestMode>('LUMPSUM');
  const [amount, setAmount] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [sipDay, setSipDay] = useState<number>(5);
  const [totalInstallments, setTotalInstallments] = useState('');

  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [responsePopup, setResponsePopup] = useState<{
    title: string;
    payload: any;
    isError?: boolean;
  } | null>(null);

  useEffect(() => {
    const stateDetail = locationState?.planDetail;
    if (stateDetail && Number(stateDetail.planId) === Number(planId)) {
      setPlanDetail(stateDetail);
      setIsLoading(false);
      return;
    }

    const fetchPlanDetail = async () => {
      if (!planId) {
        toast.error('Invalid plan id');
        navigate('/mutual-fund-schemes');
        return;
      }
      try {
        setIsLoading(true);
        const response = await schemesApi.getPlanDetails(Number(planId));
        setPlanDetail(response as PlanDetailResponse);
      } catch (error) {
        toast.error('Failed to load plan detail');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlanDetail();
  }, [locationState, planId, navigate]);

  const handleBack = () => {
    if (locationState?.from) {
      navigate(locationState.from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (planDetail?.planId) {
      navigate(`/mutual-fund-schemes/plans/${planDetail.planId}`);
      return;
    }

    navigate('/mutual-fund-schemes');
  };

  const firstRunDate = useMemo(() => computeFirstRunDate(sipDay), [sipDay]);

  const validateForm = () => {
    if (!planDetail?.planId) {
      toast.error('Invalid plan');
      return false;
    }

    if (mode === 'LUMPSUM') {
      const parsed = Number(amount);
      if (!parsed || parsed <= 0) {
        toast.error('Amount must be a positive number');
        return false;
      }
      const minInvestment = Number(planDetail.financials?.minInvestment ?? 0);
      if (minInvestment > 0 && parsed < minInvestment) {
        toast.error(`Minimum investment is ${formatCurrency(minInvestment)}`);
        return false;
      }
      return true;
    }

    const parsedSipAmount = Number(sipAmount);
    const parsedInstallments = Number(totalInstallments);
    if (!Number.isInteger(parsedSipAmount) || parsedSipAmount < 10 || parsedSipAmount > 1000000000) {
      toast.error('SIP amount must be whole number between 10 and 1,000,000,000');
      return false;
    }
    if (sipDay < 1 || sipDay > 28) {
      toast.error('SIP day must be between 1 and 28');
      return false;
    }
    if (!Number.isInteger(parsedInstallments) || parsedInstallments < 6 || parsedInstallments > 360) {
      toast.error('Installments must be between 6 and 360');
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!planDetail?.planId) return;
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      setIsSubmitting(true);
      if (mode === 'LUMPSUM') {
        const response = await investmentApi.buyLumpsum({
          planId: Number(planDetail.planId),
          amount: Number(amount),
        });
        setResponsePopup({ title: 'Lumpsum Order Response', payload: response });
      } else {
        const response = await sipApi.createSipMandate({
          planId: Number(planDetail.planId),
          sipAmount: Number(sipAmount),
          sipDay: Number(sipDay),
          totalInstallments: Number(totalInstallments),
        });
        setResponsePopup({ title: 'SIP Mandate Response', payload: response });
      }
      toast.success('Order placed successfully');
      setShowSummaryPopup(false);
    } catch (error: any) {
      setResponsePopup({
        title: 'Order Failed',
        payload: error?.response?.data ?? error,
        isError: true,
      });
      toast.error(error?.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!planDetail) return <Card title="Invest"><p className="text-gray-600">Plan not found.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Invest</h1>
      </div>

      <Card title="Plan Snapshot" subtitle={`Plan ID: ${planDetail.planId}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Plan Name</p>
            <p className="font-semibold">{planDetail.planName}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Scheme Name</p>
            <p className="font-semibold">{planDetail.scheme?.schemeName || '-'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Min Investment</p>
            <p className="font-semibold">{formatCurrency(planDetail.financials?.minInvestment ?? 0)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Min SIP</p>
            <p className="font-semibold">{formatCurrency(planDetail.financials?.minSip ?? 0)}</p>
          </div>
        </div>
      </Card>

      <Card title="Investment Type">
        <div className="flex gap-3">
          <Button variant={mode === 'LUMPSUM' ? 'primary' : 'secondary'} onClick={() => setMode('LUMPSUM')}>
            Lumpsum
          </Button>
          <Button variant={mode === 'SIP' ? 'primary' : 'secondary'} onClick={() => setMode('SIP')}>
            Monthly SIP
          </Button>
        </div>
      </Card>

      {mode === 'LUMPSUM' ? (
        <Card title="Lumpsum">
          <div className="max-w-md space-y-3">
            <label className="label">Amount</label>
            <input
              type="number"
              className="input-field"
              placeholder={`e.g. ${Math.max(Number(planDetail.financials?.minInvestment ?? 500), 500)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={Math.max(1, Number(planDetail.financials?.minInvestment ?? 1))}
            />
          </div>
        </Card>
      ) : (
        <Card title="Monthly SIP">
          <div className="space-y-5">
            <div className="max-w-md space-y-2">
              <label className="label">SIP Amount</label>
              <input
                type="number"
                className="input-field"
                placeholder={`e.g. ${Math.max(Number(planDetail.financials?.minSip ?? 1000), 1000)}`}
                value={sipAmount}
                onChange={(e) => setSipAmount(e.target.value)}
                min={10}
              />
            </div>

            <div>
              <label className="label">SIP Day (1-28)</label>
              <div className="inline-block border rounded-md bg-gray-50 p-1.5">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSipDay(day)}
                      className={`w-7 h-7 rounded border text-[11px] font-medium leading-none ${
                        sipDay === day
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                SIP start date (first run): <span className="font-semibold">{formatDate(firstRunDate)}</span> at 10:00 AM IST
              </p>
            </div>

            <div className="max-w-md space-y-2">
              <label className="label">No. of Installments</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 12"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                min={6}
                max={360}
              />
            </div>
          </div>
        </Card>
      )}

      <div>
        <Button
          onClick={() => {
            if (!validateForm()) return;
            setShowSummaryPopup(true);
          }}
        >
          Place Order
        </Button>
      </div>

      {showSummaryPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSummaryPopup(false)}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Plan:</span> <span className="font-semibold">{planDetail.planName}</span></p>
              <p><span className="text-gray-600">Type:</span> <span className="font-semibold">{mode}</span></p>
              {mode === 'LUMPSUM' ? (
                <p><span className="text-gray-600">Amount:</span> <span className="font-semibold">{formatCurrency(Number(amount))}</span></p>
              ) : (
                <>
                  <p><span className="text-gray-600">SIP Amount:</span> <span className="font-semibold">{formatCurrency(Number(sipAmount))}</span></p>
                  <p><span className="text-gray-600">SIP Day:</span> <span className="font-semibold">{sipDay}</span></p>
                  <p><span className="text-gray-600">Start Date:</span> <span className="font-semibold">{formatDate(firstRunDate)}</span></p>
                  <p><span className="text-gray-600">Installments:</span> <span className="font-semibold">{totalInstallments}</span></p>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="button" className="flex-1" isLoading={isSubmitting} onClick={placeOrder}>
                Confirm Place Order
              </Button>
              <Button type="button" className="flex-1" variant="secondary" onClick={() => setShowSummaryPopup(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-gray-600">Order/SIP ID</p>
                <p className="font-semibold">
                  {String(
                    responsePopup.payload?.investmentOrderId ??
                      responsePopup.payload?.orderId ??
                      responsePopup.payload?.sipMandateId ??
                      '-'
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Plan ID</p>
                <p className="font-semibold">{String(responsePopup.payload?.planId ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Amount/SIP Amount</p>
                <p className="font-semibold">
                  {String(responsePopup.payload?.amount ?? responsePopup.payload?.sipAmount ?? '-')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">SIP Day</p>
                <p className="font-semibold">{String(responsePopup.payload?.sipDay ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Status</p>
                <p className="font-semibold">
                  {String(responsePopup.payload?.status ?? responsePopup.payload?.orderStatus ?? '-')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Installments</p>
                <p className="font-semibold">
                  {String(responsePopup.payload?.completedInstallments ?? '-')} /{' '}
                  {String(responsePopup.payload?.totalInstallments ?? '-')}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">SIP Start Date</p>
                <p className="font-semibold">
                  {responsePopup.payload?.startDate ? formatDate(responsePopup.payload.startDate) : '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">SIP End Date</p>
                <p className="font-semibold">
                  {responsePopup.payload?.endDate ? formatDate(responsePopup.payload.endDate) : '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Message</p>
                <p className="font-semibold">{String(responsePopup.payload?.message ?? '-')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Time / Next Run</p>
                <p className="font-semibold">
                  {responsePopup.payload?.nextRunAt
                    ? formatDate(responsePopup.payload.nextRunAt)
                    : String(responsePopup.payload?.orderTime ?? '-')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
