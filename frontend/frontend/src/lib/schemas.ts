import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone format'),
  street: z.string().min(1, 'Street address is required').max(200).trim(),
  city: z.string().min(1, 'City is required').max(100).trim(),
  postalCode: z.string().min(1, 'Postal code is required').max(20).trim(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const paymentSchema = z.object({
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(19)
    .regex(/^[0-9\s]+$/, 'Invalid card number'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().min(3, 'CVV must be 3-4 digits').max(4)
    .regex(/^[0-9]+$/, 'CVV must be numbers only'),
  cardholderName: z.string().min(1, 'Cardholder name is required').max(100).trim(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
