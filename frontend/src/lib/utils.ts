import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
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
