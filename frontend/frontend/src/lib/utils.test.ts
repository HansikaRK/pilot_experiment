import { describe, expect, it } from 'vitest';
import { filterProducts } from './utils';
import type { Product } from './types';

const products: Product[] = [
  {
    _id: '1',
    name: 'Ceylon Green Tea',
    description: 'Fragrant green tea from the highlands',
    price: 12,
    category: 'Tea',
    image: '',
    stock: 10,
    rating: 4,
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '2',
    name: 'Cardamom Spice',
    description: 'Warm aromatic spice blend',
    price: 8,
    category: 'Spices',
    image: '',
    stock: 20,
    rating: 5,
    createdAt: '',
    updatedAt: '',
  },
];

describe('filterProducts', () => {
  it('filters by search query and category together', () => {
    expect(filterProducts(products, 'tea', 'Tea')).toEqual([products[0]]);
  });

  it('returns all matching products when query is empty', () => {
    expect(filterProducts(products, '', 'All')).toHaveLength(2);
  });
});
