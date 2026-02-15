import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sipApi } from '@/api';
import { SipMandate } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { Pause, Play, XCircle, RefreshCw, ExternalLink, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseDateSafe = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : toDateOnly(parsed);
};

export const SipsPage = () => {
  const navigate = useNavigate();
  const [sips, setSips] = useState<SipMandate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchSips();
  }, []);

  const fetchSips = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await sipApi.getAllSips();
      const mandates = Array.isArray(data?.sipMandates) ? data.sipMandates : [];
      setSips(mandates);
    } catch (error) {
      toast.error('Failed to fetch SIPs');
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const runAction = async (sipMandateId: number, action: 'pause' | 'resume' | 'cancel') => {
    try {
      setIsActionLoading(sipMandateId);
      if (action === 'pause') {
        await sipApi.pauseSip(sipMandateId);
        toast.success('SIP paused successfully');
      } else if (action === 'resume') {
        await sipApi.resumeSip(sipMandateId);
        toast.success('SIP resumed successfully');
      } else {
        if (!confirm('Are you sure you want to cancel this SIP?')) return;
        await sipApi.cancelSip(sipMandateId);
        toast.success('SIP cancelled successfully');
      }
      fetchSips(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} SIP`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const counts = {
    total: sips.length,
    active: sips.filter((sip) => String(sip.status) === 'ACTIVE').length,
    paused: sips.filter((sip) => String(sip.status) === 'PAUSED').length,
    cancelled: sips.filter((sip) => String(sip.status) === 'CANCELLED').length,
    completed: sips.filter((sip) => String(sip.status) === 'COMPLETED').length,
    suspended: sips.filter((sip) => String(sip.status) === 'SUSPENDED').length,
  };
  const filteredSips = statusFilter === 'ALL' ? sips : sips.filter((sip) => String(sip.status) === statusFilter);

  const getSipsForDate = (date: Date) => {
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    return filteredSips.filter((sip) => {
      const sipDayRaw = Number(sip.sipDay ?? sip.dayOfMonth ?? 0);
      if (!Number.isFinite(sipDayRaw) || sipDayRaw < 1 || sipDayRaw > 31) return false;
      if (sipDayRaw > daysInMonth) return false;
      if (sipDayRaw !== day) return false;

      const candidateDate = toDateOnly(date);
      const start = parseDateSafe(sip.startDate);
      const end = parseDateSafe(sip.endDate);

      if (start && candidateDate < start) return false;
      if (end && candidateDate > end) return false;
      return true;
    });
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const leadingBlanks = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

    for (let i = leadingBlanks; i > 0; i -= 1) {
      cells.push({ date: new Date(year, month, 1 - i), inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const nextIndex = cells.length - (leadingBlanks + daysInMonth) + 1;
      cells.push({ date: new Date(year, month + 1, nextIndex), inCurrentMonth: false });
    }

    return cells;
  }, [calendarMonth]);

  const selectedDaySips = useMemo(() => {
    if (!selectedDay) return [];
    return getSipsForDate(selectedDay);
  }, [selectedDay, filteredSips]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SIP Mandates</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Calendar
          </Button>
          <Button variant="secondary" onClick={() => fetchSips(true)} isLoading={isRefreshing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card title="SIP Summary">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 border-gray-200'
            }`}
          >
            Total: <span className="font-semibold">{counts.total}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'ACTIVE' ? 'bg-blue-700 text-white border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            Active: <span className="font-semibold">{counts.active}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAUSED')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'PAUSED' ? 'bg-gray-700 text-white border-gray-700' : 'bg-gray-200 text-gray-800 border-gray-300'
            }`}
          >
            Paused: <span className="font-semibold">{counts.paused}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'CANCELLED' ? 'bg-red-700 text-white border-red-700' : 'bg-red-100 text-red-800 border-red-200'
            }`}
          >
            Cancelled: <span className="font-semibold">{counts.cancelled}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'COMPLETED' ? 'bg-green-700 text-white border-green-700' : 'bg-green-100 text-green-800 border-green-200'
            }`}
          >
            Completed: <span className="font-semibold">{counts.completed}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`px-3 py-2 rounded-full text-sm border ${
              statusFilter === 'SUSPENDED' ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}
          >
            Suspended: <span className="font-semibold">{counts.suspended}</span>
          </button>
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        <Card title="SIP Calendar">
          <div className="mb-3 flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <p className="text-lg font-semibold">
              {calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-xs mb-1.5">
            {DAY_HEADERS.map((day) => (
              <div key={day} className="text-center font-medium text-gray-600 py-0.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(({ date, inCurrentMonth }) => {
              const daySips = inCurrentMonth ? getSipsForDate(date) : [];
              const isToday = toDateOnly(date).getTime() === toDateOnly(new Date()).getTime();
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    if (!inCurrentMonth || daySips.length === 0) return;
                    setSelectedDay(date);
                  }}
                  className={`min-h-20 rounded-lg border p-1.5 text-left transition-colors ${
                    inCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
                  } ${isToday ? 'border-primary-300' : 'border-gray-200'}`}
                >
                  <p className={`text-sm font-medium ${inCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </p>
                  {inCurrentMonth && daySips.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {daySips.slice(0, 2).map((sip) => (
                        <div key={sip.sipMandateId} className={`rounded px-1.5 py-1 text-[11px] ${getStatusColor(String(sip.status))}`}>
                          {formatCurrency(sip.sipAmount ?? sip.amount ?? 0)} · {sip.status}
                        </div>
                      ))}
                      {daySips.length > 2 && (
                        <p className="text-[11px] text-gray-600">+{daySips.length - 2} more</p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 mt-3">Click a day to view and manage SIPs scheduled on that date.</p>
        </Card>
      ) : (
        <Card title="Your SIPs">
          <p className="text-sm text-gray-600 mb-3">
            Showing <span className="font-semibold">{filteredSips.length}</span> of{' '}
            <span className="font-semibold">{counts.total}</span>
          </p>
          <div className="space-y-4">
            {filteredSips.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {sips.length === 0 ? 'No SIP mandates yet' : 'No SIP mandates match selected filter'}
              </p>
            ) : (
              filteredSips.map((sip) => (
                <div key={sip.sipMandateId} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {sip.schemeName || 'Plan'} {sip.planName ? `- ${sip.planName}` : ''}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">SIP ID: {sip.sipMandateId} | Plan ID: {sip.planId}</p>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">SIP Amount</p>
                          <p className="font-semibold">{formatCurrency(sip.sipAmount ?? sip.amount ?? 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">SIP Day</p>
                          <p className="font-semibold">{sip.sipDay ?? sip.dayOfMonth ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-semibold">{sip.startDate ? formatDate(sip.startDate) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Next Run</p>
                          <p className="font-semibold">{sip.nextRunAt ? formatDate(sip.nextRunAt) : sip.nextExecutionDate ? formatDate(sip.nextExecutionDate) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Installments</p>
                          <p className="font-semibold">{sip.completedInstallments ?? 0} / {sip.totalInstallments ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-semibold">{sip.endDate ? formatDate(sip.endDate) : '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(sip.status)}`}>
                        {sip.status}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/mutual-fund-schemes/plans/${sip.planId}`, { state: { from: '/sips' } })}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="View Plan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {sip.status === 'ACTIVE' && (
                          <button
                            onClick={() => runAction(sip.sipMandateId, 'pause')}
                            className="p-2 hover:bg-gray-200 rounded"
                            title="Pause"
                            disabled={isActionLoading === sip.sipMandateId}
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {sip.status === 'PAUSED' && (
                          <button
                            onClick={() => runAction(sip.sipMandateId, 'resume')}
                            className="p-2 hover:bg-gray-200 rounded"
                            title="Resume"
                            disabled={isActionLoading === sip.sipMandateId}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {(sip.status === 'ACTIVE' || sip.status === 'PAUSED') && (
                          <button
                            onClick={() => runAction(sip.sipMandateId, 'cancel')}
                            className="p-2 hover:bg-gray-200 rounded text-red-600"
                            title="Cancel"
                            disabled={isActionLoading === sip.sipMandateId}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-lg font-semibold">
                SIPs on {formatDate(selectedDay)}
              </h3>
              <Button size="sm" variant="secondary" onClick={() => setSelectedDay(null)}>
                Close
              </Button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {selectedDaySips.length === 0 ? (
                <p className="text-sm text-gray-500">No SIPs scheduled for this day.</p>
              ) : (
                selectedDaySips.map((sip) => (
                  <div key={sip.sipMandateId} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{sip.planName || sip.schemeName || 'Plan'}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          SIP ID: {sip.sipMandateId} • Amount: {formatCurrency(sip.sipAmount ?? sip.amount ?? 0)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-full ${getStatusColor(sip.status)}`}>{sip.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/mutual-fund-schemes/plans/${sip.planId}`, { state: { from: '/sips' } })}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Plan
                      </Button>
                      {sip.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => runAction(sip.sipMandateId, 'pause')}
                          isLoading={isActionLoading === sip.sipMandateId}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {sip.status === 'PAUSED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => runAction(sip.sipMandateId, 'resume')}
                          isLoading={isActionLoading === sip.sipMandateId}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      {(sip.status === 'ACTIVE' || sip.status === 'PAUSED') && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => runAction(sip.sipMandateId, 'cancel')}
                          isLoading={isActionLoading === sip.sipMandateId}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
