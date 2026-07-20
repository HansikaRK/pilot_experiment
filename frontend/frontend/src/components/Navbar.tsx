import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const location = useLocation();
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const navLinks = [
    { name: 'Home', path: '/' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/80 dark-overlay shadow-md py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Leaf className="h-6 w-6 text-ceylon-gold transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl tracking-tight">CeylonCart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'font-medium text-sm transition-colors hover:text-ceylon-gold relative group',
                location.pathname === link.path ? 'text-ceylon-gold' : ''
              )}
            >
              {link.name}
              <span 
                className={cn(
                  'absolute -bottom-1 left-0 w-full h-0.5 bg-ceylon-gold transform origin-left transition-transform duration-300',
                  location.pathname === link.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )}
              />
            </Link>
          ))}
          <Link to="/cart" className="relative group p-2">
            <ShoppingCart className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:text-ceylon-gold" />
            {cartCount > 0 && (
              <span
                className={cn(
                  'absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-ceylon-maroon rounded-full',
                  isPulsing ? 'scale-125 transition-transform' : 'scale-100 transition-transform'
                )}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-4">
          <Link to="/cart" className="relative p-2">
            <ShoppingCart className="h-6 w-6 text-ceylon-gold" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-ceylon-maroon rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-ceylon-charcoal hover:text-ceylon-gold transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg animate-slide-down">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'font-medium p-2 rounded-md transition-colors',
                  location.pathname === link.path ? 'bg-ceylon-cream text-ceylon-gold' : 'hover:bg-ceylon-cream/50'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
