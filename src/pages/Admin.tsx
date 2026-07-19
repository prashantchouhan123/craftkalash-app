import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Edit, 
  ShoppingBag, 
  Layers, 
  IndianRupee, 
  Wrench, 
  Info, 
  X, 
  Eye, 
  TrendingUp,
  Tag,
  CheckCircle,
  Truck,
  ArrowRight,
  Sparkles,
  Users,
  Ticket,
  Image as ImageIcon,
  Sliders,
  AlertTriangle,
  Search,
  Filter,
  Check,
  Star,
  RefreshCw,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addressService, couponsService } from '../services/supabaseService';
import { Product, Category, Order, Coupon, Review, Profile } from '../types';
import ImageUpload from '../components/ImageUpload';

export default function Admin() {
  const { 
    products, 
    categories,
    orders, 
    addAdminProduct, 
    editAdminProduct, 
    deleteAdminProduct, 
    addAdminCategory,
    editAdminCategory,
    updateOrderStatus, 
    updatePaymentStatus,
    changeRole,
    profile,
    addToast,
    refreshOrders
  } = useShop();

  const navigate = useNavigate();

  // Selected sidebar tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'coupons' | 'banners' | 'inventory' | 'settings' | 'reviews'>('dashboard');

  // Selected expanded order ID
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // New product / Edit product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Form states for Product CRUD
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('puzzles-blocks');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodStock, setProdStock] = useState('15');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodMaterials, setProdMaterials] = useState('Sustainable European Beechwood, Plant-based Stains');
  const [prodDimensions, setProdDimensions] = useState('15cm x 15cm x 10cm');
  const [prodAgeRange, setProdAgeRange] = useState('18 months +');
  const [prodSku, setProdSku] = useState('');
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodNew, setProdNew] = useState(true);

  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Category management state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImage, setCatImage] = useState('');

  // Coupon state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscType, setCouponDiscType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponDiscValue, setCouponDiscValue] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('2028-12-31');
  const [couponList, setCouponList] = useState<Coupon[]>([
    { id: 'c1', code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, active: true, expiry: '2028-12-31' },
    { id: 'c2', code: 'WOODLOVE20', discount_type: 'fixed', discount_value: 20, active: true, expiry: '2028-12-31' },
    { id: 'c3', code: 'ARTISAN15', discount_type: 'percentage', discount_value: 15, active: true, expiry: '2028-12-31' }
  ]);

  // Client list state
  const [customerList, setCustomerList] = useState<any[]>([
    { id: 'cust1', name: 'Devendra Vyas', email: 'devendra@example.com', phone: '+91 98290 12345', orders: 4, ltv: 248.00, status: 'Active', joined: '2026-01-10' },
    { id: 'cust2', name: 'Suhail Khan', email: 'suhail@example.com', phone: '+91 99281 99999', orders: 2, ltv: 115.00, status: 'Active', joined: '2026-03-14' },
    { id: 'cust3', name: 'Aditi Sharma', email: 'aditi@example.com', phone: '+91 77370 11111', orders: 7, ltv: 412.50, status: 'Active', joined: '2026-04-20' },
    { id: 'cust4', name: 'Ritesh Gehlot', email: 'ritesh@example.com', phone: '+91 94141 55555', orders: 0, ltv: 0.00, status: 'Suspended', joined: '2026-06-02' }
  ]);

  // Settings states
  const [storeName, setStoreName] = useState('CraftKalash Handcrafted Heirlooms');
  const [supportEmail, setSupportEmail] = useState('workshop@craftkalash.com');
  const [supportPhone, setSupportPhone] = useState('+91 291 243 0000');
  const [taxRate, setTaxRate] = useState('0');
  const [freeShippingLimit, setFreeShippingLimit] = useState('1500');
  const [enableCod, setEnableCod] = useState(true);

  // Banners
  const [banners, setBanners] = useState([
    { id: 'b1', name: 'Homepage Spring Workshop Hero', type: 'Hero', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=1200' },
    { id: 'b2', name: 'Infant Beechwood Range Offer banner', type: 'Category', url: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=800' }
  ]);

  // Review state
  const [reviewsList, setReviewsList] = useState<Review[]>([
    { id: 'r1', userName: 'Anjali Verma', rating: 5, date: 'July 10, 2026', comment: 'The walnut friction coatings are incredibly clean and toddler-safe. Amazing wood smell!', verified: true },
    { id: 'r2', userName: 'Rahul Mathur', rating: 4, date: 'July 14, 2026', comment: 'Very sturdy, but the nesting arcs are slightly heavy. Generations of play indeed.', verified: true },
    { id: 'r3', userName: 'Heena Solanki', rating: 5, date: 'July 15, 2026', comment: 'Amazing customer experience. Ordered vehicles for imaginary play. Pure FSC beech wood.', verified: true }
  ]);

  // Dynamic products and categories list
  const [adminCategories, setAdminCategories] = useState<Category[]>(() => {
    return categories && categories.length > 0 ? categories : [
      { id: 'infant-toddler', name: 'Infant & Toddler', description: 'Gentle materials, soothing sounds, and safe edges.', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=300' },
      { id: 'imaginary-play', name: 'Imaginary Play', description: 'Open-ended worlds, wooden kitchens, and story pieces.', image: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=300' },
      { id: 'puzzles-blocks', name: 'Puzzles & Blocks', description: 'Geometric stackers, nesting trees, and spatial blocks.', image: 'https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=300' },
      { id: 'vehicles-motion', name: 'Vehicles & Motion', description: 'Smooth-rolling locomotives and race cars.', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=300' }
    ];
  });

  useEffect(() => {
    if (categories && categories.length > 0) {
      setAdminCategories(categories);
    }
  }, [categories]);

  // Verify Admin privileges on render
  useEffect(() => {
    if (!profile) {
      navigate('/auth');
    } else if (profile.role !== 'admin') {
      navigate('/account');
    } else {
      refreshOrders();
      couponsService.getCoupons().then(list => {
        if (list && list.length > 0) {
          setCouponList(list);
        }
      });
    }
  }, [profile?.id, profile?.role]);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg/20 text-xs">
        <div className="text-center space-y-3 p-6 bg-white border border-brand-border rounded-2xl max-w-sm">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold">PostgreSQL Access Unauthorized</h3>
          <p className="text-brand-text-secondary">Please configure your profile as an Administrator to execute database operations.</p>
        </div>
      </div>
    );
  }

  // CALCULATIONS
  const totalSales = orders
    .filter(o => o.payment_status === 'paid' || o.order_status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;

  const lowStockItems = products.filter(p => (p as any).stock !== undefined && (p as any).stock < 5);
  const outOfStockItems = products.filter(p => !(p as any).inStock || ((p as any).stock !== undefined && (p as any).stock === 0));

  // PRODUCT CRUD HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProdId(null);
    setProdName('');
    setProdCategory('puzzles-blocks');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdStock('15');
    setProdImage('');
    setProdDesc('');
    setProdMaterials('Sustainable European Beechwood, Plant-based Stains');
    setProdDimensions('15cm x 15cm x 10cm');
    setProdAgeRange('18 months +');
    setProdSku(`CK-${Math.floor(100000 + Math.random() * 900000)}`);
    setProdFeatured(false);
    setProdBestSeller(false);
    setProdNew(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProdId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price.toString());
    setProdOriginalPrice(p.originalPrice?.toString() || '');
    setProdStock(p.stock?.toString() || '15');
    setProdImage(p.image);
    setProdDesc(p.description);
    setProdMaterials(p.materials?.join(', ') || 'Sustainable European Beechwood, Plant-based Stains');
    setProdDimensions(p.dimensions || '15cm x 15cm x 10cm');
    setProdAgeRange(p.ageRange || '18 months +');
    setProdSku(p.sku || `CK-${Math.floor(100000 + Math.random() * 900000)}`);
    setProdFeatured(p.featured || false);
    setProdBestSeller(p.bestSeller || false);
    setProdNew(p.isNew || false);
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMaterials = prodMaterials.split(',').map(m => m.trim()).filter(Boolean);
    const parsedPrice = parseFloat(prodPrice) || 0;
    const parsedOriginalPrice = parseFloat(prodOriginalPrice) || undefined;
    const parsedStock = parseInt(prodStock) || 0;

    const prodPayload = {
      name: prodName,
      category: prodCategory,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stock: parsedStock,
      image: prodImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
      description: prodDesc,
      materials: cleanMaterials,
      dimensions: prodDimensions,
      ageRange: prodAgeRange,
      sku: prodSku,
      featured: prodFeatured,
      bestSeller: prodBestSeller,
      isNew: prodNew,
      inStock: parsedStock > 0
    };

    if (editingProdId) {
      await editAdminProduct(editingProdId, prodPayload);
    } else {
      await addAdminProduct(prodPayload);
    }
    setIsProductModalOpen(false);
  };

  // CATEGORY HANDLERS
  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDescription('');
    setCatImage('');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = catName.toLowerCase().replace(/\s+/g, '-');
    const newCat: Partial<Category> = {
      name: catName,
      description: catDescription,
      image: catImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=300',
      slug: newId
    };

    if (editingCatId) {
      const success = await editAdminCategory(editingCatId, newCat);
      if (success) {
        addToast('Heirloom category updated successfully.', 'success');
      }
    } else {
      const success = await addAdminCategory({ ...newCat, id: newId });
      if (success) {
        addToast('Heirloom category successfully added!', 'success');
      }
    }
    setIsCategoryModalOpen(false);
  };

  // COUPON HANDLERS
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCouponData = {
      code: couponCode.trim().toUpperCase(),
      discount_type: couponDiscType,
      discount_value: parseFloat(couponDiscValue) || 0,
      active: true,
      expiry: couponExpiry
    };

    const saved = await couponsService.createCoupon(newCouponData);
    if (saved) {
      setCouponList([saved, ...couponList]);
      addToast(`Coupon code "${saved.code}" generated successfully!`, 'success');
    } else {
      addToast('Failed to create coupon code.', 'error');
    }
    setIsCouponModalOpen(false);
    setCouponCode('');
    setCouponDiscValue('');
  };

  // QUICK STOCK UPDATERS
  const updateStockQuickly = (id: string, newStock: number) => {
    const matched = products.find(p => p.id === id);
    if (matched) {
      editAdminProduct(id, {
        ...matched,
        stock: newStock,
        inStock: newStock > 0
      });
    }
  };

  // FILTERS FOR PRODUCTS
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-24 text-brand-text-primary text-xs">
      
      {/* TITLE RAIL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-border/40 pb-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-brand-secondary font-black uppercase tracking-wider">
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Workshop Control Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
            Artisan Administration
          </h1>
          <p className="text-brand-text-secondary font-light">
            Sift through PostgreSQL tables, moderate custom coupon rules, balance inventory volumes, and execute order dispatch updates.
          </p>
        </div>

        <button
          onClick={() => {
            navigate('/account');
          }}
          className="px-4 py-2.5 border border-brand-border bg-brand-bg hover:bg-brand-bg/80 text-brand-text-primary font-bold rounded-xl shadow-2xs cursor-pointer"
        >
          ← Exit Admin Dashboard
        </button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT BAR: SIDEBAR NAVIGATION RAIL */}
        <div className="lg:col-span-3 bg-white border border-brand-border/60 p-4 rounded-3xl shadow-xs space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard Control', icon: Sliders },
            { id: 'products', label: 'PostgreSQL Catalog', icon: Layers },
            { id: 'categories', label: 'Toy Categories', icon: Layers },
            { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            { id: 'customers', label: 'Customers Registry', icon: Users },
            { id: 'coupons', label: 'Coupons & Promos', icon: Ticket },
            { id: 'banners', label: 'Banners Curation', icon: ImageIcon },
            { id: 'inventory', label: 'Inventory Stock', icon: RefreshCw },
            { id: 'reviews', label: 'Review Moderation', icon: Star },
            { id: 'settings', label: 'Workshop Settings', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary' 
                    : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className="text-[10px] uppercase tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT BAR: CORRESPONDING TAB PANELS */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: CONTROL DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'Total Revenue', val: `₹${totalSales.toFixed(2)}`, desc: 'Settled transactions', icon: IndianRupee, color: 'text-brand-primary bg-brand-primary/5 border-brand-primary/10' },
                  { title: 'Workshop Orders', val: totalOrdersCount, desc: 'Across lifecycle', icon: ShoppingBag, color: 'text-brand-secondary bg-brand-secondary/5 border-brand-secondary/10' },
                  { title: 'Catalog Items', val: totalProductsCount, desc: 'Wooden masterpieces', icon: Layers, color: 'text-brand-accent bg-brand-accent/5 border-brand-accent/10' },
                  { title: 'Customer Base', val: customerList.length, desc: 'Registered families', icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={`border p-4.5 rounded-2xl space-y-1 ${stat.color}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-85">{stat.title}</span>
                        <Icon className="w-4 h-4 opacity-75" />
                      </div>
                      <strong className="block text-xl font-heading font-black">{stat.val}</strong>
                      <span className="block text-[9px] opacity-75 font-light">{stat.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Hand-crafted custom trend line chart using SVG for bulletproof portability */}
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-2xs space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-heading font-black">Sales & Volume Trend Analytics</h3>
                  <p className="text-[10px] text-brand-text-secondary">Simulated weekly database metrics curve.</p>
                </div>

                <div className="w-full h-44 bg-brand-bg/20 rounded-xl p-2 border border-brand-border/40 flex items-center justify-center relative">
                  {/* Custom aesthetic line/area vector plot */}
                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6F4E37" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6F4E37" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3 3" />

                    {/* Gradient area */}
                    <path
                      d="M 0 110 L 50 85 L 120 95 L 200 65 L 280 40 L 360 70 L 440 30 L 500 20 L 500 120 L 0 120 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Actual trend path line */}
                    <path
                      d="M 0 110 L 50 85 L 120 95 L 200 65 L 280 40 L 360 70 L 440 30 L 500 20"
                      fill="none"
                      stroke="#6F4E37"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Nodes and hovering ticks */}
                    <circle cx="280" cy="40" r="4.5" fill="#6F4E37" stroke="#FAF8F5" strokeWidth="1.5" />
                    <circle cx="440" cy="30" r="4.5" fill="#A16207" stroke="#FAF8F5" strokeWidth="1.5" />
                    <circle cx="500" cy="20" r="4.5" fill="#6F4E37" stroke="#FAF8F5" strokeWidth="1.5" />
                  </svg>
                  <span className="absolute bottom-2 left-3 font-mono text-[9px] text-gray-400">Week 1</span>
                  <span className="absolute bottom-2 right-3 font-mono text-[9px] text-gray-400">Week 8 (Current)</span>
                </div>
              </div>

              {/* Bento Grid layout for Low Stock, Top Selling Products, & Recent Reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Low Stock alerting */}
                <div className="bg-white border border-brand-border/60 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="font-heading font-black text-xs flex items-center gap-1.5 text-brand-error">
                    <AlertTriangle className="w-4 h-4 text-brand-error animate-pulse" />
                    Critical Low Stock Warning
                  </h4>

                  <div className="divide-y divide-brand-border/30 max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {lowStockItems.length === 0 ? (
                      <p className="text-gray-400 text-center py-6 leading-relaxed">No timber block shortages reported today.</p>
                    ) : (
                      lowStockItems.map((prod) => (
                        <div key={prod.id} className="flex justify-between items-center text-[11px] py-1.5 first:pt-0">
                          <span className="font-bold truncate max-w-[180px] text-brand-text-primary">{prod.name}</span>
                          <span className="bg-rose-50 text-brand-error font-black px-2 py-0.5 rounded-full border border-rose-100">
                            {(prod as any).stock} left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white border border-brand-border/60 p-5 rounded-2xl shadow-xs space-y-4">
                  <h4 className="font-heading font-black text-xs flex items-center gap-1.5 text-brand-secondary">
                    <TrendingUp className="w-4 h-4 text-brand-secondary" />
                    Artisan Favorites (Top Sellers)
                  </h4>

                  <div className="divide-y divide-brand-border/30 space-y-2">
                    {products.slice(0, 3).map((prod) => (
                      <div key={prod.id} className="flex gap-3 items-center text-[11px] py-1.5 first:pt-0">
                        <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="flex-1 truncate">
                          <span className="font-bold text-brand-text-primary block truncate">{prod.name}</span>
                          <span className="text-[10px] text-brand-secondary font-bold uppercase">{prod.category}</span>
                        </div>
                        <span className="font-extrabold text-brand-primary font-mono">₹{prod.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: POSTGRES CATALOG (PRODUCTS) */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-base font-extrabold text-brand-text-primary flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-brand-primary" />
                  Heirloom Product Catalog Registry
                </h3>
                <button
                  onClick={handleOpenAddProduct}
                  className="bg-brand-primary text-white font-bold py-2 px-4 rounded-xl text-xs hover:bg-brand-primary/95 flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Insert New Design
                </button>
              </div>

              {/* Searching panel */}
              <div className="flex bg-white border border-brand-border/60 p-3 rounded-2xl gap-2 items-center text-xs">
                <Search className="w-4.5 h-4.5 text-gray-400 ml-1 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Catalog by Name, SKU code or Category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-transparent focus:outline-none font-bold text-brand-text-primary"
                />
              </div>

              {/* Core Postgres Product table */}
              <div className="bg-white border border-brand-border/60 rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] text-brand-text-primary">
                  <thead>
                    <tr className="bg-brand-bg/40 border-b border-brand-border/60 font-extrabold uppercase text-[9px] text-brand-text-secondary tracking-wider">
                      <th className="py-4 px-6">Product details</th>
                      <th className="py-4 px-6">SKU Code</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Unit Price</th>
                      <th className="py-4 px-6">Postgres Stock</th>
                      <th className="py-4 px-6 text-right">Database Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-brand-bg/10 transition-colors">
                        <td className="py-3 px-6 flex items-center gap-3 font-bold">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-brand-border/40 shrink-0"
                          />
                          <div className="truncate max-w-[150px]">
                            <span className="block truncate text-brand-text-primary font-bold">{p.name}</span>
                            <span className="block text-[9px] text-gray-400 font-light truncate">ID: {p.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 font-mono text-gray-400">{p.sku || 'CK-554101'}</td>
                        <td className="py-3 px-6 font-semibold capitalize text-brand-text-secondary">{p.category.replace('-', ' ')}</td>
                        <td className="py-3 px-6 font-extrabold text-brand-primary text-xs">
                          ₹{p.price.toFixed(2)}
                          {p.originalPrice && <span className="block text-[9px] line-through text-gray-400 font-light font-sans">₹{p.originalPrice}</span>}
                        </td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${p.inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {p.inStock ? `In Stock (${(p as any).stock || 12})` : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 border border-brand-border rounded-lg hover:bg-brand-bg text-brand-primary inline-flex cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAdminProduct(p.id)}
                            className="p-1.5 border border-rose-100 rounded-lg hover:bg-rose-50 text-brand-error inline-flex cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: TOY CATEGORIES */}
          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wider">Store Category curation</h3>
                <button
                  onClick={handleOpenAddCategory}
                  className="bg-brand-primary text-white font-bold px-3 py-2 rounded-xl text-[10px] hover:bg-brand-primary/95 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register New Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminCategories.map((cat) => (
                  <div key={cat.id} className="border border-brand-border bg-white rounded-2xl overflow-hidden flex hover:border-brand-primary/40 transition-colors">
                    <img src={cat.image} alt={cat.name} className="w-20 h-full object-cover shrink-0 border-r border-brand-border" />
                    <div className="p-4 flex-grow min-w-0 flex flex-col justify-between">
                      <div className="space-y-1">
                        <strong className="block text-brand-text-primary text-xs font-heading font-black truncate">{cat.name}</strong>
                        <span className="block text-[9px] text-gray-400 font-mono tracking-wider">SLUG: {cat.id}</span>
                        <p className="text-[10px] text-brand-text-secondary leading-relaxed font-light line-clamp-2">{cat.description}</p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setCatName(cat.name);
                            setCatDescription(cat.description);
                            setCatImage(cat.image);
                            setIsCategoryModalOpen(true);
                          }}
                          className="text-[10px] text-brand-primary font-bold flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Edit className="w-3 h-3" /> Edit Credentials
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ORDERS CONTROL PIPELINE */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-brand-text-primary flex items-center gap-1.5">
                  <ShoppingBag className="w-4.5 h-4.5 text-brand-primary" />
                  Real-time Fulfillments Pipeline (Orders)
                </h3>
                <p className="text-[10px] text-brand-text-secondary font-light">Mutate the order tracking status to push changes onto the client order timeline.</p>
              </div>

              <div className="flex bg-white border border-brand-border p-3 rounded-2xl gap-2 items-center text-xs">
                <Search className="w-4.5 h-4.5 text-gray-400 ml-1 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter transactions by Order Code or Client destination..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-transparent focus:outline-none font-bold text-brand-text-primary"
                />
              </div>

              <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] text-brand-text-primary">
                  <thead>
                    <tr className="bg-brand-bg/40 border-b border-brand-border/60 font-extrabold uppercase text-[9px] text-brand-text-secondary tracking-wider">
                      <th className="py-4 px-6 w-12"></th>
                      <th className="py-4 px-6">Order Code</th>
                      <th className="py-4 px-6">Recipient Customer</th>
                      <th className="py-4 px-6">Total Sum</th>
                      <th className="py-4 px-6">Payment Status</th>
                      <th className="py-4 px-6">Workshop Timeline Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {orders
                      .filter(o => {
                        const s = orderSearch.toLowerCase();
                        const numMatch = o.order_number.toLowerCase().includes(s);
                        const shippingNameMatch = o.shippingAddress?.full_name?.toLowerCase()?.includes(s) || false;
                        const profileNameMatch = o.customer_profile?.full_name?.toLowerCase()?.includes(s) || false;
                        return numMatch || shippingNameMatch || profileNameMatch;
                      })
                      .map((o) => {
                        const isExpanded = expandedOrderId === o.id;
                        
                        // Parse display status
                        let statusText: string = o.payment_status;
                        let statusColor = 'bg-amber-50 text-amber-700 border-amber-100';
                        if (o.payment_status === 'paid') {
                          statusText = 'Paid';
                          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        } else if (o.payment_method === 'COD') {
                          statusText = 'Pending COD';
                          statusColor = 'bg-blue-50 text-blue-700 border-blue-100';
                        } else if (o.payment_method === 'UPI') {
                          statusText = 'Payment Verification Pending';
                          statusColor = 'bg-amber-50 text-amber-700 border-amber-100';
                        }

                        return (
                          <React.Fragment key={o.id}>
                            <tr className="hover:bg-brand-bg/10 transition-colors">
                              <td className="py-4 px-6">
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                  className="p-1 rounded-lg hover:bg-brand-bg text-brand-text-secondary hover:text-brand-primary transition-all cursor-pointer font-bold"
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-brand-primary font-mono select-all">
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                  className="hover:underline text-left cursor-pointer font-bold"
                                >
                                  {o.order_number}
                                </button>
                              </td>
                              <td className="py-4 px-6">
                                <strong className="block text-brand-text-primary font-bold">
                                  {o.shippingAddress?.full_name || o.customer_profile?.full_name || 'Customer'}
                                </strong>
                                <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                                  {o.shippingAddress 
                                    ? `${o.shippingAddress.city}, ${o.shippingAddress.state}` 
                                    : o.customer_profile?.email || 'No destination detail'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-black text-brand-primary">₹{o.total}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] border ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <select
                                  value={o.order_status}
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                                  className="bg-brand-bg/60 border border-brand-border/60 rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary text-xs cursor-pointer"
                                >
                                  <option value="pending">Pending Polish</option>
                                  <option value="processing">In Workshop</option>
                                  <option value="shipped">Dispatched</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>

                            {/* Expanded row with full verification details */}
                            {isExpanded && (
                              <tr className="bg-brand-bg/5">
                                <td colSpan={6} className="py-5 px-8">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                    {/* Order items and shipping address details */}
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Delivery Address Details</h4>
                                        <div className="p-3 bg-white border border-brand-border/50 rounded-xl space-y-1 text-brand-text-primary">
                                          {o.shippingAddress ? (
                                            <>
                                              <div><strong>Contact:</strong> {o.shippingAddress.full_name} ({o.shippingAddress.phone || 'No Phone'})</div>
                                              <div><strong>Address:</strong> {o.shippingAddress.address}</div>
                                              <div><strong>Location:</strong> {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode}</div>
                                              <div><strong>Country:</strong> {o.shippingAddress.country || 'India'}</div>
                                            </>
                                          ) : (
                                            <>
                                              <div><strong>Contact:</strong> {o.customer_profile?.full_name || 'Registered Customer'} ({o.customer_profile?.phone || 'No Phone'})</div>
                                              <div><strong>Email:</strong> {o.customer_profile?.email || 'No email registered'}</div>
                                              <div className="text-amber-600 font-semibold italic text-[10px] pt-1">No separate shipping address registered or RLS restricted.</div>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Ordered Creations</h4>
                                        <div className="p-3 bg-white border border-brand-border/50 rounded-xl divide-y divide-brand-border/20">
                                          {o.items?.map((item, idx) => (
                                            <div key={idx} className="py-1.5 flex justify-between text-brand-text-primary first:pt-0 last:pb-0">
                                              <span>{item.quantity}x <strong className="font-medium">{item.productName || `Product ID: ${item.product_id}`}</strong></span>
                                              <span className="font-mono font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                          ))}
                                          <div className="pt-2 flex justify-between font-black text-brand-primary border-t border-brand-border/40">
                                            <span>Grand Total:</span>
                                            <span>₹{o.total}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Payment actions, UTR and screenshot */}
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Payment Verification & Audit</h4>
                                        <div className="p-4 bg-white border border-brand-border/50 rounded-xl space-y-4">
                                          <div className="grid grid-cols-2 gap-4 text-[11px]">
                                            <div>
                                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Payment Method</span>
                                              <strong className="text-brand-text-primary text-sm font-black">{o.payment_method === 'UPI' ? 'UPI QR Code' : 'Cash on Delivery (COD)'}</strong>
                                            </div>
                                            <div>
                                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Audit Status</span>
                                              <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold border ${statusColor}`}>
                                                {statusText}
                                              </span>
                                            </div>
                                          </div>

                                          {o.payment_method === 'UPI' && (
                                            <div className="space-y-2 border-t border-brand-border/30 pt-3">
                                              <div>
                                                <span className="text-gray-400 block text-[9px] uppercase font-bold">UPI Transaction ID / UTR</span>
                                                <span className="text-sm font-mono font-extrabold text-brand-primary select-all tracking-wider">{o.utr || 'N/A'}</span>
                                              </div>

                                              {o.screenshot_url ? (
                                                <div className="space-y-1.5">
                                                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Customer Uploaded Proof</span>
                                                  <a
                                                    href={o.screenshot_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block relative group overflow-hidden border border-brand-border/50 rounded-xl hover:shadow-md transition-shadow"
                                                  >
                                                    <img
                                                      src={o.screenshot_url}
                                                      alt="Payment Proof screenshot"
                                                      referrerPolicy="no-referrer"
                                                      className="w-48 h-32 object-cover rounded-xl"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px]">
                                                      View Full Screen
                                                    </div>
                                                  </a>
                                                </div>
                                              ) : (
                                                <div className="text-[10px] text-amber-600 bg-amber-50/50 border border-amber-100/60 p-2 rounded-xl">
                                                  No payment confirmation screenshot was uploaded by the customer.
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {o.payment_status !== 'paid' ? (
                                            <div className="border-t border-brand-border/30 pt-3 flex flex-col sm:flex-row gap-2.5">
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  try {
                                                    await updatePaymentStatus(o.id, 'paid');
                                                    addToast('Payment verified successfully!', 'success');
                                                  } catch (err: any) {
                                                    addToast(`Error: ${err.message}`, 'error');
                                                  }
                                                }}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-center shadow-xs transition-colors cursor-pointer text-[11px]"
                                              >
                                                {o.payment_method === 'UPI' ? '✓ Verify & Mark as Paid' : '✓ Received Cash (Mark as Paid)'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setExpandedOrderId(null)}
                                                className="border border-brand-border hover:bg-brand-bg text-brand-text-primary font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer text-[11px]"
                                              >
                                                Close Details
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="border-t border-brand-border/30 pt-3 flex items-center gap-2 text-emerald-600 font-bold text-[11px]">
                                              <span>✓ This transaction has been successfully audited and paid.</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: CUSTOMER DATABASE REGISTRY */}
          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wider">Customer registry Database</h3>
                <p className="text-[10px] text-brand-text-secondary font-light">Verify client details and suspend/activate accounts.</p>
              </div>

              <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] text-brand-text-primary">
                  <thead>
                    <tr className="bg-brand-bg/40 border-b border-brand-border/60 font-extrabold uppercase text-[9px] text-brand-text-secondary tracking-wider">
                      <th className="py-4 px-6">Customer identity</th>
                      <th className="py-4 px-6">Contact details</th>
                      <th className="py-4 px-6">Total Sourced</th>
                      <th className="py-4 px-6">Estimated LTV</th>
                      <th className="py-4 px-6 text-right">Account status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {customerList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-brand-bg/10 transition-colors">
                        <td className="py-4 px-6 font-bold flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-brand-text-primary font-bold">{cust.name}</span>
                            <span className="block text-[9px] text-gray-400 font-mono">ID: {cust.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-brand-text-secondary">
                          <span className="block">{cust.email}</span>
                          <span>{cust.phone}</span>
                        </td>
                        <td className="py-4 px-6 font-bold">{cust.orders} orders</td>
                        <td className="py-4 px-6 font-extrabold text-brand-primary">₹{cust.ltv.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => {
                              const updatedStatus = cust.status === 'Active' ? 'Suspended' : 'Active';
                              setCustomerList(customerList.map(c => c.id === cust.id ? { ...c, status: updatedStatus } : c));
                            }}
                            className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase cursor-pointer ${cust.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}
                          >
                            {cust.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 6: COUPONS & DISCOUNT MANAGEMENT */}
          {activeTab === 'coupons' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wider">Coupons Registry</h3>
                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="bg-brand-primary text-white font-bold px-3.5 py-2 rounded-xl text-[10px] hover:bg-brand-primary/95 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Coupon trigger
                </button>
              </div>

              <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] text-brand-text-primary">
                  <thead>
                    <tr className="bg-brand-bg/40 border-b border-brand-border/60 font-extrabold uppercase text-[9px] text-brand-text-secondary tracking-wider">
                      <th className="py-4 px-6">Coupon Code</th>
                      <th className="py-4 px-6">Discount Value</th>
                      <th className="py-4 px-6">Expiration Date</th>
                      <th className="py-4 px-6 text-right">Database status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {couponList.map((c) => (
                      <tr key={c.id} className="hover:bg-brand-bg/10 transition-colors">
                        <td className="py-4 px-6 font-extrabold font-mono text-brand-primary">{c.code}</td>
                        <td className="py-4 px-6 font-bold">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-400 font-mono">{c.expiry}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={async () => {
                              const success = await couponsService.toggleCouponActive(c.id);
                              if (success) {
                                setCouponList(couponList.map(item => item.id === c.id ? { ...item, active: !item.active } : item));
                                addToast(`Coupon "${c.code}" status toggled.`, 'info');
                              } else {
                                addToast('Failed to toggle coupon status.', 'error');
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase cursor-pointer ${c.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                          >
                            {c.active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 7: BANNERS CURATION */}
          {activeTab === 'banners' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-brand-border/40 pb-3">
                <h3 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wider">Banner management</h3>
                <p className="text-[10px] text-brand-text-secondary font-light font-sans">Curate homepage spring sliders or categories hero panels.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="border border-brand-border bg-white rounded-2xl overflow-hidden shadow-2xs space-y-3">
                    <img src={b.url} alt={b.name} className="w-full h-32 object-cover border-b border-brand-border" />
                    <div className="p-4 space-y-3">
                      <div className="space-y-0.5">
                        <strong className="block text-brand-text-primary text-xs truncate font-bold">{b.name}</strong>
                        <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black px-2 py-0.5 rounded-full border border-brand-primary/25 inline-block uppercase font-mono">{b.type} banner</span>
                      </div>
                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button
                          onClick={() => {
                            const newUrl = window.prompt('Enter new Unsplash Image URL:', b.url);
                            if (newUrl) {
                              setBanners(banners.map(item => item.id === b.id ? { ...item, url: newUrl } : item));
                            }
                          }}
                          className="text-brand-primary hover:underline cursor-pointer"
                        >
                          Replace URL
                        </button>
                        <button
                          onClick={() => setBanners(banners.filter(item => item.id !== b.id))}
                          className="text-brand-error hover:underline cursor-pointer ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 8: INVENTORY STOCK CONTROL */}
          {activeTab === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-brand-text-primary flex items-center gap-1.5">
                  <RefreshCw className="w-4.5 h-4.5 text-brand-primary" />
                  Catalog Inventory Stock Manager
                </h3>
                <p className="text-[10px] text-brand-text-secondary font-light">Rapidly override catalog stock values. Auto-updates status toggles.</p>
              </div>

              <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[11px] text-brand-text-primary">
                  <thead>
                    <tr className="bg-brand-bg/40 border-b border-brand-border/60 font-extrabold uppercase text-[9px] text-brand-text-secondary tracking-wider">
                      <th className="py-4 px-6">Product details</th>
                      <th className="py-4 px-6">SKU</th>
                      <th className="py-4 px-6">Available Stock</th>
                      <th className="py-4 px-6 text-right">Quick modifiers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {products.map((p) => {
                      const stockVal = (p as any).stock !== undefined ? (p as any).stock : 12;
                      return (
                        <tr key={p.id} className="hover:bg-brand-bg/10 transition-colors">
                          <td className="py-3 px-6 font-bold flex items-center gap-2.5">
                            <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="truncate max-w-[180px] text-brand-text-primary">{p.name}</span>
                          </td>
                          <td className="py-3 px-6 font-mono text-gray-400">{p.sku || 'CK-221001'}</td>
                          <td className="py-3 px-6">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[9px] border ${stockVal === 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : stockVal < 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {stockVal} units available
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right space-x-1 flex justify-end gap-1.5 items-center">
                            <button
                              onClick={() => updateStockQuickly(p.id, Math.max(0, stockVal - 1))}
                              className="p-1 border border-brand-border rounded-lg bg-white hover:bg-brand-bg inline-flex cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5 text-brand-primary" />
                            </button>
                            <span className="font-extrabold text-xs w-6 text-center">{stockVal}</span>
                            <button
                              onClick={() => updateStockQuickly(p.id, stockVal + 1)}
                              className="p-1 border border-brand-border rounded-lg bg-white hover:bg-brand-bg inline-flex cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-brand-primary" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 9: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wider">Review Moderation workspace</h3>
                <p className="text-[10px] text-brand-text-secondary font-light">Moderate client feedback or verify transaction credibility.</p>
              </div>

              <div className="space-y-3">
                {reviewsList.map((r) => (
                  <div key={r.id} className="border border-brand-border bg-white p-4.5 rounded-2xl flex flex-col justify-between hover:border-brand-primary/40 transition-colors">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <strong className="text-brand-text-primary text-xs font-bold">{r.userName}</strong>
                        <span className="text-[9px] text-gray-400 font-mono">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 text-brand-secondary">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-3.5 h-3.5 ${idx < r.rating ? 'fill-current' : 'opacity-25'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-brand-text-secondary leading-normal font-sans font-light">"{r.comment}"</p>
                    </div>

                    <div className="pt-3.5 border-t border-brand-border/30 mt-3 flex justify-between items-center text-[10px] font-bold">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified purchase
                      </span>
                      <button
                        onClick={() => setReviewsList(reviewsList.filter(item => item.id !== r.id))}
                        className="text-brand-error hover:underline cursor-pointer"
                      >
                        Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 10: WORKSHOP SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h3 className="text-base font-heading font-black">Workshop Configurations</h3>
                  <p className="text-xs text-brand-text-secondary font-light">Mutate general global constraints on checkout or tax rates.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-400 text-[9px] uppercase">Store Title</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-400 text-[9px] uppercase">Support Email</label>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-400 text-[9px] uppercase">Customer support Hotline</label>
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-400 text-[9px] uppercase">Free Shipping Threshold (₹)</label>
                      <input
                        type="number"
                        value={freeShippingLimit}
                        onChange={(e) => setFreeShippingLimit(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-brand-border/30">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-text-secondary">
                      <input
                        type="checkbox"
                        checked={enableCod}
                        onChange={(e) => setEnableCod(e.target.checked)}
                        className="rounded border-brand-border text-brand-primary"
                      />
                      Enable Cash on Delivery option at checkout
                    </label>
                  </div>

                  <div className="pt-4 border-t border-brand-border/40 flex justify-end">
                    <button
                      onClick={() => addToast('Store settings saved successfully!', 'success')}
                      className="bg-brand-primary text-white font-bold py-2.5 px-6 rounded-xl text-xs hover:bg-brand-primary/95 transition-all cursor-pointer"
                    >
                      Save Configurations
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* CREATE / EDIT PRODUCTS DIALOG MODAL */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-brand-border/60 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-accent" />
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-bg text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-sm font-heading font-black text-brand-text-primary uppercase flex items-center gap-1.5">
                  <Wrench className="w-4.5 h-4.5 text-brand-primary" />
                  {editingProdId ? 'Modify Postgres Item' : 'Insert Heirloom Design'}
                </h3>
                <p className="text-[10px] text-brand-text-secondary">Provide constraints matching Postgres schema rules.</p>
              </div>

              <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Waldorf Arch Stacker"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Category *</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary"
                    >
                      <option value="infant-toddler">Infant & Toddler</option>
                      <option value="imaginary-play">Imaginary Play</option>
                      <option value="puzzles-blocks">Puzzles & Blocks</option>
                      <option value="vehicles-motion">Vehicles & Motion</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Price (USD) *</label>
                    <input
                      type="number"
                      required
                      placeholder="48"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Original Price (Discount)</label>
                    <input
                      type="number"
                      placeholder="55"
                      value={prodOriginalPrice}
                      onChange={(e) => setProdOriginalPrice(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Postgres Stock *</label>
                    <input
                      type="number"
                      required
                      placeholder="15"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">SKU Code</label>
                    <input
                      type="text"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Age Range Target</label>
                    <input
                      type="text"
                      value={prodAgeRange}
                      onChange={(e) => setProdAgeRange(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold"
                    />
                  </div>
                </div>

                <ImageUpload value={prodImage} onChange={setProdImage} />

                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Materials (comma separated)</label>
                  <input
                    type="text"
                    value={prodMaterials}
                    onChange={(e) => setProdMaterials(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold text-brand-text-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">Product Story Description</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Tell the story of how our artisans hand-oil this particular timber shape..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none"
                  />
                </div>

                {/* Tags Switches */}
                <div className="flex flex-wrap gap-4 pt-1 font-bold text-brand-text-secondary">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={prodFeatured} onChange={(e) => setProdFeatured(e.target.checked)} className="rounded text-brand-primary" />
                    Featured
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={prodBestSeller} onChange={(e) => setProdBestSeller(e.target.checked)} className="rounded text-brand-primary" />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={prodNew} onChange={(e) => setProdNew(e.target.checked)} className="rounded text-brand-primary" />
                    New Arrival
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-primary/95 shadow-sm cursor-pointer transition-all"
                >
                  {editingProdId ? 'Mutate PostgreSQL Item' : 'Inject Item to Database'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-brand-border/60 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-bg text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-heading font-black text-brand-text-primary uppercase">
                {editingCatId ? 'Edit Toy Category' : 'Register New Toy Category'}
              </h3>

              <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Imaginary Play"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <ImageUpload value={catImage} onChange={setCatImage} label="Category Image" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase">Description</label>
                  <textarea
                    required
                    rows={2}
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-white py-2.5 rounded-xl font-bold hover:bg-brand-primary/95 shadow-sm cursor-pointer"
                >
                  Save Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW COUPON MODAL */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCouponModalOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-brand-border/60 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-brand-bg text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-heading font-black text-brand-text-primary uppercase">
                Create New Promo Coupon
              </h3>

              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase">Coupon Promo Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., SUMMER25"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase">Discount Type</label>
                    <select
                      value={couponDiscType}
                      onChange={(e) => setCouponDiscType(e.target.value as any)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold"
                    >
                      <option value="percentage">Percentage OFF (%)</option>
                      <option value="fixed">Fixed OFF (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[9px] text-gray-400 uppercase">Discount Value *</label>
                    <input
                      type="number"
                      required
                      placeholder="25"
                      value={couponDiscValue}
                      onChange={(e) => setCouponDiscValue(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[9px] text-gray-400 uppercase">Expiry Date</label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-white py-2.5 rounded-xl font-bold hover:bg-brand-primary/95 shadow-sm cursor-pointer"
                >
                  Inject Coupon Rule
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
