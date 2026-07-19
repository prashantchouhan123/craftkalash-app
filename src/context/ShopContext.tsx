import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, CartItem, ToastMessage, Profile, Address, Order } from '../types';
import { 
  authService, 
  productService, 
  categoryService, 
  wishlistService, 
  orderService, 
  addressService, 
  cartService, 
  isSupabaseConfigured 
} from '../services/supabaseService';

interface ShopContextType {
  // Auth & Profile
  user: any;
  profile: Profile | null;
  isAdmin: boolean;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  changeRole: (role: 'customer' | 'admin') => Promise<void>;
  
  // Data lists
  products: Product[];
  categories: Category[];
  orders: Order[];
  
  // Cart & Wishlist states
  cart: CartItem[];
  wishlist: Product[];
  toasts: ToastMessage[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  
  // UI setters
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSortBy: (sort: string) => void;
  
  // Cart & Wishlist Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  
  // Toast
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Helper calculations
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  
  // Orders Actions
  placeOrder: (
    address: Omit<Address, 'id' | 'user_id'>, 
    paymentMethod: string, 
    utr?: string, 
    screenshotUrl?: string,
    razorpayDetails?: {
      orderId: string;
      paymentId: string;
      signature: string;
    }
  ) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => Promise<boolean>;
  updatePaymentStatus: (orderId: string, status: 'pending' | 'paid' | 'failed' | 'refunded' | 'Pending COD' | 'Payment Verification Pending') => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  
  // Custom API admin products addition
  addAdminProduct: (prod: Partial<Product>) => Promise<boolean>;
  editAdminProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteAdminProduct: (id: string) => Promise<boolean>;
  addAdminCategory: (cat: Partial<Category>) => Promise<boolean>;
  editAdminCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
  isSupabaseConfigured: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  // Authentication & Profile State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Loaded Catalog Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('craftkalash_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('craftkalash_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  // Search and Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Load Catalog Products & Categories on Mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const prodData = await productService.getProducts();
        const catData = await categoryService.getCategories();
        setProducts(prodData);
        setCategories(catData);
      } catch (err) {
        console.error('Catalog load error:', err);
      }
    }
    loadCatalog();
  }, []);

  // Check Active Auth Session on Mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const activeUser = await authService.getCurrentUser();
        if (activeUser) {
          setUser(activeUser);
          const activeProfile = await authService.getProfile(activeUser.id);
          if (activeProfile) {
            // Safe fallback and auto-sync for admin@craftkalash.com
            if (activeUser.email?.toLowerCase() === 'admin@craftkalash.com') {
              activeProfile.role = 'admin';
            }
            setProfile(activeProfile);
            setIsAdmin(activeProfile.role === 'admin');
            
            // Sync Wishlist from Supabase/Fallback DB
            const userWishlist = await wishlistService.getWishlist(activeUser.id);
            if (userWishlist.length > 0) {
              setWishlist(userWishlist);
            }

            // Sync Cart from Supabase
            const userCart = await cartService.getCart(activeUser.id);
            if (userCart.length > 0) {
              setCart(userCart);
            }
            
            // Sync Orders
            const userOrders = activeProfile.role === 'admin'
              ? await orderService.getAllOrders()
              : await orderService.getOrders(activeUser.id);
            setOrders(userOrders);
          }
        }
      } catch (err) {
        console.error('Auth session restore error:', err);
      }
    }
    checkAuth();
  }, []);

  // Sync state to localStorage for offline robustness
  useEffect(() => {
    localStorage.setItem('craftkalash_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('craftkalash_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Toast System
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Functions
  const register = async (fullName: string, email: string, phone: string, password: string) => {
    const res = await authService.register(fullName, email, phone, password);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    if (res.user && res.user.email?.toLowerCase() === 'admin@craftkalash.com' && res.profile) {
      res.profile.role = 'admin';
    }
    setUser(res.user);
    setProfile(res.profile);
    setIsAdmin(res.profile?.role === 'admin');
    addToast('Account created successfully! Welcome to CraftKalash.', 'success');
    return true;
  };

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    if (res.user && res.user.email?.toLowerCase() === 'admin@craftkalash.com' && res.profile) {
      res.profile.role = 'admin';
    }
    setUser(res.user);
    setProfile(res.profile);
    setIsAdmin(res.profile?.role === 'admin');
    
    // Refresh user-specific details on successful login
    if (res.profile) {
      const userWishlist = await wishlistService.getWishlist(res.profile.id);
      setWishlist(userWishlist);
      const userCart = await cartService.getCart(res.profile.id);
      if (userCart.length > 0) {
        setCart(userCart);
      }
      const userOrders = res.profile.role === 'admin'
        ? await orderService.getAllOrders()
        : await orderService.getOrders(res.profile.id);
      setOrders(userOrders);
    }
    
    addToast('Logged in successfully.', 'success');
    return true;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setOrders([]);
    setCart([]);
    setWishlist([]);
    addToast('Logged out of session safely.', 'info');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return false;
    const res = await authService.updateProfile(profile.id, updates);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    setProfile(res.profile);
    setIsAdmin(res.profile?.role === 'admin');
    addToast('Profile updated successfully.', 'success');
    return true;
  };

  const changeRole = async (role: 'customer' | 'admin') => {
    if (!profile) return;
    const res = await authService.changeRole(profile.id, role);
    if (res) {
      setProfile(res);
      setIsAdmin(res.role === 'admin');
      
      // If role becomes admin, we refresh all orders for their overview
      if (res.role === 'admin') {
        const allOrd = await orderService.getAllOrders();
        setOrders(allOrd);
        addToast(`Role upgraded to Admin! Access panel loaded.`, 'success');
      } else {
        const userOrd = await orderService.getOrders(res.id);
        setOrders(userOrd);
        addToast(`Switched back to Customer view.`, 'info');
      }
    }
  };

  // Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    if (!product.inStock) {
      addToast(`Sorry, ${product.name} is temporarily out of stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        addToast(`Updated quantity of ${product.name} in your cart.`, 'success');
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      addToast(`Added ${product.name} to your cart.`, 'success');
      return [...prevCart, { product, quantity }];
    });

    if (profile) {
      cartService.addToCart(profile.id, product.id, quantity).catch(err => {
        console.error('Error adding to database cart:', err);
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId);
      if (item) {
        addToast(`Removed ${item.product.name} from cart.`, 'info');
      }
      return prevCart.filter((i) => i.product.id !== productId);
    });

    if (profile) {
      cartService.removeFromCart(profile.id, productId).catch(err => {
        console.error('Error removing from database cart:', err);
      });
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    if (profile) {
      cartService.updateQuantity(profile.id, productId, quantity).catch(err => {
        console.error('Error updating database cart:', err);
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    addToast('Your shopping cart has been cleared.', 'info');

    if (profile) {
      cartService.clearCart(profile.id).catch(err => {
        console.error('Error clearing database cart:', err);
      });
    }
  };

  // Wishlist Operations
  const toggleWishlist = async (product: Product) => {
    if (profile) {
      try {
        const updated = await wishlistService.toggleWishlist(profile.id, product);
        setWishlist(updated);
        const exists = updated.some(p => p.id === product.id);
        addToast(
          exists ? `Added ${product.name} to your wishlist.` : `Removed ${product.name} from your wishlist.`,
          exists ? 'success' : 'info'
        );
      } catch (err) {
        addToast('Wishlist syncing failed. Please try again.', 'error');
      }
    } else {
      addToast('Please login to add items to your wishlist.', 'error');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  // Orders Actions
  const placeOrder = async (
    addressData: Omit<Address, 'id' | 'user_id'>, 
    paymentMethod: string,
    utr?: string,
    screenshotUrl?: string,
    razorpayDetails?: {
      orderId: string;
      paymentId: string;
      signature: string;
    }
  ): Promise<Order | null> => {
    if (!profile) {
      addToast('Please login or register to place your heirloom order.', 'error');
      return null;
    }

    try {
      const savedAddress = await addressService.saveAddress(profile.id, addressData);
      const subtotal = getCartTotal();
      const shipping = subtotal > 1500 ? 0 : 99;
      const total = subtotal + shipping;
      
      const newOrder = await orderService.createOrder(
        profile.id,
        savedAddress,
        cart,
        subtotal,
        0, // discount default
        shipping,
        total,
        paymentMethod,
        utr,
        screenshotUrl,
        razorpayDetails
      );

      // Refresh orders list
      await refreshOrders();
      
      // Clear local cart
      setCart([]);
      if (profile) {
        await cartService.clearCart(profile.id).catch(err => {
          console.error('Error clearing DB cart on checkout:', err);
        });
      }
      addToast(`Order ${newOrder.order_number} successfully registered! Check History.`, 'success');
      return newOrder;
    } catch (err: any) {
      addToast(err.message || 'Error processing order.', 'error');
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: any): Promise<boolean> => {
    const success = await orderService.updateOrderStatus(orderId, status);
    if (success) {
      await refreshOrders();
      addToast(`Order status updated to ${status}.`, 'success');
    }
    return success;
  };

  const updatePaymentStatus = async (orderId: string, status: any): Promise<boolean> => {
    const success = await orderService.updatePaymentStatus(orderId, status);
    if (success) {
      await refreshOrders();
      addToast(`Payment status updated to ${status}.`, 'success');
    }
    return success;
  };

  const refreshOrders = async () => {
    if (profile) {
      const ords = profile.role === 'admin' 
        ? await orderService.getAllOrders() 
        : await orderService.getOrders(profile.id);
      setOrders(ords);
    }
  };

  // Custom Admin Catalogue functions
  const addAdminProduct = async (prod: Partial<Product>): Promise<boolean> => {
    const res = await productService.createProduct(prod);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    // Refresh Catalogue
    const updated = await productService.getProducts();
    setProducts(updated);
    addToast('Heirloom product successfully added to live catalog!', 'success');
    return true;
  };

  const editAdminProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    const res = await productService.updateProduct(id, updates);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    // Refresh Catalogue
    const updated = await productService.getProducts();
    setProducts(updated);
    addToast('Heirloom product details updated.', 'success');
    return true;
  };

  const deleteAdminProduct = async (id: string): Promise<boolean> => {
    const res = await productService.deleteProduct(id);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    // Refresh Catalogue
    const updated = await productService.getProducts();
    setProducts(updated);
    addToast('Product successfully removed from catalog.', 'info');
    return true;
  };

  const addAdminCategory = async (cat: Partial<Category>): Promise<boolean> => {
    const res = await categoryService.createCategory(cat);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    // Refresh Categories
    const updated = await categoryService.getCategories();
    setCategories(updated);
    return true;
  };

  const editAdminCategory = async (id: string, updates: Partial<Category>): Promise<boolean> => {
    const res = await categoryService.updateCategory(id, updates);
    if (res.error) {
      addToast(res.error, 'error');
      return false;
    }
    // Refresh Categories
    const updated = await categoryService.getCategories();
    setCategories(updated);
    return true;
  };

  return (
    <ShopContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        register,
        login,
        logout,
        updateProfile,
        changeRole,
        
        products,
        categories,
        orders,
        
        cart,
        wishlist,
        toasts,
        isCartOpen,
        isWishlistOpen,
        searchQuery,
        selectedCategory,
        sortBy,
        
        setIsCartOpen,
        setIsWishlistOpen,
        setSearchQuery,
        setSelectedCategory,
        setSortBy,
        
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        
        addToast,
        removeToast,
        getCartTotal,
        getCartItemsCount,
        
        placeOrder,
        updateOrderStatus,
        updatePaymentStatus,
        refreshOrders,
        
        addAdminProduct,
        editAdminProduct,
        deleteAdminProduct,
        addAdminCategory,
        editAdminCategory,
        isSupabaseConfigured
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
