import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function filterProducts(products: Product[], query: string, category: string = 'All'): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;

    if (!normalizedQuery) {
      return matchesCategory;
    }

    const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && searchableText.includes(normalizedQuery);
  });
}

export function simulatePayment(cardNumber: string): Promise<{ success: boolean; transactionId: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cleaned = cardNumber.replace(/\s/g, '');
      // Cards ending in 0000 always fail; all others succeed
      const success = !cleaned.endsWith('0000');
      const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      resolve({ success, transactionId });
    }, 1500 + Math.random() * 1000); // 1.5-2.5s simulated delay
  });
}
