import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Shield } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product State
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Tea',
    image: '',
    stock: '',
    insuranceRate: '0',
    insuranceLabel: '',
    requiresInsurance: false
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, productId: string | null, removeInventory: boolean, error: string | null }>({
    isOpen: false,
    productId: null,
    removeInventory: false,
    error: null
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, productId: id, removeInventory: false, error: null });
  };

  const confirmDelete = async () => {
    const { productId, removeInventory } = deleteModal;
    if (!productId) return;

    try {
      const res = await api.delete(`/products/${productId}?removeInventory=${removeInventory}`);
      if (res.data.success) {
        setProducts(products.filter(p => p._id !== productId));
        setDeleteModal({ isOpen: false, productId: null, removeInventory: false, error: null });
      }
    } catch (err: any) {
      console.error(err);
      setDeleteModal({ ...deleteModal, error: err.response?.data?.message || 'Failed to delete product. It might be part of an active order.' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        insuranceRate: Number(formData.insuranceRate) || 0,
        insuranceLabel: formData.insuranceLabel.trim(),
        requiresInsurance: Boolean(formData.requiresInsurance)
      };
      const { data } = await api.post('/products', payload);
      if (data.success) {
        setProducts([data.product, ...products]);
        setShowAdd(false);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'Tea',
          image: '',
          stock: '',
          insuranceRate: '0',
          insuranceLabel: '',
          requiresInsurance: false
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    }
  };

  if (loading) return <div className="text-center py-20">Loading products...</div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-ceylon-charcoal">Manage Products</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-ceylon-gold text-white font-medium rounded-lg hover:bg-ceylon-gold-light transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Product</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="text" placeholder="Name" className="border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="text" placeholder="Image URL" className="border p-2 rounded" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            <input required type="number" placeholder="Price (LKR)" className="border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <input required type="number" placeholder="Initial Stock" className="border p-2 rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            <select className="border p-2 rounded md:col-span-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {['Tea', 'Spices', 'Handicrafts', 'Textiles', 'Food', 'Gems'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            {/* Insurance Settings */}
            <div className="md:col-span-2 p-4 border border-amber-200 bg-amber-50/50 rounded-lg flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <Shield className="w-4 h-4 text-amber-600" />
                Shipping Insurance Configuration (Optional)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Insurance Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 2.5 (0 for none)"
                    className="border p-2 rounded w-full bg-white text-sm"
                    value={formData.insuranceRate}
                    onChange={e => setFormData({...formData, insuranceRate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Insurance Label / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Gemstone Coverage, Fragile Transit"
                    className="border p-2 rounded w-full bg-white text-sm"
                    value={formData.insuranceLabel}
                    onChange={e => setFormData({...formData, insuranceLabel: e.target.value})}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mt-1">
                <input
                  type="checkbox"
                  className="rounded text-ceylon-gold focus:ring-ceylon-gold"
                  checked={formData.requiresInsurance}
                  onChange={e => setFormData({...formData, requiresInsurance: e.target.checked})}
                />
                <span>Mandatory Insurance (Cannot be removed by customer at checkout)</span>
              </label>
            </div>

            <textarea required placeholder="Description" className="border p-2 rounded md:col-span-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <button type="submit" className="bg-ceylon-charcoal text-white py-2.5 rounded md:col-span-2 font-medium hover:bg-ceylon-slate transition-colors">Create Product</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Insurance</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 flex items-center gap-4">
                  <img src={product.image} className="w-12 h-12 rounded object-cover" alt={product.name} />
                  <span className="font-medium text-gray-900">{product.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                <td className="px-6 py-4 font-bold text-ceylon-maroon">{formatCurrency(product.price)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {product.insuranceRate > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Shield className="w-3 h-3 text-amber-600" />
                      {product.insuranceRate}% {product.requiresInsurance && '(Mandatory)'}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this product? It will be removed from the store catalog.</p>
              
              <label className="flex items-start gap-3 p-4 bg-red-50 text-red-900 rounded-lg border border-red-100 mb-6 cursor-pointer hover:bg-red-100 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                  checked={deleteModal.removeInventory}
                  onChange={(e) => setDeleteModal({...deleteModal, removeInventory: e.target.checked})}
                />
                <span className="text-sm font-medium">Also permanently wipe all inventory batches for this product across all warehouses.</span>
              </label>

              {deleteModal.error && (
                <div className="mb-6 p-4 bg-red-100 text-red-800 text-sm font-semibold rounded-lg border border-red-200">
                  {deleteModal.error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, productId: null, removeInventory: false, error: null })}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
