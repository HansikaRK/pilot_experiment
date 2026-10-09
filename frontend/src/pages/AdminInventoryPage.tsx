import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar } from 'lucide-react';
import api from '../lib/api';

export default function AdminInventoryPage() {
  const [data, setData] = useState<{ warehouses: any[]; batches: any[] }>({ warehouses: [], batches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/inventory');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch inventory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (loading) return <div className="text-center py-20">Loading inventory...</div>;

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).wName.value;
    const location = (e.target as any).wLocation.value;
    const { data: res } = await api.post('/inventory/warehouses', { name, location });
    if (res.success) {
      setData({ ...data, warehouses: [...data.warehouses, res.warehouse] });
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = e.target as any;
    const payload = {
      productId: t.productId.value,
      warehouseId: t.warehouseId.value,
      quantity: Number(t.quantity.value),
      expiryDate: t.expiry.value
    };
    const { data: res } = await api.post('/inventory/batches', payload);
    if (res.success) {
      setData({ ...data, batches: [res.batch, ...data.batches] });
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-ceylon-charcoal mb-8">Inventory Management</h1>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Warehouses</h2>
      </div>
      <form onSubmit={handleAddWarehouse} className="mb-6 flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <input required name="wName" placeholder="Warehouse Name" className="border p-2 rounded flex-1" />
        <input required name="wLocation" placeholder="Location" className="border p-2 rounded flex-1" />
        <button type="submit" className="bg-ceylon-charcoal text-white px-4 py-2 rounded font-medium">Add Warehouse</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {data.warehouses.map(w => (
          <div key={w._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-ceylon-charcoal flex items-center gap-2">
              <Package className="w-5 h-5 text-ceylon-gold" /> {w.name}
            </h3>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {w.location}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Inventory Batches</h2>
      <form onSubmit={handleAddBatch} className="mb-6 flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <input required name="productId" placeholder="Product ID" className="border p-2 rounded flex-1 min-w-[200px]" />
        <select required name="warehouseId" className="border p-2 rounded flex-1 min-w-[200px]">
          <option value="">Select Warehouse</option>
          {data.warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <input required name="quantity" type="number" placeholder="Quantity" className="border p-2 rounded w-32" />
        <input required name="expiry" type="date" className="border p-2 rounded" />
        <button type="submit" className="bg-ceylon-gold text-white px-4 py-2 rounded font-medium w-full md:w-auto">Refill Stock</button>
      </form>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.batches.map(batch => (
              <tr key={batch._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">{batch.productId?.name || 'Unknown'}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{batch._id}</td>
                <td className="px-6 py-4 text-right font-bold text-ceylon-charcoal">{batch.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${batch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
