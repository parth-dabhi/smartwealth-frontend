import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { walletApi } from '@/api';
import {
  WalletBalance,
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDateTime, getStatusColor } from '@/utils/helpers';
import { Wallet, TrendingUp, TrendingDown, Lock, RefreshCw } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export const WalletPage = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchWalletData({ page: 0, append: false });
  }, []);

  const fetchWalletData = useCallback(async ({
    page,
    append,
    silent = false,
    query,
  }: {
    page: number;
    append: boolean;
    silent?: boolean;
    query?: {
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
      type?: TransactionType | '';
      category?: TransactionCategory | '';
      status?: TransactionStatus | '';
      startDate?: string;
      endDate?: string;
    };
  }) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }

      const [balanceData, transactionsPage] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(
          page,
          DEFAULT_PAGE_SIZE,
          query?.sortBy ?? sortBy,
          query?.sortDirection ?? sortDirection,
          {
            type: (query?.type ?? typeFilter) || undefined,
            category: (query?.category ?? categoryFilter) || undefined,
            status: (query?.status ?? statusFilter) || undefined,
            startDate: (query?.startDate ?? startDate) || undefined,
            endDate: (query?.endDate ?? endDate) || undefined,
          }
        ),
      ]);

      setBalance(balanceData ?? null);
      const content = Array.isArray(transactionsPage?.content) ? transactionsPage.content : [];
      setTransactions((prev) => (append ? [...prev, ...content] : content));

      const resolvedPage = Number(transactionsPage?.meta?.currentPage ?? page);
      const resolvedTotalPages = Number(transactionsPage?.meta?.totalPages ?? 1);
      const resolvedTotalElements = Number(transactionsPage?.meta?.totalElements ?? content.length);
      const resolvedHasNext = !(transactionsPage?.meta?.last ?? resolvedPage + 1 >= resolvedTotalPages);

      setCurrentPage(resolvedPage);
      setTotalPages(Math.max(resolvedTotalPages, 1));
      setTotalTransactions(resolvedTotalElements);
      setHasNext(resolvedHasNext);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [sortBy, sortDirection, typeFilter, categoryFilter, statusFilter, startDate, endDate]);

  const loadNextPage = useCallback(() => {
    if (isLoading || isRefreshing || isFetchingMore || !hasNext) return;
    fetchWalletData({ page: currentPage + 1, append: true });
  }, [isLoading, isRefreshing, isFetchingMore, hasNext, fetchWalletData, currentPage]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasNext,
    isLoading: isLoading || isRefreshing || isFetchingMore,
    onLoadMore: loadNextPage,
  });

  const applyFilters = () => {
    fetchWalletData({ page: 0, append: false });
  };

  const resetFilters = () => {
    const defaults = {
      sortBy: 'date',
      sortDirection: 'DESC' as const,
      type: '' as const,
      category: '' as const,
      status: '' as const,
      startDate: '',
      endDate: '',
    };
    setSortBy(defaults.sortBy);
    setSortDirection(defaults.sortDirection);
    setTypeFilter(defaults.type);
    setCategoryFilter(defaults.category);
    setStatusFilter(defaults.status);
    setStartDate(defaults.startDate);
    setEndDate(defaults.endDate);
    fetchWalletData({ page: 0, append: false, query: defaults });
  };

  const handleCredit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await walletApi.creditWallet(parseFloat(amount));
      toast.success('Wallet credited successfully!');
      setAmount('');
      setShowCreditModal(false);
      fetchWalletData({ page: 0, append: false, silent: true });
    } catch (error) {
      toast.error('Failed to credit wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDebit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await walletApi.debitWallet(parseFloat(amount));
      toast.success('Wallet debited successfully!');
      setAmount('');
      setShowDebitModal(false);
      fetchWalletData({ page: 0, append: false, silent: true });
    } catch (error) {
      toast.error('Failed to debit wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => fetchWalletData({ page: 0, append: false, silent: true })}
            isLoading={isRefreshing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            onClick={() => setShowCreditModal(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Up
          </Button>
          <Button
            variant="danger"
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            onClick={() => setShowDebitModal(true)}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(balance?.balance || 0)}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Wallet className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {formatCurrency(balance?.availableBalance || 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Locked Balance</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                {formatCurrency(balance?.lockedBalance || 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card
        title="Recent Transactions"
        subtitle={`Total: ${totalTransactions} | Loaded: ${transactions.length} | Page ${currentPage + 1} of ${Math.max(totalPages, 1)} | sortBy=${sortBy}, ${sortDirection}, size=${DEFAULT_PAGE_SIZE}`}
      >
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="date">Sort By: date (default)</option>
            <option value="amount">Sort By: amount</option>
          </select>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as 'ASC' | 'DESC')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="DESC">Direction: DESC (default)</option>
            <option value="ASC">Direction: ASC</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Type: All</option>
            <option value="CREDIT">CREDIT</option>
            <option value="DEBIT">DEBIT</option>
            <option value="LOCK">LOCK</option>
            <option value="UNLOCK">UNLOCK</option>
            <option value="DBT_LOCKED">DBT_LOCKED</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Status: All</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | '')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">Category: All</option>
            <option value="TOP_UP">TOP_UP</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="INVESTMENT">INVESTMENT</option>
            <option value="REDEMPTION">REDEMPTION</option>
            <option value="REFUND">REFUND</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="End date"
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Button size="sm" onClick={applyFilters}>
            Apply
          </Button>
          <Button size="sm" variant="secondary" onClick={resetFilters}>
            Reset
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Transaction ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Category
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono">
                      {txn.transactionId}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDateTime(txn.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center ${
                          txn.type === 'CREDIT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {txn.type === 'CREDIT' ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{txn.category}</td>
                    <td
                      className={`py-3 px-4 text-sm text-right font-semibold ${
                        txn.type === 'CREDIT'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                          txn.status
                        )}`}
                      >
                        {txn.status}
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
        {isFetchingMore ? <span className="text-sm text-gray-500">Loading more transactions...</span> : null}
        {!hasNext && transactions.length > 0 ? <span className="text-sm text-gray-400">End of transactions list</span> : null}
      </div>

      {/* Credit Modal */}
      {showCreditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCreditModal(false);
            setAmount('');
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Top Up Wallet</h2>
            <div className="mb-4">
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleCredit}
                isLoading={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                Top Up
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreditModal(false);
                  setAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Debit Modal */}
      {showDebitModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowDebitModal(false);
            setAmount('');
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Withdraw from Wallet</h2>
            <div className="mb-4">
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="Enter amount"
                min="1"
                max={balance?.availableBalance}
              />
              <p className="text-sm text-gray-600 mt-1">
                Available: {formatCurrency(balance?.availableBalance || 0)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleDebit}
                isLoading={isProcessing}
                variant="danger"
                className="flex-1"
              >
                Withdraw
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDebitModal(false);
                  setAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
