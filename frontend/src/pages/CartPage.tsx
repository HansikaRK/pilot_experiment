import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, cartTotal, cartCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-fade-in flex flex-col items-center">
        <div className="bg-white p-8 rounded-full shadow-sm mb-6 inline-block">
          <ShoppingCart className="w-20 h-20 text-gray-300" />
        </div>
        <h2 className="text-3xl font-bold text-ceylon-charcoal mb-4 tracking-tight">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Looks like you haven't added any authentic Sri Lankan products to your cart yet.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-3 bg-ceylon-gold text-white font-semibold rounded-lg hover:bg-ceylon-gold-light transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
        >
          Browse Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-ceylon-charcoal mb-8 tracking-tight">
        Your Cart <span className="text-gray-400 text-lg font-normal ml-2">({cartCount} items)</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden glass-card">
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.productId} className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start group">
                  <Link to={`/product/${item.productId}`} className="shrink-0 overflow-hidden rounded-md border border-gray-100">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </Link>
                  
                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <Link to={`/product/${item.productId}`} className="font-semibold text-lg text-ceylon-charcoal hover:text-ceylon-maroon transition-colors line-clamp-2">
                      {item.name}
                    </Link>
                    <div className="text-ceylon-gold font-bold mt-1">
                      {formatCurrency(item.price)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-4 mt-4 sm:mt-0 items-center">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-10 w-fit">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="px-3 py-1 text-gray-500 hover:text-ceylon-charcoal disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1 text-gray-500 hover:text-ceylon-charcoal transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <Link to="/" className="text-ceylon-maroon font-medium hover:underline w-fit flex items-center gap-1">
            &larr; Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 glass-card">
            <h2 className="text-xl font-bold text-ceylon-charcoal mb-6 border-b border-gray-100 pb-4">Order Summary</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-ceylon-charcoal">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-gray-500 text-sm">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-ceylon-charcoal">Estimated Total</span>
                <span className="font-bold text-2xl text-ceylon-maroon">{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            
            <Link 
              to="/checkout"
              className="w-full flex items-center justify-center py-4 bg-ceylon-gold text-white font-bold rounded-lg hover:bg-ceylon-gold-light transition-colors shadow-md hover:shadow-lg group"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
