import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, ShoppingCart, CheckCircle, Minus, Plus } from 'lucide-react';
import { fetchProduct } from '../lib/api';
import { useCart } from '../context/CartContext';
import { formatCurrency, cn } from '../lib/utils';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const { addItem } = useCart();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 animate-pulse-gentle">
        <div className="w-full md:w-1/2 h-[400px] md:h-[600px] rounded-xl animate-shimmer" />
        <div className="w-full md:w-1/2 flex flex-col gap-4 py-4">
          <div className="h-8 w-24 rounded animate-shimmer" />
          <div className="h-12 w-3/4 rounded animate-shimmer" />
          <div className="h-6 w-1/3 rounded animate-shimmer" />
          <div className="h-8 w-1/4 rounded animate-shimmer mt-4" />
          <div className="h-32 w-full rounded animate-shimmer mt-6" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-ceylon-charcoal mb-4">Product Not Found</h2>
        <p className="mb-8 text-gray-600">The product you're looking for doesn't exist or an error occurred.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-ceylon-gold text-white rounded-lg hover:bg-ceylon-gold-light transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tea': return 'bg-ceylon-green text-white';
      case 'Spices': return 'bg-ceylon-amber text-white';
      case 'Handicrafts': return 'bg-ceylon-maroon text-white';
      case 'Textiles': return 'bg-purple-600 text-white';
      case 'Food': return 'bg-orange-500 text-white';
      case 'Gems': return 'bg-blue-600 text-white';
      default: return 'bg-ceylon-slate text-white';
    }
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (product.stock <= 10) return { text: `Low Stock (${product.stock} left)`, color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 animate-fade-in relative">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-ceylon-charcoal mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Products
      </Link>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="w-full md:w-1/2 animate-slide-up">
          <div className="relative aspect-square md:aspect-[4/5] rounded-xl overflow-hidden shadow-lg bg-white">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 flex flex-col py-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-2">
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', getCategoryColor(product.category))}>
              {product.category}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ceylon-charcoal mt-4 mb-4 tracking-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-5 h-5',
                    i < Math.floor(product.rating)
                      ? 'fill-ceylon-gold text-ceylon-gold'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">({product.rating.toFixed(1)} rating)</span>
          </div>
          
          <div className="text-3xl font-bold text-ceylon-maroon mb-6">
            {formatCurrency(product.price)}
          </div>
          
          <div className="prose prose-sm md:prose-base text-gray-600 mb-8 max-w-none leading-relaxed">
            <p>{product.description}</p>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className={cn('font-medium', stockStatus.color)}>
                {stockStatus.text}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white w-fit">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || product.stock === 0}
                  className="p-3 text-gray-600 hover:text-ceylon-charcoal disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock || product.stock === 0}
                  className="p-3 text-gray-600 hover:text-ceylon-charcoal disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-8 bg-ceylon-gold text-white font-semibold rounded-lg hover:bg-ceylon-gold-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={cn(
        "fixed bottom-6 right-6 bg-white border-l-4 border-ceylon-green shadow-xl rounded-lg p-4 flex items-center gap-3 transition-all duration-300 z-50",
        showToast ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}>
        <CheckCircle className="w-6 h-6 text-ceylon-green" />
        <div>
          <p className="font-semibold text-ceylon-charcoal text-sm">Added to Cart</p>
          <p className="text-xs text-gray-500">{quantity} × {product.name}</p>
        </div>
      </div>
    </div>
  );
}
