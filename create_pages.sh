#!/bin/bash

# Create Investments Page
cat > src/pages/investment/InvestmentsPage.tsx << 'EOF'
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { investmentApi, schemesApi } from '@/api';
import { InvestmentOrder } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { TrendingUp, History } from 'lucide-react';

export const InvestmentsPage = () => {
  const [orders, setOrders] = useState<InvestmentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await investmentApi.getOrderHistory();
      setOrders(data.content);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Button onClick={() => setShowBuyModal(true)}>
          <TrendingUp className="w-4 h-4 mr-2" />
          New Investment
        </Button>
      </div>

      <Card title="Order History" subtitle="Your investment transactions">
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
                    No orders yet. Start investing!
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono">{order.orderId}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{order.schemeName}</p>
                      <p className="text-xs text-gray-600">{order.planName}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">{order.investmentType}</td>
                    <td className="py-3 px-4 text-sm">{order.investmentMode}</td>
                    <td className="py-3 px-4 text-right text-sm font-semibold">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {order.units ? order.units.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(order.orderDate)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
EOF

# Create SIPs Page
cat > src/pages/sip/SipsPage.tsx << 'EOF'
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { sipApi } from '@/api';
import { SipMandate } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { Repeat, Pause, Play, XCircle } from 'lucide-react';

export const SipsPage = () => {
  const [sips, setSips] = useState<SipMandate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSips();
  }, []);

  const fetchSips = async () => {
    try {
      setIsLoading(true);
      const data = await sipApi.getAllSips();
      setSips(data.sips);
    } catch (error) {
      toast.error('Failed to fetch SIPs');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (sipMandateId: number) => {
    try {
      await sipApi.pauseSip(sipMandateId);
      toast.success('SIP paused successfully');
      fetchSips();
    } catch (error) {
      toast.error('Failed to pause SIP');
    }
  };

  const handleResume = async (sipMandateId: number) => {
    try {
      await sipApi.resumeSip(sipMandateId);
      toast.success('SIP resumed successfully');
      fetchSips();
    } catch (error) {
      toast.error('Failed to resume SIP');
    }
  };

  const handleCancel = async (sipMandateId: number) => {
    if (!confirm('Are you sure you want to cancel this SIP?')) return;
    try {
      await sipApi.cancelSip(sipMandateId);
      toast.success('SIP cancelled successfully');
      fetchSips();
    } catch (error) {
      toast.error('Failed to cancel SIP');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SIP Mandates</h1>
        <Button>
          <Repeat className="w-4 h-4 mr-2" />
          Create New SIP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Active SIPs</p>
          <p className="text-3xl font-bold mt-2">{sips.filter(s => s.status === 'ACTIVE').length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Monthly Investment</p>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(sips.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Executions</p>
          <p className="text-3xl font-bold mt-2">
            {sips.reduce((sum, s) => sum + s.successfulExecutions, 0)}
          </p>
        </Card>
      </div>

      <Card title="Your SIPs">
        <div className="space-y-4">
          {sips.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No SIPs created yet</p>
          ) : (
            sips.map((sip) => (
              <div key={sip.sipMandateId} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{sip.schemeName}</h3>
                    <p className="text-sm text-gray-600">{sip.planName}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-semibold">{formatCurrency(sip.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Day of Month</p>
                        <p className="font-semibold">{sip.dayOfMonth}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Next Execution</p>
                        <p className="font-semibold">{sip.nextExecutionDate ? formatDate(sip.nextExecutionDate) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-semibold">
                          {sip.totalExecutions > 0 ? `${((sip.successfulExecutions / sip.totalExecutions) * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(sip.status)}`}>
                      {sip.status}
                    </span>
                    <div className="flex space-x-2">
                      {sip.status === 'ACTIVE' && (
                        <button
                          onClick={() => handlePause(sip.sipMandateId)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {sip.status === 'PAUSED' && (
                        <button
                          onClick={() => handleResume(sip.sipMandateId)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Resume"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {sip.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(sip.sipMandateId)}
                          className="p-2 hover:bg-gray-200 rounded text-red-600"
                          title="Cancel"
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
    </div>
  );
};
EOF

echo "Created Investment and SIP pages"

# Create remaining placeholder pages
for page in goals schemes family; do
  PAGE_NAME="${page^}Page"
  TITLE="${page^}"
  cat > "src/pages/${page}/${PAGE_NAME}.tsx" << EOF
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const ${PAGE_NAME} = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">${TITLE}</h1>
        <Button>Add New</Button>
      </div>
      <Card title="${TITLE} Management">
        <p className="text-gray-600">
          ${TITLE} management features will be displayed here.
          Full implementation with forms, tables, and API integration.
        </p>
      </Card>
    </div>
  );
};
EOF
done

echo "✅ All pages created successfully!"

