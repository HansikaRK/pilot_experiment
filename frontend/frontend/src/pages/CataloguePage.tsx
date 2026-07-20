import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { cn, filterProducts } from '../lib/utils';
import { RefreshCcw, Search, X } from 'lucide-react';

const CATEGORIES = ['All', 'Tea', 'Spices', 'Handicrafts', 'Textiles', 'Food', 'Gems'];

export default function CataloguePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => fetchProducts(activeCategory),
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return filterProducts(products, searchQuery, activeCategory);
  }, [products, searchQuery, activeCategory]);

  const hasActiveFilters = searchQuery.trim() !== '' || activeCategory !== 'All';

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ceylon-charcoal to-ceylon-maroon text-ceylon-cream py-16 md:py-24 animate-slide-up">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ceylon-gold to-transparent" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Discover Ceylon's Finest
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-ceylon-cream/90">
            Handpicked artisan products from the pearl of the Indian Ocean.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row gap-3">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, description or category"
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm text-ceylon-charcoal shadow-sm outline-none transition focus:border-ceylon-gold focus:ring-2 focus:ring-ceylon-gold/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-ceylon-charcoal"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-ceylon-charcoal transition hover:border-ceylon-gold hover:text-ceylon-gold"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar items-center justify-start md:justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-5 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap',
                  activeCategory === cat
                    ? 'bg-ceylon-gold text-white shadow-md'
                    : 'bg-white text-ceylon-charcoal hover:bg-ceylon-gold/20'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden glass-card h-[400px] flex flex-col">
                <div className="w-full h-[60%] animate-shimmer" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-5 w-3/4 rounded animate-shimmer" />
                  <div className="h-4 w-1/2 rounded animate-shimmer" />
                  <div className="h-6 w-1/3 rounded animate-shimmer mt-auto" />
                  <div className="h-10 w-full rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <p className="text-lg text-red-500 font-medium">Failed to load products. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-ceylon-charcoal text-white rounded-md hover:bg-ceylon-slate transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-ceylon-charcoal mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}" in the "${activeCategory}" category.`
                : `We couldn't find any products in the "${activeCategory}" category.`}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div key={product._id} className="animate-slide-up" style={{ animationDelay: `${(index % 4) * 0.1}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
