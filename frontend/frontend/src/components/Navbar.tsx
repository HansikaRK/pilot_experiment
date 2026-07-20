import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Leaf, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, openAuthModal, logout } = useAuth();
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

          <Link to="/cart" className="relative group p-2 text-gray-700 hover:text-ceylon-gold">
            <ShoppingCart className="h-6 w-6 transition-transform group-hover:scale-110" />
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

          {/* User Auth Section */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ceylon-cream border border-ceylon-gold/30 hover:border-ceylon-gold transition-all text-xs font-semibold text-ceylon-green cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-ceylon-green text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-scale-up z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800">{user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ceylon-gold bg-ceylon-cream rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-1.5 text-xs font-semibold text-ceylon-green hover:text-ceylon-gold transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-ceylon-green hover:bg-emerald-900 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Register
              </button>
            </div>
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

            <div className="pt-2 border-t border-gray-100 mt-1">
              {user ? (
                <div className="flex items-center justify-between p-2 bg-ceylon-cream/50 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{user.name}</p>
                    <p className="text-[10px] text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      openAuthModal('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-ceylon-green bg-ceylon-cream rounded-lg"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal('register');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center text-xs font-semibold text-white bg-ceylon-green rounded-lg"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
