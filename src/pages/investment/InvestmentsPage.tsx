import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { investmentApi } from '@/api';
import { InvestmentOrder } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { RefreshCw } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export const InvestmentsPage = () => {
  const [orders, setOrders] = useState<InvestmentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchOrders = useCallback(
    async ({
      page,
      append,
      silent = false,
    }: {
      page: number;
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

        const data = await investmentApi.getOrderHistory(page, pageSize);
        const content = Array.isArray(data?.content) ? data.content : [];

        setOrders((prev) => (append ? [...prev, ...content] : content));
        setCurrentPage(data?.meta?.currentPage ?? page);
        setTotalPages(data?.meta?.totalPages ?? 1);
        setTotalElements(data?.meta?.totalElements ?? 0);
        setHasNext(!(data?.meta?.last ?? page + 1 >= (data?.meta?.totalPages ?? 1)));
      } catch (error) {
        toast.error('Failed to fetch orders');
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
    [pageSize]
  );

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchOrders({ page: 0, append: false });
  }, [fetchOrders]);

  const loadNextPage = useCallback(() => {
    if (isLoading || isRefreshing || isFetchingMore || !hasNext) return;
    fetchOrders({ page: currentPage + 1, append: true });
  }, [isLoading, isRefreshing, isFetchingMore, hasNext, fetchOrders, currentPage]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasNext,
    isLoading: isLoading || isFetchingMore || isRefreshing,
    onLoadMore: loadNextPage,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order History</h1>
        <Button
          variant="secondary"
          onClick={() => fetchOrders({ page: 0, append: false, silent: true })}
          isLoading={isRefreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card
        title="Order History"
        subtitle={`Total Orders: ${totalElements} | Loaded: ${orders.length} | Page ${
          currentPage + 1
        } of ${Math.max(totalPages, 1)}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Scheme</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Mode</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Units</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={`${order.orderId ?? order.investmentOrderId ?? 'order'}-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono">
                      {order.orderId ?? order.investmentOrderId ?? '-'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{order.schemeName || order.planName || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                          order.investmentType === 'BUY'
                            ? 'bg-green-100 text-green-700'
                            : order.investmentType === 'SELL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.investmentType || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                          order.investmentMode === 'LUMPSUM'
                            ? 'bg-blue-100 text-blue-700'
                            : order.investmentMode === 'SIP'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.investmentMode || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold">{formatCurrency(order.amount)}</td>
                    <td className="py-3 px-4 text-right text-sm">
                      {typeof order.units === 'number' ? order.units.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {order.orderDate || order.orderTime || order.navDate
                        ? formatDate((order.orderDate || order.orderTime || order.navDate) as string)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingMore ? <span className="text-sm text-gray-500">Loading more orders...</span> : null}
        {!hasNext && orders.length > 0 ? <span className="text-sm text-gray-400">End of order history</span> : null}
      </div>
    </div>
  );
};
