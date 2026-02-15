import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { familyApi, portfolioApi } from '@/api';
import { FamilyPortfolioSummary, IndividualFamilyPortfolio } from '@/types';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { formatCurrency, formatPercentage } from '@/utils/helpers';
import { Users, RefreshCw, PiggyBank, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

const OwnerPortfolioCard = ({ portfolio }: { portfolio: IndividualFamilyPortfolio }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{portfolio.ownerName}</p>
          <p className="text-sm text-gray-600">{portfolio.isPersonal ? 'Personal' : 'Family Member'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${
              portfolio.isPersonal ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {portfolio.isPersonal ? 'PERSONAL' : 'FAMILY'}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
            title={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="rounded border p-2.5">
          <p className="text-gray-600">Invested</p>
          <p className="font-semibold text-base">{formatCurrency(portfolio.totalNetInvestedAmount)}</p>
        </div>
        <div className="rounded border p-2.5">
          <p className="text-gray-600">Market</p>
          <p className="font-semibold text-base">{formatCurrency(portfolio.totalMarketValue)}</p>
        </div>
        <div className="rounded border p-2.5">
          <p className="text-gray-600">Gain</p>
          <p className={`font-semibold text-base ${portfolio.totalNetGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(portfolio.totalNetGain)}
          </p>
        </div>
        <div className="rounded border p-2.5">
          <p className="text-gray-600">Gain %</p>
          <p className={`font-semibold text-base ${portfolio.totalNetGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(portfolio.totalNetGainPercentage)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <>
          <div>
            <p className="text-sm font-semibold mb-1">Asset Allocation</p>
            {portfolio.assetAllocation.length === 0 ? (
              <p className="text-sm text-gray-500">No allocation data.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {portfolio.assetAllocation.map((asset) => (
                  <span key={`${portfolio.ownerName}-${asset.assetName}`} className="text-sm px-2.5 py-1 rounded bg-gray-100">
                    {asset.assetName}: {asset.percentage}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Holdings</p>
            {portfolio.holdings.length === 0 ? (
              <p className="text-sm text-gray-500">No holdings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 text-base font-medium text-gray-600">Scheme</th>
                      <th className="text-right py-2.5 px-3 text-base font-medium text-gray-600">Invested</th>
                      <th className="text-right py-2.5 px-3 text-base font-medium text-gray-600">Market</th>
                      <th className="text-right py-2.5 px-3 text-base font-medium text-gray-600">Gain</th>
                      <th className="text-right py-2.5 px-3 text-base font-medium text-gray-600">Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((holding) => (
                      <tr key={`${portfolio.ownerName}-${holding.planId}`} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-2.5 px-3">
                          <p className="text-base font-semibold text-gray-900">{holding.planName}</p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{holding.amcName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">{holding.assetName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{holding.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-base">{formatCurrency(holding.netInvestedAmount)}</td>
                        <td className="py-2.5 px-3 text-right text-base font-medium">{formatCurrency(holding.marketValue)}</td>
                        <td
                          className={`py-2.5 px-3 text-right text-base font-semibold ${
                            holding.gain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(holding.gain)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right text-base font-semibold ${
                            holding.gain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercentage(holding.gainPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const PortfolioPage = () => {
  const [data, setData] = useState<FamilyPortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(true);

  const fetchFamilyPortfolio = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const members = await familyApi.getMembers();
      const hasMembers = Array.isArray(members) && members.length > 0;
      setHasFamilyMembers(hasMembers);
      if (!hasMembers) {
        setData(null);
        return;
      }

      const response = await portfolioApi.getFamilyPortfolio();
      setData(response);
    } catch (error) {
      toast.error('Failed to fetch family portfolio');
      setData(null);
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFamilyPortfolio();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasFamilyMembers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Family Portfolio</h1>
          <p className="text-sm text-gray-600">No family members found for portfolio view.</p>
        </div>
        <Card>
          <p className="text-sm text-gray-700">
            Add a family member first to view family portfolio.
          </p>
          <div className="mt-4">
            <Link
              to="/family"
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Go to Family Access
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const personalPortfolio = data?.personalPortfolio ?? null;
  const familyMemberPortfolios = data?.familyMemberPortfolios || [];
  const ownerPortfoliosCount = (personalPortfolio ? 1 : 0) + familyMemberPortfolios.length;
  const combinedAssetData =
    data?.assetAllocation.map((asset) => ({
      name: asset.assetName,
      value: asset.marketValue,
      percentage: asset.percentage,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Family Portfolio</h1>
          <p className="text-sm text-gray-600">Combined view of your portfolio and accessible family portfolios.</p>
        </div>
        <Button variant="secondary" onClick={() => fetchFamilyPortfolio(true)} isLoading={isRefreshing}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(data?.totalNetInvestedAmount || 0)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <PiggyBank className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Market Value</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(data?.totalMarketValue || 0)}</p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    (data?.totalMarketValue || 0) >= (data?.totalNetInvestedAmount || 0)
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  {(data?.totalMarketValue || 0) >= (data?.totalNetInvestedAmount || 0) ? (
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
                  <p className="text-sm text-gray-600">Total Gain</p>
                  <p className={`text-2xl font-bold mt-1 ${(data?.totalNetGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data?.totalNetGain || 0)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${(data?.totalNetGain || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {(data?.totalNetGain || 0) >= 0 ? (
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
                  <p className="text-sm text-gray-600">Owners</p>
                  <p className="text-2xl font-bold mt-1">{ownerPortfoliosCount}</p>
                </div>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-8">
          <Card title="Combined Asset Allocation">
            {!data || data.assetAllocation.length === 0 ? (
              <p className="text-sm text-gray-500">No asset allocation data available.</p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={combinedAssetData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}`}
                      outerRadius={105}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {combinedAssetData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Owner Portfolio">
        {!personalPortfolio ? (
          <p className="text-sm text-gray-500">No owner portfolio data found.</p>
        ) : (
          <div className="space-y-3">
            <OwnerPortfolioCard portfolio={personalPortfolio} />
          </div>
        )}
      </Card>

      <Card title="Family Member Portfolios">
        {familyMemberPortfolios.length === 0 ? (
          <p className="text-sm text-gray-500">No family member portfolios found.</p>
        ) : (
          <div className="space-y-3">
            {familyMemberPortfolios.map((portfolio, index) => (
              <OwnerPortfolioCard key={`${portfolio.ownerName}-${index}`} portfolio={portfolio} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
