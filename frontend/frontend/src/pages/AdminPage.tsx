import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  RefreshCcw, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import type { Order } from '../lib/types';

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const { data: orders, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate dashboard statistics
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((acc, order) => acc + order.totalAmount, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = orders?.reduce((acc, order) => 
    acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0) || 0;

  // Filter & Sort orders
  const filteredOrders = orders
    ? orders
        .filter(order => {
          const searchLower = searchQuery.toLowerCase();
          return (
            order.orderId.toLowerCase().includes(searchLower) ||
            order.customer.name.toLowerCase().includes(searchLower) ||
            order.customer.email.toLowerCase().includes(searchLower)
          );
        })
        .sort((a, b) => {
          if (sortBy === 'date-desc') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          if (sortBy === 'date-asc') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          if (sortBy === 'amount-desc') {
            return b.totalAmount - a.totalAmount;
          }
          if (sortBy === 'amount-asc') {
            return a.totalAmount - b.totalAmount;
          }
          return 0;
        })
    : [];

  return (
    <div className="animate-fade-in min-h-screen py-10 px-4 md:px-8 bg-ceylon-cream">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ceylon-warm pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ceylon-charcoal">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and inspect orders from CeylonCart customers.</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 self-start md:self-auto px-4 py-2 bg-white border border-ceylon-warm rounded-lg text-sm font-semibold text-ceylon-charcoal hover:bg-ceylon-warm/50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-ceylon-warm/60 flex items-center justify-between group hover:shadow-md hover:border-ceylon-gold/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Orders</span>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-ceylon-charcoal">{totalOrders}</p>
              )}
            </div>
            <div className="p-3 bg-ceylon-cream rounded-xl text-ceylon-gold group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-ceylon-warm/60 flex items-center justify-between group hover:shadow-md hover:border-ceylon-gold/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Revenue</span>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-ceylon-green">{formatCurrency(totalRevenue)}</p>
              )}
            </div>
            <div className="p-3 bg-ceylon-green/10 rounded-xl text-ceylon-green group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-ceylon-warm/60 flex items-center justify-between group hover:shadow-md hover:border-ceylon-gold/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average Order</span>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-ceylon-charcoal">{formatCurrency(avgOrderValue)}</p>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-ceylon-warm/60 flex items-center justify-between group hover:shadow-md hover:border-ceylon-gold/30 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Items Sold</span>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-ceylon-maroon">{totalItemsSold}</p>
              )}
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-ceylon-maroon group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-ceylon-warm shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-ceylon-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-ceylon-gold focus:border-transparent text-sm bg-ceylon-cream/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-ceylon-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-ceylon-gold focus:border-transparent text-sm bg-white text-ceylon-charcoal cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Total: High to Low</option>
              <option value="amount-asc">Total: Low to High</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-white border border-ceylon-warm rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-ceylon-warm shadow-sm flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-ceylon-maroon animate-pulse" />
            <div>
              <h3 className="text-lg font-semibold text-ceylon-charcoal">Failed to Load Orders</h3>
              <p className="text-gray-500 text-sm mt-1">There was a problem communicating with the server.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-2.5 bg-ceylon-charcoal text-white rounded-lg hover:bg-ceylon-slate active:scale-95 transition-all text-sm font-semibold shadow"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-ceylon-warm shadow-sm flex flex-col items-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-ceylon-charcoal">No Orders Found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery ? 'No orders match your search criteria.' : 'There are currently no orders in the database.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = !!expandedOrders[order._id];
              const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={order._id}
                  className={`bg-white rounded-2xl border border-ceylon-warm shadow-sm transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'ring-2 ring-ceylon-gold/50 shadow-md' : 'hover:border-ceylon-gold/30 hover:shadow-md'
                  }`}
                >
                  {/* Order Main Row */}
                  <div 
                    onClick={() => toggleExpand(order._id)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 cursor-pointer select-none"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="font-bold text-ceylon-gold tracking-wide text-sm md:text-base">
                        {order.orderId}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 justify-between flex-1 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-gray-400 font-semibold">Customer</p>
                        <p className="font-semibold text-ceylon-charcoal text-sm truncate max-w-[150px]">
                          {order.customer.name}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-gray-400 font-semibold">Items</p>
                        <p className="font-semibold text-ceylon-charcoal text-sm">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-gray-400 font-semibold">Total Amount</p>
                        <p className="font-bold text-ceylon-charcoal text-sm md:text-base">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 justify-end col-span-2 md:col-span-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                          order.paymentStatus === 'success' 
                            ? 'bg-ceylon-green/10 text-ceylon-green border border-ceylon-green/20' 
                            : 'bg-ceylon-maroon/10 text-ceylon-maroon border border-ceylon-maroon/20'
                        }`}>
                          Paid
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-ceylon-warm/60 bg-ceylon-cream/20 p-5 md:p-6 space-y-6 animate-slide-down">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Customer Info Section */}
                        <div className="space-y-4 bg-white p-5 rounded-xl border border-ceylon-warm/50 shadow-sm">
                          <h4 className="font-bold text-ceylon-charcoal text-sm uppercase tracking-wider border-b border-ceylon-cream pb-2">
                            Shipping & Contact Details
                          </h4>
                          <div className="space-y-3 text-sm text-ceylon-slate">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-ceylon-gold mt-1 shrink-0" />
                              <div>
                                <p className="font-medium text-ceylon-charcoal">{order.customer.name}</p>
                                <p className="text-gray-500 mt-0.5">
                                  {order.customer.address.street}, {order.customer.address.city}, {order.customer.address.postalCode}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-ceylon-gold shrink-0" />
                              <a href={`mailto:${order.customer.email}`} className="hover:text-ceylon-gold transition-colors truncate">
                                {order.customer.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-ceylon-gold shrink-0" />
                              <a href={`tel:${order.customer.phone}`} className="hover:text-ceylon-gold transition-colors">
                                {order.customer.phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Payment & Order Summary Section */}
                        <div className="space-y-4 bg-white p-5 rounded-xl border border-ceylon-warm/50 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-ceylon-charcoal text-sm uppercase tracking-wider border-b border-ceylon-cream pb-2 mb-3">
                              Payment Summary
                            </h4>
                            <div className="space-y-2.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium text-ceylon-charcoal">Simulated Card Payment</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="font-semibold text-ceylon-green flex items-center gap-1">
                                  ● Successful
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Placed On</span>
                                <span className="text-ceylon-charcoal">{dateStr}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-ceylon-warm pt-3 mt-4 flex justify-between items-baseline">
                            <span className="font-bold text-ceylon-charcoal">Grand Total:</span>
                            <span className="text-xl font-black text-ceylon-charcoal">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="bg-white rounded-xl border border-ceylon-warm/50 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-ceylon-cream/40 text-ceylon-slate border-b border-ceylon-warm/60">
                              <th className="p-4 font-bold">Product Item</th>
                              <th className="p-4 font-bold text-right">Price</th>
                              <th className="p-4 font-bold text-center">Qty</th>
                              <th className="p-4 font-bold text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ceylon-cream/30">
                            {order.items.map((item, idx) => (
                              <tr key={item.productId || idx} className="hover:bg-ceylon-cream/10">
                                <td className="p-4 font-semibold text-ceylon-charcoal">
                                  {item.name}
                                </td>
                                <td className="p-4 text-right text-ceylon-slate">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="p-4 text-center font-medium text-ceylon-charcoal">
                                  {item.quantity}
                                </td>
                                <td className="p-4 text-right font-bold text-ceylon-charcoal">
                                  {formatCurrency(item.price * item.quantity)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
