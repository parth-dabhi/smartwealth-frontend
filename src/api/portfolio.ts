import { apiClient } from './client';
import {
  FamilyPortfolioSummary,
  HoldingTransaction,
  IndividualFamilyPortfolio,
  PortfolioSummary,
} from '@/types';
import { unwrapApiResponse } from './unwrap';

const parsePercentToNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export const portfolioApi = {
  getPortfolio: async (): Promise<PortfolioSummary> => {
    const response = await apiClient.get('/portfolio');
    const raw = unwrapApiResponse<any>(response.data);

    const holdings = Array.isArray(raw?.holdings)
      ? raw.holdings.map((h: any) => ({
          planId: Number(h?.planId ?? 0),
          schemeName: h?.schemeName ?? h?.planName ?? '-',
          planName: h?.planName ?? '-',
          totalUnits: Number(h?.totalUnits ?? 0),
          averageCost: Number(h?.averageCost ?? 0),
          investedValue: Number(h?.investedValue ?? h?.netInvestedAmount ?? 0),
          currentNav: Number(h?.currentNav ?? 0),
          currentValue: Number(h?.currentValue ?? h?.marketValue ?? 0),
          gainLoss: Number(h?.gainLoss ?? h?.gain ?? 0),
          gainLossPercentage: parsePercentToNumber(h?.gainLossPercentage ?? h?.gainPercentage),
          netInvestedAmount: Number(h?.netInvestedAmount ?? 0),
          marketValue: Number(h?.marketValue ?? 0),
          gain: Number(h?.gain ?? 0),
          gainPercentage: h?.gainPercentage ?? null,
          amcName: h?.amcName,
          assetName: h?.assetName,
          categoryName: h?.categoryName,
        }))
      : [];

    const assetAllocation = Array.isArray(raw?.assetAllocation)
      ? raw.assetAllocation.map((a: any) => ({
          assetName: a?.assetName ?? '-',
          value: Number(a?.value ?? a?.marketValue ?? 0),
          marketValue: Number(a?.marketValue ?? a?.value ?? 0),
          percentage: parsePercentToNumber(a?.percentage),
          percentageLabel: a?.percentage ?? null,
        }))
      : [];

    return {
      totalInvestedValue: Number(raw?.totalInvestedValue ?? raw?.totalNetInvestedAmount ?? 0),
      currentValue: Number(raw?.currentValue ?? raw?.totalMarketValue ?? 0),
      totalGainLoss: Number(raw?.totalGainLoss ?? raw?.totalNetGain ?? 0),
      totalGainLossPercentage: parsePercentToNumber(
        raw?.totalGainLossPercentage ?? raw?.totalNetGainPercentage
      ),
      totalNetInvestedAmount: Number(raw?.totalNetInvestedAmount ?? 0),
      totalMarketValue: Number(raw?.totalMarketValue ?? 0),
      totalNetGain: Number(raw?.totalNetGain ?? 0),
      totalNetGainPercentage: raw?.totalNetGainPercentage ?? null,
      holdings,
      assetAllocation,
    } as PortfolioSummary;
  },

  getPlanPortfolio: async (planId: number) => {
    const response = await apiClient.get('/portfolio/plan', {
      params: { planId },
    });
    return unwrapApiResponse(response.data);
  },

  getHoldingTransactions: async (planId: number): Promise<HoldingTransaction[]> => {
    const response = await apiClient.get('/portfolio/transactions', {
      params: { planId },
    });
    return unwrapApiResponse<HoldingTransaction[]>(response.data);
  },

  getFamilyPortfolio: async (): Promise<FamilyPortfolioSummary> => {
    const response = await apiClient.get('/portfolio/family');
    const raw = unwrapApiResponse<any>(response.data);

    const parseAllocation = (items: unknown) =>
      Array.isArray(items)
        ? items.map((asset: any) => ({
            assetName: asset?.assetName ?? '-',
            marketValue: Number(asset?.marketValue ?? 0),
            percentage: typeof asset?.percentage === 'string' ? asset.percentage : '0%',
          }))
        : [];

    const parseHoldings = (items: unknown) =>
      Array.isArray(items)
        ? items.map((holding: any) => ({
            planId: Number(holding?.planId ?? 0),
            planName: holding?.planName ?? '-',
            amcName: holding?.amcName ?? '-',
            assetName: holding?.assetName ?? '-',
            categoryName: holding?.categoryName ?? '-',
            netInvestedAmount: Number(holding?.netInvestedAmount ?? 0),
            marketValue: Number(holding?.marketValue ?? 0),
            gain: Number(holding?.gain ?? 0),
            gainPercentage: typeof holding?.gainPercentage === 'string' ? holding.gainPercentage : '0%',
          }))
        : [];

    const parseIndividual = (value: any): IndividualFamilyPortfolio | null => {
      if (!value || typeof value !== 'object') return null;
      return {
        ownerName: value?.ownerName ?? '-',
        isPersonal: Boolean(value?.isPersonal),
        totalNetInvestedAmount: Number(value?.totalNetInvestedAmount ?? 0),
        totalMarketValue: Number(value?.totalMarketValue ?? 0),
        totalNetGain: Number(value?.totalNetGain ?? 0),
        totalNetGainPercentage:
          typeof value?.totalNetGainPercentage === 'string' ? value.totalNetGainPercentage : '0%',
        assetAllocation: parseAllocation(value?.assetAllocation),
        holdings: parseHoldings(value?.holdings),
      };
    };

    return {
      totalNetInvestedAmount: Number(raw?.totalNetInvestedAmount ?? 0),
      totalMarketValue: Number(raw?.totalMarketValue ?? 0),
      totalNetGain: Number(raw?.totalNetGain ?? 0),
      totalNetGainPercentage:
        typeof raw?.totalNetGainPercentage === 'string' ? raw.totalNetGainPercentage : '0%',
      assetAllocation: parseAllocation(raw?.assetAllocation),
      personalPortfolio: parseIndividual(raw?.personalPortfolio),
      familyMemberPortfolios: Array.isArray(raw?.familyMemberPortfolios)
        ? raw.familyMemberPortfolios
            .map((item: any) => parseIndividual(item))
            .filter((item: IndividualFamilyPortfolio | null): item is IndividualFamilyPortfolio => !!item)
        : [],
    };
  },
};
