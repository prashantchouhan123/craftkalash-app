export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  hoverImage?: string;
  description: string;
  details: string[];
  materials: string[];
  dimensions: string;
  ageRange: string;
  inStock: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  sku?: string;
  stock?: number;
  weight?: string;
  slug?: string;
  category_id?: string;
  status?: 'draft' | 'published' | 'archived';
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description: string;
  image: string;
  created_at?: string;
}

export interface Review {
  id: string;
  productId?: string;
  user_id?: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  created_at?: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  default_address: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

export interface Order {
  id: string;
  user_id: string;
  address_id: string;
  order_number: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'Pending COD' | 'Payment Verification Pending';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items?: OrderItem[];
  shippingAddress?: Address;
  utr?: string;
  screenshot_url?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active: boolean;
  expiry: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  created_at: string;
}
