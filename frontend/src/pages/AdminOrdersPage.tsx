import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Calendar, Search, RefreshCcw, XCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchAllOrders, cancelOrder } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { useState } from 'react';
import type { AdminOrder } from '../lib/types';

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100  text-green-700',
  packed:    'bg-blue-100   text-blue-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100    text-red-700',
  refunded:  'bg-orange-100 text-orange-700',
};

interface CancelModalProps {
  order: AdminOrder;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

function CancelModal({ order, onConfirm, onClose, isLoading }: CancelModalProps) {
  const [reason, setReason] = useState('Cancelled by admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Modal header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-ceylon-charcoal text-lg">Cancel Order</h2>
            <p className="text-xs text-gray-500 font-mono">{order.orderId}</p>
          </div>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">{order.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{order.customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmountMinor / 100)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current status</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold uppercase', STATUS_STYLE[order.status])}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Reason input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Reason <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-ceylon-gold/50 focus:border-ceylon-gold resize-none"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>This will release the reserved inventory back to stock and cannot be undone.</span>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
            ) : (
              <><XCircle className="w-4 h-4" /> Cancel Order</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAllOrders,
  });

  const orders = data?.orders || [];

  const filteredOrders = orders.filter((order) =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget._id);
    try {
      await cancelOrder(cancelTarget._id, reason);
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      showBanner('success', `Order ${cancelTarget.orderId} has been cancelled.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel order.';
      showBanner('error', msg);
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  const canCancel = (status: string) => ['pending', 'paid'].includes(status);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in min-h-[70vh]">
      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          isLoading={cancellingId === cancelTarget._id}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ceylon-charcoal mb-1">Orders Dashboard</h1>
          <p className="text-gray-500">Manage and view all customer orders</p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-ceylon-gold focus:ring-1 focus:ring-ceylon-gold w-full md:w-[300px]"
          />
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className={cn(
          'flex items-start gap-3 px-4 py-3 rounded-lg mb-6 text-sm font-medium border',
          banner.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        )}>
          {banner.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          {banner.message}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-14 bg-gray-50 animate-pulse border-b border-gray-100" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 border-b border-gray-100 animate-pulse-gentle p-4 flex items-center gap-4">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-6 w-32 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 flex flex-col items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-lg text-red-500 font-medium">Failed to load orders. You might not have permission.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-ceylon-charcoal text-white rounded-md hover:bg-ceylon-slate transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gray-700 mb-1">No orders found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'No orders have been placed yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile view: stacked cards */}
          <div className="md:hidden flex flex-col divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <div key={order._id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order ID</span>
                    <p className="font-mono font-medium text-ceylon-charcoal">{order.orderId}</p>
                  </div>
                  <span className={cn('px-2.5 py-1 text-xs font-semibold rounded-full', STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600')}>
                    {order.status}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</span>
                  <p className="font-medium text-gray-900">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">{order.customer.email}</p>
                </div>

                <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total</span>
                      <p className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmountMinor / 100)}</p>
                    </div>
                    {canCancel(order.status) && (
                      <button
                        onClick={() => setCancelTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID & Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-ceylon-charcoal">{order.orderId}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ceylon-cream flex items-center justify-center text-ceylon-gold font-bold">
                          {order.customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-xs text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {order.items.length} item{order.items.length !== 1 && 's'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-full',
                        STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmountMinor / 100)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canCancel(order.status) ? (
                        <button
                          onClick={() => setCancelTarget(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
