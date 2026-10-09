import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Package, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { OrderResponse } from '../lib/types';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  order: OrderResponse['order'];
  transactionId: string;
}

export default function OrderConfirmationPage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const state = location.state as LocationState | null;

  // Invalidate state if user logs out
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!state || !state.order) {
    return <Navigate to="/" replace />;
  }

  const { order, transactionId } = state;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 animate-fade-in flex flex-col items-center">
      
      {/* Decorative success animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-ceylon-green/20 rounded-full animate-ping opacity-75" />
        <div className="relative bg-white rounded-full p-2">
          <CheckCircle className="w-20 h-20 text-ceylon-green animate-slide-up" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-ceylon-charcoal mb-4 text-center tracking-tight">
        Order Confirmed!
      </h1>
      
      <p className="text-gray-600 text-lg mb-10 text-center max-w-md">
        Thank you, {order.customer.name.split(' ')[0]}! Your order has been placed successfully and is being processed.
      </p>

      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden glass-card">
        {/* Header */}
        <div className="bg-ceylon-charcoal text-white p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-ceylon-gold" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order ID</p>
              <p className="font-mono text-lg font-bold text-ceylon-gold">{order.orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4" />
            {new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Details section */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">
                Shipping Address
              </h3>
              <address className="not-italic text-gray-600 text-sm leading-relaxed">
                <strong>{order.customer.name}</strong><br />
                {order.customer.address.street}<br />
                {order.customer.address.city}, {order.customer.address.postalCode}
              </address>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">
                Payment Info
              </h3>
              <div className="text-sm text-gray-600 flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  Simulated Card Payment
                </span>
                <span className="text-xs text-gray-400">TXN: {transactionId}</span>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
            Order Items
          </h3>
          
          <div className="flex flex-col gap-3 mb-6">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded text-xs">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700 truncate pr-4">{item.name}</span>
                </div>
                <div className="text-gray-600 font-medium">
                  {formatCurrency(item.amountMinor / 100)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Details */}
          <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalMinor / 100)}</span>
            </div>
            {order.discountTotalMinor > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountTotalMinor / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{order.shippingCostMinor > 0 ? formatCurrency(order.shippingCostMinor / 100) : 'Free'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatCurrency(order.taxAmountMinor / 100)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-bold text-lg text-gray-900">Total Amount</span>
            <span className="font-bold text-2xl text-ceylon-maroon">{formatCurrency(order.totalAmountMinor / 100)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-ceylon-gold text-ceylon-charcoal font-semibold rounded-lg hover:bg-ceylon-gold hover:text-white transition-all group shadow-sm"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

    </div>
  );
}
