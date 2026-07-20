import axios from 'axios';
import type { Product, OrderPayload, OrderResponse, AuthResponse, User, AdminOrder } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Auth API ---

export const registerUser = async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  const { data: res } = await api.post<AuthResponse>('/auth/register', data);
  return res;
};

export const loginUser = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  const { data: res } = await api.post<AuthResponse>('/auth/login', data);
  return res;
};

export const fetchCurrentUser = async (): Promise<{ success: boolean; user: User }> => {
  const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
  return data;
};

// --- Product API ---

export const fetchProducts = async (category?: string, keyword?: string): Promise<Product[]> => {
  const params: Record<string, string> = {};
  if (category && category !== 'All') params.category = category;
  if (keyword && keyword.trim()) params.keyword = keyword.trim();
  const { data } = await api.get<Product[]>('/products', { params });
  return data;
};

export const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
};

// --- Order API ---

export const createOrder = async (order: OrderPayload): Promise<OrderResponse> => {
  const { data } = await api.post<OrderResponse>('/orders', order);
  return data;
};

export const fetchAllOrders = async (): Promise<{ success: boolean; orders: AdminOrder[] }> => {
  const { data } = await api.get<{ success: boolean; orders: AdminOrder[] }>('/orders');
  return data;
};

export default api;
