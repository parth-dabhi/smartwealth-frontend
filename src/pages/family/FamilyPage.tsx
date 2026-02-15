import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { familyApi } from '@/api';
import { FamilyMember, FamilyRequest } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDateTime } from '@/utils/helpers';

const normalizeCustomerId = (value: string) => value.replace(/\D/g, '').slice(0, 8);

export const FamilyPage = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FamilyRequest[]>([]);
  const [memberCustomerId, setMemberCustomerId] = useState('');
  const [revokeCustomerId, setRevokeCustomerId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const isCustomerIdValid = useMemo(() => memberCustomerId.length === 8, [memberCustomerId]);
  const isRevokeCustomerIdValid = useMemo(() => revokeCustomerId.length === 8, [revokeCustomerId]);

  const fetchFamilyData = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [membersResponse, pendingResponse] = await Promise.all([
        familyApi.getMembers(),
        familyApi.getPendingRequests(),
      ]);

      setMembers(Array.isArray(membersResponse) ? membersResponse : []);
      setPendingRequests(Array.isArray(pendingResponse) ? pendingResponse : []);
    } catch (error) {
      toast.error('Failed to load family data');
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const onSendRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!isCustomerIdValid) {
      toast.error('Customer ID must be exactly 8 digits');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await familyApi.sendAccessRequest(memberCustomerId);
      toast.success(response?.message || 'Request sent');
      setMemberCustomerId('');
      await fetchFamilyData(true);
    } catch (error) {
      // interceptor handles message
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAcceptRequest = async (requestId: number) => {
    try {
      setBusyRequestId(requestId);
      const response = await familyApi.acceptRequest(requestId);
      toast.success(response?.message || 'Request accepted');
      await fetchFamilyData(true);
    } catch (error) {
      // interceptor handles message
    } finally {
      setBusyRequestId(null);
    }
  };

  const onRevoke = async () => {
    if (!isRevokeCustomerIdValid) {
      toast.error('Viewer customer ID must be 8 digits');
      return;
    }

    const confirmed = confirm(`Revoke family access for ${revokeCustomerId}?`);
    if (!confirmed) return;

    try {
      setIsRevoking(true);
      const response = await familyApi.revokeAccess(revokeCustomerId);
      toast.success(response?.message || 'Access revoked');
      setRevokeCustomerId('');
      await fetchFamilyData(true);
    } catch (error) {
      // interceptor handles message
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Family Access</h1>
          <p className="text-sm text-gray-600 mt-1">Manage requests and access links for family portfolio sharing.</p>
        </div>
        <Button variant="secondary" onClick={() => fetchFamilyData(true)} isLoading={isRefreshing}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Send Request" subtitle="Ask a member to share their portfolio">
          <form onSubmit={onSendRequest} className="space-y-3">
            <input
              value={memberCustomerId}
              onChange={(e) => setMemberCustomerId(normalizeCustomerId(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Member 8-digit customer ID"
              maxLength={8}
              inputMode="numeric"
            />
            <Button type="submit" className="w-full" disabled={!isCustomerIdValid} isLoading={isSubmitting}>
              Send Request
            </Button>
          </form>
        </Card>

        <Card title="Revoke Access" subtitle="Remove viewer access">
          <div className="space-y-3">
            <input
              value={revokeCustomerId}
              onChange={(e) => setRevokeCustomerId(normalizeCustomerId(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Viewer 8-digit customer ID"
              maxLength={8}
              inputMode="numeric"
            />
            <Button variant="danger" className="w-full" disabled={!isRevokeCustomerIdValid} isLoading={isRevoking} onClick={onRevoke}>
              Revoke Access
            </Button>
          </div>
        </Card>

        <Card title="Your Links" subtitle={`${members.length} active`}>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">No active links.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.familyMemberId} className="rounded border p-2.5">
                  <p className="font-semibold text-sm">{member.memberName || '-'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Family Member ID: {member.familyMemberId}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Pending Requests For You" subtitle={`${pendingRequests.length} pending`}>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pendingRequests.map((request) => (
              <div key={request.requestId} className="rounded-lg border p-3">
                <p className="font-semibold text-sm">{request.requesterName}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Request ID: {request.requestId} | Requester ID: {request.requesterId}
                </p>
                <p className="text-xs text-gray-600">{request.requestedAt ? formatDateTime(request.requestedAt) : '-'}</p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => onAcceptRequest(request.requestId)}
                  isLoading={busyRequestId === request.requestId}
                >
                  Accept
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
