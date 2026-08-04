import { useQuery } from '@tanstack/react-query';
import { Package, Calendar, User, Search, RefreshCcw } from 'lucide-react';
import { fetchAllOrders } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import type { AdminOrder } from '../lib/types';
import { useState } from 'react';

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in min-h-[70vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-full",
                    order.paymentStatus === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {order.paymentStatus}
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
                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total</span>
                    <p className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmount)}</p>
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
                        "px-2.5 py-1 text-xs font-semibold rounded-full",
                        order.paymentStatus === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-ceylon-maroon">{formatCurrency(order.totalAmount)}</div>
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
