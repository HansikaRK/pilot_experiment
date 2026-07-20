import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Product } from '../lib/types';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-ceylon-gold/30">
      <div className="relative aspect-square overflow-hidden bg-ceylon-cream">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm', getCategoryColor(product.category))}>
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-ceylon-charcoal line-clamp-1 group-hover:text-ceylon-maroon transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4',
                i < Math.floor(product.rating)
                  ? 'fill-ceylon-gold text-ceylon-gold'
                  : 'fill-gray-200 text-gray-200'
              )}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.rating.toFixed(1)})</span>
        </div>
        
        <div className="mt-4 mb-4 flex-1">
          <span className="text-xl font-bold text-ceylon-charcoal">
            {formatCurrency(product.price)}
          </span>
        </div>
        
        <Link
          to={`/product/${product._id}`}
          className="w-full text-center py-2.5 rounded-lg font-medium text-sm border-2 border-ceylon-gold text-ceylon-charcoal hover:bg-ceylon-gold hover:text-white transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
