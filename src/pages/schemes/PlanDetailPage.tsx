import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { schemesApi } from '@/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface PlanDetailResponse {
  planId: number;
  planName: string;
  isRecommended: boolean;
  scheme: {
    schemeId: number;
    schemeName: string;
    amcName: string;
    assetName: string;
    categoryName: string;
    amcWebsite: string | null;
  };
  planType: string;
  optionType: string;
  financials: {
    expenseRatio: number | null;
    minInvestment: number | null;
    minSip: number | null;
    isSipAllowed: boolean;
    exitLoad: string | null;
  };
  returns: {
    return1y: string | null;
    return3y: string | null;
    return5y: string | null;
  };
  benchmark: {
    benchmarkId: number | null;
    benchmarkName: string | null;
  };
  nav: {
    latestDate: string | null;
    latestValue: number | null;
    historyLink: string | null;
  } | null;
}

const display = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

interface NavHistoryPoint {
  date: string;
  value: number;
}

export const PlanDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();
  const locationState = (location.state as { planDetail?: PlanDetailResponse; from?: string } | null) ?? null;
  const backRoute = locationState?.from || '/mutual-fund-schemes';
  const backLabel = 'Back';

  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<PlanDetailResponse | null>(null);
  const [isNavLoading, setIsNavLoading] = useState(false);
  const [navHistory, setNavHistory] = useState<NavHistoryPoint[]>([]);

  const parseNavHistory = (raw: any): NavHistoryPoint[] => {
    const points = Array.isArray(raw?.navs)
      ? raw.navs
      : Array.isArray(raw?.data?.navs)
      ? raw.data.navs
      : Array.isArray(raw)
      ? raw
      : [];

    return points
      .map((point: any) => ({
        date: String(point?.date ?? ''),
        value: Number(point?.value ?? 0),
      }))
      .filter((point: NavHistoryPoint) => !!point.date && Number.isFinite(point.value))
      .sort((a: NavHistoryPoint, b: NavHistoryPoint) => {
        const aTs = new Date(a.date).getTime();
        const bTs = new Date(b.date).getTime();
        return aTs - bTs;
      });
  };

  useEffect(() => {
    const stateDetail = locationState?.planDetail;
    if (stateDetail && Number(stateDetail.planId) === Number(planId)) {
      setDetail(stateDetail);
      setIsLoading(false);
      return;
    }

    const fetchPlanDetail = async () => {
      if (!planId) {
        toast.error('Invalid plan id');
        navigate(backRoute);
        return;
      }

      try {
        setIsLoading(true);
        const response = await schemesApi.getPlanDetails(Number(planId));
        setDetail(response as PlanDetailResponse);
      } catch (error) {
        toast.error('Failed to load plan detail');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetail();
  }, [locationState, planId, navigate, backRoute]);

  useEffect(() => {
    const fetchNavHistory = async () => {
      const historyLink = detail?.nav?.historyLink;
      const currentPlanId = detail?.planId;

      if (!historyLink && !currentPlanId) {
        setNavHistory([]);
        return;
      }

      try {
        setIsNavLoading(true);
        let parsed: NavHistoryPoint[] = [];

        if (historyLink) {
          const response = await schemesApi.getNavHistoryFromLink(historyLink);
          parsed = parseNavHistory(response);
        }

        if (parsed.length === 0 && currentPlanId) {
          const fallback = await schemesApi.getNavHistory(currentPlanId);
          parsed = parseNavHistory(fallback);
        }

        setNavHistory(parsed);
      } catch (error) {
        setNavHistory([]);
      } finally {
        setIsNavLoading(false);
      }
    };

    fetchNavHistory();
  }, [detail?.nav?.historyLink, detail?.planId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!detail) {
    return (
      <Card title="Plan Detail">
        <p className="text-gray-600">Plan detail not found.</p>
      </Card>
    );
  }

  const latestPoint = navHistory.length > 0 ? navHistory[navHistory.length - 1] : null;
  const minNav = navHistory.length > 0 ? Math.min(...navHistory.map((point) => point.value)) : null;
  const maxNav = navHistory.length > 0 ? Math.max(...navHistory.map((point) => point.value)) : null;
  const chartData = navHistory.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }));

  const handleBack = () => {
    if (locationState?.from) {
      navigate(locationState.from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/mutual-fund-schemes');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          onClick={() =>
            navigate(`/mutual-fund-schemes/plans/${detail.planId}/invest`, {
              state: { planDetail: detail, from: location.pathname },
            })
          }
        >
          Invest
        </Button>
      </div>

      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{detail.planName}</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-700">
            <span className="font-medium">{display(detail.planType)}</span>
          </div>
          <div className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-amber-700">
            <span className="font-medium">{display(detail.optionType)}</span>
          </div>
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1.5 ${
              detail.isRecommended
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-rose-100 bg-rose-50 text-rose-700'
            }`}
          >
            <span className="font-medium">{detail.isRecommended ? 'Recommended' : 'Not Recommended'}</span>
          </div>
        </div>
      </Card>

      <Card title="NAV History Trend" subtitle="From plan history link data">
        {isNavLoading ? (
          <LoadingSpinner />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-500">NAV history not available for this plan.</p>
        ) : (
          <div className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(value: string) => `Date: ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Latest NAV</p>
                <p className="font-semibold">{latestPoint ? formatCurrency(latestPoint.value) : '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Min NAV</p>
                <p className="font-semibold">{minNav !== null ? formatCurrency(minNav) : '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Max NAV</p>
                <p className="font-semibold">{maxNav !== null ? formatCurrency(maxNav) : '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Scheme">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Scheme ID</p>
            <p className="font-semibold">{display(detail.scheme?.schemeId)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Scheme Name</p>
            <p className="font-semibold">{display(detail.scheme?.schemeName)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">AMC Name</p>
            <p className="font-semibold">{display(detail.scheme?.amcName)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Asset Name</p>
            <p className="font-semibold">{display(detail.scheme?.assetName)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Category Name</p>
            <p className="font-semibold">{display(detail.scheme?.categoryName)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">AMC Website</p>
            {detail.scheme?.amcWebsite ? (
              <a
                className="font-semibold text-primary-600 inline-flex items-center gap-1"
                href={detail.scheme.amcWebsite}
                target="_blank"
                rel="noreferrer"
              >
                {detail.scheme.amcWebsite}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="font-semibold">-</p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Financials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Expense Ratio</p>
            <p className="font-semibold">{display(detail.financials?.expenseRatio)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Min Investment</p>
            <p className="font-semibold">{display(detail.financials?.minInvestment)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Min SIP</p>
            <p className="font-semibold">{display(detail.financials?.minSip)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">SIP Allowed</p>
            <p className="font-semibold">{detail.financials?.isSipAllowed ? 'Yes' : 'No'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
            <p className="text-gray-600">Exit Load</p>
            <p className="font-semibold">{display(detail.financials?.exitLoad)}</p>
          </div>
        </div>
      </Card>

      <Card title="Returns">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">1Y Return</p>
            <p className="font-semibold">{display(detail.returns?.return1y)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">3Y Return</p>
            <p className="font-semibold">{display(detail.returns?.return3y)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">5Y Return</p>
            <p className="font-semibold">{display(detail.returns?.return5y)}</p>
          </div>
        </div>
      </Card>

      <Card title="Benchmark">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Benchmark ID</p>
            <p className="font-semibold">{display(detail.benchmark?.benchmarkId)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Benchmark Name</p>
            <p className="font-semibold">{display(detail.benchmark?.benchmarkName)}</p>
          </div>
        </div>
      </Card>

      <Card title="NAV">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Latest Date</p>
            <p className="font-semibold">
              {detail.nav?.latestDate ? formatDate(detail.nav.latestDate) : '-'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Latest Value</p>
            <p className="font-semibold">{display(detail.nav?.latestValue)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">History Link</p>
            {detail.nav?.historyLink ? (
              <a
                className="font-semibold text-primary-600 inline-flex items-center gap-1"
                href={detail.nav.historyLink}
                target="_blank"
                rel="noreferrer"
              >
                {detail.nav.historyLink}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="font-semibold">-</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
