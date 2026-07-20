import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Leaf, LogOut, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isPulsing, setIsPulsing] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Leaf className="h-6 w-6 text-ceylon-gold transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl tracking-tight text-ceylon-green">CeylonCart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'font-medium text-sm transition-colors hover:text-ceylon-gold relative group',
                location.pathname === link.path ? 'text-ceylon-gold' : 'text-gray-700'
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
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'font-medium text-sm transition-colors hover:text-ceylon-maroon relative group flex items-center gap-1',
                location.pathname === '/admin' ? 'text-ceylon-maroon' : ''
              )}
            >
              Admin
            </Link>
          )}
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

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                {user?.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-ceylon-maroon transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium bg-ceylon-charcoal text-white px-4 py-2 rounded-md hover:bg-ceylon-slate transition-colors"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-3">
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
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg animate-slide-down border-t border-gray-100">
          <nav className="flex flex-col px-4 py-4 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'font-medium p-2 rounded-md transition-colors text-sm',
                  location.pathname === link.path ? 'bg-ceylon-cream text-ceylon-gold' : 'hover:bg-ceylon-cream/50'
                )}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium p-2 rounded-md hover:bg-ceylon-cream/50 transition-colors text-ceylon-maroon"
              >
                Admin Dashboard
              </Link>
            )}
            <div className="h-px bg-gray-200 my-2" />
            {isAuthenticated ? (
              <>
                <div className="p-2 text-sm font-medium text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Hi, {user?.name}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="font-medium p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium p-2 rounded-md bg-ceylon-charcoal text-white text-center transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
