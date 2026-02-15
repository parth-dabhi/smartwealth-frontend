import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { schemesApi } from '@/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import { ChevronDown, ChevronUp, RefreshCw, Search, FileText } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface FilterOptionLike {
  id?: number;
  name?: string;
  label?: string;
  value?: number;
}

interface FiltersResponseLike {
  amcs?: FilterOptionLike[];
  assets?: FilterOptionLike[];
  categories?: FilterOptionLike[] | Record<string, FilterOptionLike[]>;
  optionTypes?: FilterOptionLike[];
}

interface SchemePlanSummary {
  planId: number;
  planType?: string;
  optionType?: string;
}

interface SchemeListItem {
  schemeId: number;
  schemeName: string;
  amcName?: string;
  assetName?: string;
  categoryName?: string;
  launchDate?: string;
  plans: SchemePlanSummary[];
}

const optionLabel = (opt: FilterOptionLike) => opt.label ?? opt.name ?? String(opt.value ?? opt.id ?? '');
const optionValue = (opt: FilterOptionLike) => opt.value ?? opt.id ?? 0;

export const SchemesPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [schemes, setSchemes] = useState<SchemeListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [amcOptions, setAmcOptions] = useState<FilterOptionLike[]>([]);
  const [assetOptions, setAssetOptions] = useState<FilterOptionLike[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, FilterOptionLike[]>>({});
  const [optionTypeOptions, setOptionTypeOptions] = useState<FilterOptionLike[]>([]);

  const [search, setSearch] = useState('');
  const [selectedAmcId, setSelectedAmcId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedOptionTypeId, setSelectedOptionTypeId] = useState('');

  const [expandedSchemeIds, setExpandedSchemeIds] = useState<Record<number, boolean>>({});
  const hasFetchedRef = useRef(false);

  const flattenedCategories = useMemo(
    () =>
      Object.entries(categoryGroups).flatMap(([group, list]) =>
        list.map((opt) => ({ group, label: optionLabel(opt), value: optionValue(opt) }))
      ),
    [categoryGroups]
  );

  const fetchFilterChoices = async () => {
    try {
      setIsLoadingFilters(true);
      const response = (await schemesApi.getFilterChoices()) as FiltersResponseLike;

      const amcs = Array.isArray(response?.amcs) ? response.amcs : [];
      const assets = Array.isArray(response?.assets) ? response.assets : [];
      const optionTypes = Array.isArray(response?.optionTypes) ? response.optionTypes : [];
      const categoriesRaw = response?.categories;
      const categories =
        categoriesRaw && !Array.isArray(categoriesRaw)
          ? categoriesRaw
          : { Categories: Array.isArray(categoriesRaw) ? categoriesRaw : [] };

      setAmcOptions(amcs);
      setAssetOptions(assets);
      setOptionTypeOptions(optionTypes);
      setCategoryGroups(categories);
    } catch (error) {
      toast.error('Failed to load filter choices');
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchSchemes = useCallback(
    async ({
      targetPage,
      append,
      silent = false,
    }: {
      targetPage: number;
      append: boolean;
      silent?: boolean;
    }) => {
      try {
        if (silent) {
          setIsRefreshing(true);
        } else if (append) {
          setIsFetchingMore(true);
        } else {
          setIsLoading(true);
        }

        const response = await schemesApi.getSchemes(
          {
            amcId: selectedAmcId ? Number(selectedAmcId) : undefined,
            assetId: selectedAssetId ? Number(selectedAssetId) : undefined,
            categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
            optionTypeId: selectedOptionTypeId ? Number(selectedOptionTypeId) : undefined,
            search: search.trim() || undefined,
          },
          targetPage,
          pageSize
        );

        const content = Array.isArray((response as any)?.content) ? (response as any).content : [];
        const normalized = content.map((item: any) => ({
          schemeId: Number(item?.schemeId),
          schemeName: item?.schemeName ?? '-',
          amcName: item?.amcName,
          assetName: item?.assetName,
          categoryName: item?.categoryName,
          launchDate: item?.launchDate,
          plans: Array.isArray(item?.plans)
            ? item.plans.map((plan: any) => ({
                planId: Number(plan?.planId),
                planType: plan?.planType,
                optionType: plan?.optionType,
              }))
            : [],
        })) as SchemeListItem[];

        setSchemes((prev) => (append ? [...prev, ...normalized] : normalized));

        const meta = (response as any)?.meta ?? {};
        const resolvedPage = Number(meta.page ?? meta.currentPage ?? targetPage ?? 0);
        const resolvedPageSize = Number(meta.size ?? meta.pageSize ?? pageSize);
        const resolvedTotalElements = Number(meta.totalElements ?? normalized.length);
        const resolvedTotalPages = Number(
          meta.totalPages ?? (resolvedPageSize > 0 ? Math.ceil(resolvedTotalElements / resolvedPageSize) : 1)
        );
        const resolvedHasNext =
          typeof meta.last === 'boolean'
            ? !meta.last
            : resolvedPage + 1 < Math.max(resolvedTotalPages, 1);

        setCurrentPage(resolvedPage);
        setTotalSchemes(resolvedTotalElements);
        setTotalPages(Math.max(resolvedTotalPages, 1));
        setHasNext(resolvedHasNext);
      } catch (error) {
        toast.error('Failed to load schemes');
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else if (append) {
          setIsFetchingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [selectedAmcId, selectedAssetId, selectedCategoryId, selectedOptionTypeId, search, pageSize]
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchFilterChoices();
    fetchSchemes({ targetPage: 0, append: false });
  }, [fetchSchemes]);

  const resetFilters = () => {
    setSearch('');
    setSelectedAmcId('');
    setSelectedAssetId('');
    setSelectedCategoryId('');
    setSelectedOptionTypeId('');
  };

  const applyFilters = () => {
    setExpandedSchemeIds({});
    fetchSchemes({ targetPage: 0, append: false });
  };

  const toggleSchemeExpand = (schemeId: number) => {
    setExpandedSchemeIds((prev) => ({ ...prev, [schemeId]: !prev[schemeId] }));
  };

  const loadNextPage = useCallback(() => {
    if (isLoading || isRefreshing || isFetchingMore || !hasNext) return;
    fetchSchemes({ targetPage: currentPage + 1, append: true });
  }, [isLoading, isRefreshing, isFetchingMore, hasNext, fetchSchemes, currentPage]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasNext,
    isLoading: isLoading || isRefreshing || isFetchingMore,
    onLoadMore: loadNextPage,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mutual Fund Schemes</h1>
        <Button
          variant="secondary"
          onClick={() => fetchSchemes({ targetPage: 0, append: false, silent: true })}
          isLoading={isRefreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-3">
          <Card title="Filter Mutual Fund Schemes" className="xl:sticky xl:top-24">
            <div className="space-y-4">
              <div>
                <label className="label">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Scheme name" />
                </div>
              </div>

              <div>
                <label className="label">AMC</label>
                <select className="input-field" value={selectedAmcId} onChange={(e) => setSelectedAmcId(e.target.value)} disabled={isLoadingFilters}>
                  <option value="">All</option>
                  {amcOptions.map((opt) => (
                    <option key={optionValue(opt)} value={optionValue(opt)}>
                      {optionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Asset</label>
                <select className="input-field" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} disabled={isLoadingFilters}>
                  <option value="">All</option>
                  {assetOptions.map((opt) => (
                    <option key={optionValue(opt)} value={optionValue(opt)}>
                      {optionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Option Type</label>
                <select className="input-field" value={selectedOptionTypeId} onChange={(e) => setSelectedOptionTypeId(e.target.value)} disabled={isLoadingFilters}>
                  <option value="">All</option>
                  {optionTypeOptions.map((opt) => (
                    <option key={optionValue(opt)} value={optionValue(opt)}>
                      {optionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Category</label>
                <select className="input-field" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={isLoadingFilters}>
                  <option value="">All</option>
                  {flattenedCategories.map((opt) => (
                    <option key={`${opt.group}-${opt.value}`} value={opt.value}>
                      {opt.group} - {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    resetFilters();
                    setTimeout(applyFilters, 0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-9 space-y-6">
          <Card title="All Mutual Fund Schemes" subtitle={`Total schemes: ${totalSchemes} | Loaded: ${schemes.length} | Page ${currentPage + 1} of ${Math.max(totalPages, 1)}`}>
            {schemes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No schemes found for selected filters.</p>
            ) : (
              <div className="space-y-4">
                {schemes.map((scheme) => {
                  const expanded = !!expandedSchemeIds[scheme.schemeId];
                  return (
                    <div key={scheme.schemeId} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                        onClick={() => toggleSchemeExpand(scheme.schemeId)}
                      >
                        <div>
                          <p className="font-semibold">{scheme.schemeName}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{scheme.amcName || '-'}</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">{scheme.assetName || '-'}</span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{scheme.categoryName || '-'}</span>
                          </div>
                          {scheme.launchDate && <p className="text-xs text-gray-500 mt-1">Launch Date: {formatDate(scheme.launchDate)}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {scheme.plans.length} plan{scheme.plans.length === 1 ? '' : 's'}
                          </span>
                          {expanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="p-4 bg-white">
                          {scheme.plans.length === 0 ? (
                            <p className="text-sm text-gray-500">No plans available for this scheme.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="border-b">
                                  <tr>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Plan ID</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Plan Type</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Option Type</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scheme.plans.map((plan) => (
                                    <tr key={plan.planId} className="border-b last:border-b-0">
                                      <td className="py-2 px-3 text-sm">{plan.planId}</td>
                                      <td className="py-2 px-3 text-sm">{plan.planType || '-'}</td>
                                      <td className="py-2 px-3 text-sm">{plan.optionType || '-'}</td>
                                      <td className="py-2 px-3 text-sm">
                                        <Button size="sm" variant="secondary" onClick={() => navigate(`/mutual-fund-schemes/plans/${plan.planId}`)}>
                                          <FileText className="w-4 h-4 mr-1" />
                                          View Plan Detail
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingMore ? <span className="text-sm text-gray-500">Loading more schemes...</span> : null}
            {!hasNext && schemes.length > 0 ? <span className="text-sm text-gray-400">End of schemes list</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
