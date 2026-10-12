import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, Calendar, RefreshCw, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders, cancelOrder } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import type { OrderResponse } from '../lib/types';

type Order = OrderResponse['order'];

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100  text-green-700',
  packed:    'bg-blue-100   text-blue-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100    text-red-700',
  refunded:  'bg-orange-100 text-orange-700',
};

export default function MyOrdersPage() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null); // _id of order awaiting confirm
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadOrders = async () => {
      try {
        const res = await fetchMyOrders();
        setOrders(res.orders);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [isAuthenticated]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleCancel = async (order: Order) => {
    setCancellingId(order._id);
    setConfirmId(null);
    try {
      await cancelOrder(order._id);
      // Optimistically update the status in local state
      setOrders(prev =>
        prev.map(o => o._id === order._id ? { ...o, status: 'cancelled' } : o)
      );
      showBanner('success', `Order ${order.orderId} has been cancelled. Your inventory will be restocked.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel order. Please try again.';
      showBanner('error', msg);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-bold text-ceylon-charcoal">My Orders</h1>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-ceylon-gold" />
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500">You haven't placed any orders with us.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.orderId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Order header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Order Number</p>
                  <p className="font-mono font-bold text-ceylon-charcoal">{order.orderId}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Date placed</p>
                    <p className="font-medium text-gray-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Total Amount</p>
                    <p className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmountMinor / 100)}</p>
                  </div>
                </div>
              </div>

              {/* Order body */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Status</h3>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'
                  )}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-2 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                      <span className="text-gray-500">{formatCurrency(item.amountMinor / 100)}</span>
                    </div>
                  ))}
                </div>

                {/* Cancel section — only for pending orders */}
                {order.status === 'pending' && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    {confirmId === order._id ? (
                      // Inline confirmation
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium flex-1">
                          Cancel order <span className="font-mono">{order.orderId}</span>? This cannot be undone and will release the reserved stock.
                        </p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleCancel(order)}
                            disabled={cancellingId === order._id}
                            className="px-4 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {cancellingId === order._id
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <XCircle className="w-3.5 h-3.5" />}
                            Yes, Cancel
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            disabled={cancellingId === order._id}
                            className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Keep Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(order._id)}
                        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
