import axios from 'axios';
import type { Product, OrderPayload, OrderResponse } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchProducts = async (category?: string): Promise<Product[]> => {
  const params = category && category !== 'All' ? { category } : {};
  const { data } = await api.get<Product[]>('/products', { params });
  return data;
};

export const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
};

export const createOrder = async (order: OrderPayload): Promise<OrderResponse> => {
  const { data } = await api.post<OrderResponse>('/orders', order);
  return data;
};

export default api;
