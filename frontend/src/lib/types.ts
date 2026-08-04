export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: 'Tea' | 'Spices' | 'Handicrafts' | 'Textiles' | 'Food' | 'Gems';
  image: string;
  stock: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export interface OrderPayload {
  customer: CustomerInfo;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  paymentStatus: 'success';
}

export interface OrderResponse {
  success: boolean;
  order: {
    orderId: string;
    customer: CustomerInfo;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    createdAt: string;
  };
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

export type ProductCategory = Product['category'];

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface AdminOrder {
  _id: string;
  orderId: string;
  customer: CustomerInfo;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentStatus: 'success' | 'failed';
  createdAt: string;
  updatedAt: string;
}
