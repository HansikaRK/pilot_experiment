import { Leaf } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ceylon-charcoal text-ceylon-cream/70 mt-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ceylon-gold to-ceylon-maroon" />
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-white">
            <Leaf className="h-5 w-5 text-ceylon-gold" />
            <span className="font-bold text-xl tracking-tight">CeylonCart</span>
          </div>
          <p className="text-sm">Authentic Sri Lankan Products</p>
        </div>
        
        <div className="text-sm text-center md:text-right">
          <p>&copy; {currentYear} CeylonCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
