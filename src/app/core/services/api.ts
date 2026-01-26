export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';
  franchiseId: string | null;
};

export type LoginResponse = {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
};


export interface Franchise {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  pricePublic?: number;
  isActive?: boolean;
  franchiseId?: string;
}

export interface Sale {
  id: string;
  franchiseId: string;
  sellerId: string;
  total: number;
  createdAt: string;
  status: string;
}

export interface ChatRoom {
  id: string;
  type: 'GLOBAL' | 'FRANCHISE' | 'DM';
  franchiseId: string | null;
  members: any[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: { id: string; name: string; role: Role };
}
