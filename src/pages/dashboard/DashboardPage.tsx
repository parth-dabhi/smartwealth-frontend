import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { portfolioApi } from '@/api';
import { PortfolioSummary } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/helpers';
import { TrendingUp, TrendingDown, PiggyBank, ExternalLink } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

interface PlanPortfolioDetail {
  planId: number;
  planName: string;
  amcName: string;
  assetName: string;
  categoryName: string;
  investedAmount: number;
  marketValue: number;
  gain: number;
  units: number;
  latestNav: number;
  navDate: string;
  isActive: boolean;
}

interface PlanTransactionItem {
  transactionDate?: string;
  type?: string;
  investmentMode?: string;
  amount?: number;
  units?: number;
  nav?: number;
  navDate?: string;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanPortfolioDetail | null>(null);
  const [isTxnLoading, setIsTxnLoading] = useState(false);
  const [transactions, setTransactions] = useState<PlanTransactionItem[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [amcFilter, setAmcFilter] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      const data = await portfolioApi.getPortfolio();
      setPortfolio(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const openPlanDetails = async (planId: number) => {
    try {
      setIsPlanLoading(true);
      const response: any = await portfolioApi.getPlanPortfolio(planId);
      setSelectedPlan({
        planId: Number(response?.planId ?? planId),
        planName: String(response?.planName ?? '-'),
        amcName: String(response?.amcName ?? '-'),
        assetName: String(response?.assetName ?? '-'),
        categoryName: String(response?.categoryName ?? '-'),
        investedAmount: Number(response?.investedAmount ?? 0),
        marketValue: Number(response?.marketValue ?? 0),
        gain: Number(response?.gain ?? 0),
        units: Number(response?.units ?? 0),
        latestNav: Number(response?.latestNav ?? 0),
        navDate: String(response?.navDate ?? ''),
        isActive: Boolean(response?.isActive),
      });
      setTransactions([]);
      setShowTransactions(false);
    } catch (error) {
      toast.error('Failed to fetch plan holding details');
    } finally {
      setIsPlanLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!selectedPlan?.planId) return;
    try {
      setIsTxnLoading(true);
      const response: any[] = await portfolioApi.getHoldingTransactions(selectedPlan.planId);
      const normalized = Array.isArray(response)
        ? response.map((tx: any) => ({
            transactionDate: tx?.transactionDate,
            type: tx?.type ?? tx?.transactionType,
            investmentMode: tx?.investmentMode,
            amount: Number(tx?.amount ?? 0),
            units: Number(tx?.units ?? 0),
            nav: Number(tx?.nav ?? 0),
            navDate: tx?.navDate,
          }))
        : [];
      setTransactions(normalized);
    } catch (error) {
      toast.error('Failed to fetch plan transactions');
    } finally {
      setIsTxnLoading(false);
    }
  };

  const openTransactions = async () => {
    setShowTransactions(true);
    if (transactions.length > 0) return;
    await loadTransactions();
  };

  const closePlanModal = () => {
    setSelectedPlan(null);
    setTransactions([]);
    setShowTransactions(false);
    setIsTxnLoading(false);
  };

  const investMore = () => {
    if (!selectedPlan?.planId) return;
    closePlanModal();
    navigate(`/mutual-fund-schemes/plans/${selectedPlan.planId}/invest`);
  };

  const viewPlanDetail = () => {
    if (!selectedPlan?.planId) return;
    closePlanModal();
    navigate(`/mutual-fund-schemes/plans/${selectedPlan.planId}`);
  };

  const sellHolding = () => {
    if (!selectedPlan?.planId) return;
    const sellState = {
      planId: selectedPlan.planId,
      planName: selectedPlan.planName,
      availableUnits: selectedPlan.units,
      latestNav: selectedPlan.latestNav,
      from: '/dashboard',
    };
    closePlanModal();
    navigate('/sell', { state: sellState });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assetData =
    portfolio?.assetAllocation?.map((asset) => ({
      name: asset.assetName,
      value: asset.value,
      percentage: asset.percentage,
    })) || [];
  const isCurrentValueUp = (portfolio?.currentValue || 0) >= (portfolio?.totalInvestedValue || 0);
  const holdings = portfolio?.holdings ?? [];
  const amcOptions = Array.from(
    new Set(
      holdings
        .map((holding) => String((holding as any).amcName ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const assetOptions = Array.from(
    new Set(
      holdings
        .map((holding) => String((holding as any).assetName ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const categoryOptions = Array.from(
    new Set(
      holdings
        .map((holding) => String((holding as any).categoryName ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const filteredHoldings = holdings.filter((holding) => {
    const amcName = String((holding as any).amcName ?? '').trim();
    const assetName = String((holding as any).assetName ?? '').trim();
    const categoryName = String((holding as any).categoryName ?? '').trim();

    return (
      (amcFilter === 'ALL' || amcName === amcFilter) &&
      (assetFilter === 'ALL' || assetName === assetFilter) &&
      (categoryFilter === 'ALL' || categoryName === categoryFilter)
    );
  });
  const hasActiveFilters = amcFilter !== 'ALL' || assetFilter !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {(portfolio?.holdings?.length ?? 0) === 0 && (
          <p className="mt-1 text-sm text-gray-600">
            No holdings yet.{' '}
            <button
              type="button"
              onClick={() => navigate('/mutual-fund-schemes')}
              className="text-primary-700 font-medium hover:underline"
            >
              Go to Mutual Fund Schemes
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(portfolio?.totalInvestedValue || 0)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <PiggyBank className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Value</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(portfolio?.currentValue || 0)}</p>
                </div>
                <div className={`p-3 rounded-lg ${isCurrentValueUp ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isCurrentValueUp ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gain/Loss</p>
                  <p
                    className={`text-2xl font-bold mt-2 ${
                      (portfolio?.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(portfolio?.totalGainLoss || 0)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${(portfolio?.totalGainLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {(portfolio?.totalGainLoss || 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Returns</p>
                  <p
                    className={`text-2xl font-bold mt-2 ${
                      (portfolio?.totalGainLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(portfolio?.totalGainLossPercentage || 0)}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    (portfolio?.totalGainLossPercentage || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {(portfolio?.totalGainLossPercentage || 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card title="Asset Allocation">
            {assetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <RechartsPie>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={125}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No investments yet</p>
            )}
          </Card>
        </div>
      </div>

      <Card title="All Holdings">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={amcFilter}
            onChange={(e) => setAmcFilter(e.target.value)}
            aria-label="Filter holdings by AMC"
            title="Filter holdings by AMC"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All AMC</option>
            {amcOptions.map((amc) => (
              <option key={amc} value={amc}>
                {amc}
              </option>
            ))}
          </select>
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            aria-label="Filter holdings by asset"
            title="Filter holdings by asset"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Assets</option>
            {assetOptions.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter holdings by category"
              title="Filter holdings by category"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAmcFilter('ALL');
                  setAssetFilter('ALL');
                  setCategoryFilter('ALL');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-base font-medium text-gray-600">Scheme</th>
                <th className="text-right py-3 px-4 text-base font-medium text-gray-600">Invested</th>
                <th className="text-right py-3 px-4 text-base font-medium text-gray-600">Current Value</th>
                <th className="text-right py-3 px-4 text-base font-medium text-gray-600">Gain/Loss</th>
                <th className="text-right py-3 px-4 text-base font-medium text-gray-600">Returns</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length > 0 ? (
                filteredHoldings.length > 0 ? (
                filteredHoldings.map((holding, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => openPlanDetails(Number(holding.planId))}
                        className="font-medium text-base text-left text-gray-900 hover:underline"
                      >
                        {holding.schemeName || holding.planName}
                      </button>
                      <p className="text-xs text-gray-500">View details</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{(holding as any).amcName || '-'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">{(holding as any).assetName || '-'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{(holding as any).categoryName || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-base">
                      {formatCurrency((holding as any).netInvestedAmount ?? holding.investedValue)}
                    </td>
                    <td className="py-3 px-4 text-right text-base font-medium">
                      {formatCurrency((holding as any).marketValue ?? holding.currentValue)}
                    </td>
                    <td className="py-3 px-4 text-right text-base font-semibold">
                      <span className={`${(holding as any).gain >= 0 || holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency((holding as any).gain ?? holding.gainLoss)}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right text-base font-semibold ${
                        ((holding as any).gain ?? holding.gainLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercentage((holding as any).gainPercentage ?? holding.gainLossPercentage)}
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No holdings match selected filters.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No holdings yet. Start investing to see your portfolio!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {(isPlanLoading || selectedPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePlanModal}>
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">Plan Holding Details</h3>
              <Button type="button" size="sm" variant="secondary" onClick={closePlanModal}>
                Close
              </Button>
            </div>

            <div className="p-5">
              {isPlanLoading ? (
                <LoadingSpinner />
              ) : selectedPlan ? (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold">{selectedPlan.planName}</p>
                    <button
                      type="button"
                      onClick={viewPlanDetail}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Plan Detail
                    </button>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{selectedPlan.amcName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">{selectedPlan.assetName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{selectedPlan.categoryName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Invested</p>
                      <p className="font-semibold">{formatCurrency(selectedPlan.investedAmount)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Market Value</p>
                      <p className="font-semibold">{formatCurrency(selectedPlan.marketValue)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Gain</p>
                      <p className={`font-semibold ${selectedPlan.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(selectedPlan.gain)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Units</p>
                      <p className="font-semibold">{Number.isFinite(selectedPlan.units) ? selectedPlan.units.toFixed(4) : '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Latest NAV</p>
                      <p className="font-semibold">{formatCurrency(selectedPlan.latestNav)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">NAV Date</p>
                      <p className="font-semibold">{selectedPlan.navDate ? formatDate(selectedPlan.navDate) : '-'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Active Status</p>
                    <p className={`font-semibold ${selectedPlan.isActive ? 'text-green-600' : 'text-gray-700'}`}>
                      {selectedPlan.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>

                  {!showTransactions && (
                    <div className="pt-1 flex items-center gap-2">
                      <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 focus:ring-green-500" onClick={investMore}>
                        Invest More
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={sellHolding}>
                        Sell
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={openTransactions} isLoading={isTxnLoading}>
                        Transactions
                      </Button>
                    </div>
                  )}

                  {showTransactions && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">Transactions</p>
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 focus:ring-green-500" onClick={investMore}>
                            Invest More
                          </Button>
                          <Button type="button" size="sm" variant="danger" onClick={sellHolding}>
                            Sell
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={loadTransactions} isLoading={isTxnLoading}>
                            Refresh
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-2 px-3">Date</th>
                              <th className="text-left py-2 px-3">Type</th>
                              <th className="text-left py-2 px-3">Mode</th>
                              <th className="text-right py-2 px-3">Amount</th>
                              <th className="text-right py-2 px-3">Units</th>
                              <th className="text-right py-2 px-3">NAV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-4 px-3 text-center text-gray-500 text-sm">
                                  No transactions found for this plan.
                                </td>
                              </tr>
                            ) : (
                              transactions.map((tx, idx) => (
                                <tr key={`${tx.transactionDate || 'tx'}-${idx}`} className="border-b last:border-b-0">
                                  <td className="py-2 px-3">{tx.transactionDate ? formatDate(tx.transactionDate) : '-'}</td>
                                  <td className="py-2 px-3">{tx.type || '-'}</td>
                                  <td className="py-2 px-3">{tx.investmentMode || '-'}</td>
                                  <td className="py-2 px-3 text-right">{formatCurrency(tx.amount ?? 0)}</td>
                                  <td className="py-2 px-3 text-right">{Number.isFinite(tx.units ?? NaN) ? (tx.units ?? 0).toFixed(4) : '-'}</td>
                                  <td className="py-2 px-3 text-right">{Number.isFinite(tx.nav ?? NaN) ? formatCurrency(tx.nav ?? 0) : '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
