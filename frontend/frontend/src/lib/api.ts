import axios from 'axios';
import type {
  Product,
  OrderPayload,
  OrderResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor to add Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ceyloncart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const getCurrentUser = async (): Promise<{ success: boolean; user: User }> => {
  const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
  return data;
};

export const logoutUser = async (): Promise<{ success: boolean }> => {
  const { data } = await api.post<{ success: boolean }>('/auth/logout');
  return data;
};

export default api;
