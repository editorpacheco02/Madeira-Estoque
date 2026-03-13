export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  createdAt: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  userId: string;
}

export type View = 'dashboard' | 'inventory' | 'movements' | 'settings';
