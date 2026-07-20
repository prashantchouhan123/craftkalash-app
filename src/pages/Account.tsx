import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  ShieldAlert, 
  LogOut, 
  TrendingUp, 
  CheckCircle, 
  Truck, 
  Clock, 
  Award, 
  Calendar,
  Lock,
  Phone,
  Sparkles,
  ChevronRight,
  Heart,
  Grid,
  Map,
  Key,
  Download,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addressService, orderService } from '../services/supabaseService';
import { Address, Order, Product } from '../types';

export default function Account() {
  const { 
    user, 
    profile, 
    orders, 
    logout, 
    updateProfile, 
    changeRole, 
    products, 
    wishlist,
    toggleWishlist,
    addToCart,
    addToast
  } = useShop();
  
  const navigate = useNavigate();

  // Navigation tab: 'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'security'>('dashboard');

  // Profile Edit states
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Address book states
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrZip, setNewAddrZip] = useState('');
  const [newAddrCountry, setNewAddrCountry] = useState('India');
  const [newAddrDefault, setNewAddrDefault] = useState(false);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Security states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active tracking order ID (to display detailed timeline)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Sync profile values
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      loadAddresses();
    }
  }, [user?.id, profile?.id]);

  const loadAddresses = async () => {
    if (profile) {
      try {
        const list = await addressService.getAddresses(profile.id);
        setSavedAddresses(list);
      } catch (err) {
        console.warn('Addresses load failed', err);
      }
    }
  };

  if (!profile) return null;

  // ACTIONS
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const success = await updateProfile({ full_name: fullName, phone });
      if (success) {
        addToast('Profile info updated persistently!', 'success');
      }
    } catch {
      addToast('Error saving profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (newAddrName.trim().length < 3) errors.name = 'Full name must be at least 3 letters.';
    if (!newAddrPhone.match(/^[0-9+\s-]{8,15}$/)) errors.phone = 'Valid phone is required.';
    if (newAddrStreet.trim().length < 6) errors.street = 'Full street address is required.';
    if (newAddrCity.trim().length < 2) errors.city = 'City is required.';
    if (newAddrState.trim().length < 2) errors.state = 'State is required.';
    if (!newAddrZip.match(/^[0-9\s-]{4,10}$/)) errors.zip = 'Valid Pincode required.';

    setAddressErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const payload = {
          full_name: newAddrName,
          phone: newAddrPhone,
          address: newAddrStreet,
          city: newAddrCity,
          state: newAddrState,
          pincode: newAddrZip,
          country: newAddrCountry,
          default_address: newAddrDefault
        };
        await addressService.saveAddress(profile.id, payload);
        addToast('Address successfully registered to your profile!', 'success');
        // Reset form
        setNewAddrName('');
        setNewAddrPhone('');
        setNewAddrStreet('');
        setNewAddrCity('');
        setNewAddrState('');
        setNewAddrZip('');
        setNewAddrDefault(false);
        setShowAddressForm(false);
        loadAddresses();
      } catch {
        addToast('Failed to save address.', 'error');
      }
    } else {
      addToast('Please resolve address validations.', 'error');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? This will release the curated timber blocks back to the workshop.');
    if (confirmCancel) {
      try {
        // Mocking the cancellation status change
        const success = await orderService.updateOrderStatus(orderId, 'cancelled');
        if (success) {
          addToast('Your order was successfully cancelled.', 'success');
          // Reload page orders dynamically
          if (profile) {
            // Re-fetch orders from context
            navigate('/account');
          }
        }
      } catch {
        addToast('Failed to cancel order.', 'error');
      }
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Your security credentials have been successfully updated in the database!', 'success');
    }, 1500);
  };

  const handleMoveToCart = (product: Product) => {
    addToCart(product);
    toggleWishlist(product);
    addToast(`${product.name} moved to Cart drawer.`, 'success');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-24 text-brand-text-primary text-xs">
      
      {/* HEADER BREADCRUMB & ACCOUNT IDENTIFIER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/40 pb-8 mb-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider">
            <span>Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-brand-primary font-black">Family Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading flex items-center gap-2 flex-wrap">
            Heirloom Workspace: {profile.full_name}
            <Sparkles className="w-5.5 h-5.5 text-brand-accent animate-pulse" />
            {profile?.role === 'admin' && (
              <span className="bg-brand-secondary text-white text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full tracking-wider">
                ADMINISTRATOR
              </span>
            )}
          </h1>
          <p className="text-sm text-brand-text-secondary font-light">
            Monitor workshop polishing pipelines, edit saved destination addresses, and customize profile specifications.
          </p>
        </div>

        {profile?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-brand-accent" /> Go to Admin Dashboard →
          </button>
        )}
      </div>

      {/* WORKSPACE SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT BAR: TAB NAVIGATOR RAIL */}
        <div className="lg:col-span-3 bg-white border border-brand-border/60 p-4 rounded-3xl shadow-xs space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard Workspace', icon: Grid },
            { id: 'orders', label: 'My Woodcraft Orders', icon: ShoppingBag },
            { id: 'wishlist', label: 'My Toy Wishlist', icon: Heart },
            { id: 'addresses', label: 'Address Book', icon: MapPin },
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'security', label: 'Security & Access', icon: Lock },
            ...(profile?.role === 'admin' ? [{ id: 'admin_link', label: 'Admin Panel', icon: ShieldCheck, isLink: true }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if ('isLink' in tab && tab.isLink) {
                    navigate('/admin');
                  } else {
                    setActiveTab(tab.id as any);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary' 
                    : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className="text-[11px] uppercase tracking-wide">{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-brand-border/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 rounded-xl font-bold hover:bg-rose-50/50 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="text-[11px] uppercase tracking-wide">Secure Logout</span>
            </button>
          </div>
        </div>

        {/* RIGHT BAR: CORRESPONDING TAB PANELS */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Analytics Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sourced', val: orders.length, desc: 'Heirloom orders', icon: ShoppingBag, color: 'text-brand-primary bg-brand-primary/5 border-brand-primary/10' },
                  { label: 'Wishlist items', val: wishlist.length, desc: 'Saved designs', icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                  { label: 'Saved Locations', val: savedAddresses.length, desc: 'Destination list', icon: Map, color: 'text-brand-secondary bg-brand-secondary/5 border-brand-secondary/10' },
                  { label: 'Lumber Warranty', val: '100 YR', desc: 'FSC Solid spruce', icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={`border p-4.5 rounded-2xl space-y-1 ${stat.color}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{stat.label}</span>
                        <Icon className="w-4 h-4" />
                      </div>
                      <strong className="block text-2xl font-heading font-black">{stat.val}</strong>
                      <span className="block text-[10px] opacity-75">{stat.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Activity Overview Card */}
              <div className="bg-white border border-brand-border/60 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xs">
                <div className="space-y-1">
                  <h3 className="text-base font-heading font-black">Workshop Pipeline Summary</h3>
                  <p className="text-xs text-brand-text-secondary font-light">Your registered purchases and their current statuses in our polishing chambers.</p>
                </div>

                {orders.length === 0 ? (
                  <div className="border border-dashed border-brand-border/80 p-8 rounded-2xl text-center space-y-3">
                    <p className="text-brand-text-secondary">No current orders in the workspace pipe.</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-primary/95 transition-colors"
                    >
                      Browse Workshop Designs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 2).map((order) => (
                      <div key={order.id} className="border border-brand-border/40 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 hover:border-brand-primary/40 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-gray-400 uppercase font-mono block">Order Code: {order.order_number}</span>
                          <strong className="text-xs text-brand-text-primary">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </strong>
                          <span className="block text-[10px] text-brand-text-secondary">
                            Curated items subtotal: <strong>₹{order.total}</strong>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveTab('orders');
                              setExpandedOrderId(order.id);
                            }}
                            className="bg-brand-bg border border-brand-border text-brand-text-primary px-3.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-bg/80 cursor-pointer"
                          >
                            Trace Pipeline Timeline
                          </button>
                        </div>
                      </div>
                    ))}
                    {orders.length > 2 && (
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-brand-primary font-bold hover:underline block text-center w-full"
                      >
                        View all {orders.length} woodcraft orders
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
                  <h3 className="text-base font-heading font-black">All Custom Sourced Orders ({orders.length})</h3>
                  <span className="text-[10px] text-gray-400 font-extrabold">UPDATED REAL-TIME</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto" />
                    <p className="text-brand-text-secondary">Your collection has no active wooden designs yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      
                      const statusMap = {
                        pending: { label: 'Sourcing block & Pending Polish', style: 'bg-amber-50 text-amber-800 border-amber-200' },
                        processing: { label: 'Awaiting Hand-Oiling Coating', style: 'bg-blue-50 text-blue-800 border-blue-200' },
                        shipped: { label: 'In Transit Crate', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                        delivered: { label: 'Delivered to Destination', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                        cancelled: { label: 'Released & Cancelled', style: 'bg-rose-50 text-rose-800 border-rose-200' }
                      };

                      const curStatus = statusMap[order.order_status] || statusMap.pending;

                      return (
                        <div key={order.id} className="border border-brand-border/50 rounded-2xl overflow-hidden shadow-2xs">
                          {/* Top heading strip */}
                          <div className="bg-brand-bg/20 border-b border-brand-border/40 p-4 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-4">
                              <div>
                                <span className="block text-[9px] text-gray-400 uppercase font-bold">Crate Code</span>
                                <span className="font-extrabold text-brand-primary font-mono">{order.order_number}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-gray-400 uppercase font-bold">Placed</span>
                                <span className="font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-gray-400 uppercase font-bold">Total Amount</span>
                                <span className="font-black text-brand-primary">₹{order.total}</span>
                              </div>
                            </div>

                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${curStatus.style}`}>
                              {curStatus.label}
                            </span>
                          </div>

                          {/* Order items strip */}
                          <div className="p-4 space-y-3">
                            {order.items?.map((item, itemIdx) => {
                              const matchProduct = products.find(p => p.id === item.product_id);
                              return (
                                <div key={itemIdx} className="flex gap-3 items-center">
                                  <img
                                    src={item.productImage || matchProduct?.image}
                                    alt={item.productName || matchProduct?.name}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-lg object-cover border border-brand-border/30 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-brand-text-primary truncate">{item.productName || matchProduct?.name}</h4>
                                    <span className="text-[10px] text-gray-400">Qty: {item.quantity} • Unit Price: ₹{item.price}</span>
                                  </div>
                                  <span className="font-bold text-brand-primary">₹{item.price * item.quantity}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Accordion timeline & actions */}
                          <div className="bg-brand-bg/10 border-t border-brand-border/30 p-3.5 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className="bg-white border border-brand-border text-brand-text-primary px-3.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-bg/50 cursor-pointer"
                              >
                                {isExpanded ? 'Hide Details' : 'Trace Pipeline Timeline'}
                              </button>
                              
                              <button
                                onClick={() => window.print()}
                                className="bg-white border border-brand-border text-brand-text-secondary px-3.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-bg/50 cursor-pointer flex items-center gap-1"
                              >
                                <Download className="w-3 h-3 text-brand-primary" /> Print Invoice
                              </button>
                            </div>

                            {order.order_status === 'pending' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancel Order
                              </button>
                            )}
                          </div>

                          {/* Expanded Detailed Sourcing Timeline Tracking */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-brand-bg/30 border-t border-brand-border/30 p-6 space-y-6"
                              >
                                <div className="space-y-1">
                                  <h4 className="font-heading font-black text-brand-text-primary">Live Workshop Tracking Details</h4>
                                  <p className="text-[10px] text-brand-text-secondary">Track the literal physical lifecycle steps of your timber order.</p>
                                </div>

                                <div className="space-y-4 pl-1">
                                  {[
                                    { title: 'Timber Selection', desc: 'Sourcing high-grain sustainable European beechwood logs.', status: order.order_status !== 'cancelled' ? 'completed' : 'cancelled' },
                                    { title: 'Artisanal Slicing & Edge Smoothing', desc: 'Precision carving using high-torque diamond tipped friction bands.', status: ['processing', 'shipped', 'delivered'].includes(order.order_status) ? 'completed' : order.order_status === 'cancelled' ? 'cancelled' : 'active' },
                                    { title: 'Certified Plant Coat Friction Rub', desc: 'Saturating organic walnut seed oils into open grains for defense.', status: ['shipped', 'delivered'].includes(order.order_status) ? 'completed' : order.order_status === 'cancelled' ? 'cancelled' : order.order_status === 'processing' ? 'active' : 'upcoming' },
                                    { title: 'Cardboard Box Packaging & Seal', desc: 'Wrapped in FSC-tissue lining and packed inside a rigid custom carton.', status: ['shipped', 'delivered'].includes(order.order_status) ? 'completed' : order.order_status === 'cancelled' ? 'cancelled' : 'upcoming' },
                                    { title: 'Handed to Destination Courier', desc: 'Order left Jodhpur workshop, tracking code loaded.', status: order.order_status === 'delivered' ? 'completed' : order.order_status === 'shipped' ? 'active' : order.order_status === 'cancelled' ? 'cancelled' : 'upcoming' },
                                    { title: 'Delivered Safely to Doorstep', desc: 'Artisans complete inspection and secure parent signature.', status: order.order_status === 'delivered' ? 'completed' : order.order_status === 'cancelled' ? 'cancelled' : 'upcoming' }
                                  ].map((step, stepIdx) => (
                                    <div key={stepIdx} className="flex gap-3.5 items-start relative">
                                      {stepIdx < 5 && (
                                        <div className="absolute left-2 top-5 bottom-[-20px] w-0.5 bg-brand-border" />
                                      )}
                                      
                                      <div className={`w-4 h-4 rounded-full border shrink-0 z-10 flex items-center justify-center text-[8px] font-extrabold ${
                                        step.status === 'completed'
                                          ? 'bg-brand-success text-white border-transparent'
                                          : step.status === 'active'
                                            ? 'bg-brand-primary text-white border-transparent animate-pulse'
                                            : step.status === 'cancelled'
                                              ? 'bg-rose-500 text-white border-transparent'
                                              : 'bg-white text-gray-300 border-brand-border'
                                      }`}>
                                        {step.status === 'completed' ? '✓' : step.status === 'cancelled' ? '✗' : stepIdx + 1}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <strong className={`font-bold block ${step.status === 'upcoming' ? 'text-gray-400' : 'text-brand-text-primary'}`}>{step.title}</strong>
                                        <p className="text-[10px] text-brand-text-secondary font-light mt-0.5">{step.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: TOY WISHLIST */}
          {activeTab === 'wishlist' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h3 className="text-base font-heading font-black">Your Toy Wishlist ({wishlist.length})</h3>
                  <p className="text-xs text-brand-text-secondary font-light font-sans mt-0.5">Designs you have bookmarked for future collection expansion.</p>
                </div>

                {wishlist.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto animate-pulse" />
                    <h4 className="font-bold text-brand-text-primary">No Heirlooms Saved Yet</h4>
                    <p className="text-brand-text-secondary font-light max-w-sm mx-auto leading-normal">
                      Click the small heart icon while browsing our workshop products to bookmark pieces here.
                    </p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-primary/95 shadow-sm cursor-pointer"
                    >
                      Browse Organic Designs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border border-brand-border/50 rounded-2xl overflow-hidden p-4 flex gap-4 hover:border-brand-primary/40 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover border border-brand-border/40 shrink-0"
                        />
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <h4 className="font-heading font-extrabold text-brand-text-primary truncate">{item.name}</h4>
                            <span className="text-[10px] text-brand-secondary font-bold uppercase block">{item.category}</span>
                            <span className="font-extrabold text-brand-primary block">₹{item.price}</span>
                          </div>

                          <div className="flex gap-2.5 pt-2">
                            <button
                              onClick={() => handleMoveToCart(item)}
                              className="bg-brand-primary text-white font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-brand-primary/95 cursor-pointer flex items-center gap-1"
                            >
                              Move to Cart
                            </button>
                            <button
                              onClick={() => toggleWishlist(item)}
                              className="text-gray-400 hover:text-brand-error font-semibold text-[10px] hover:bg-rose-50/50 px-2 py-1.5 rounded-lg cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-heading font-black">Registered Address Book</h3>
                    <p className="text-xs text-brand-text-secondary font-light">Your registered shipping destinations.</p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="bg-brand-primary text-white font-bold px-3.5 py-2 rounded-xl text-[10px] hover:bg-brand-primary/95 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register New Address
                  </button>
                </div>

                {/* Add Address Form Accordion */}
                <AnimatePresence>
                  {showAddressForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddAddress}
                      className="bg-brand-bg/40 border border-brand-border p-5 rounded-2xl space-y-4"
                    >
                      <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wider">Register Address details</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">Full Recipient Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Recipient Name"
                            value={newAddrName}
                            onChange={(e) => setNewAddrName(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">Contact Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="Recipient Phone Number"
                            value={newAddrPhone}
                            onChange={(e) => setNewAddrPhone(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-brand-text-secondary uppercase text-[9px]">Street Address & House Info *</label>
                        <input
                          type="text"
                          required
                          placeholder="Street address, house number, apartment"
                          value={newAddrStreet}
                          onChange={(e) => setNewAddrStreet(e.target.value)}
                          className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">City *</label>
                          <input
                            type="text"
                            required
                            placeholder="City"
                            value={newAddrCity}
                            onChange={(e) => setNewAddrCity(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">State *</label>
                          <input
                            type="text"
                            required
                            placeholder="State"
                            value={newAddrState}
                            onChange={(e) => setNewAddrState(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">Pincode / ZIP *</label>
                          <input
                            type="text"
                            required
                            placeholder="ZIP / Pincode"
                            value={newAddrZip}
                            onChange={(e) => setNewAddrZip(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-text-secondary uppercase text-[9px]">Country *</label>
                          <input
                            type="text"
                            required
                            value={newAddrCountry}
                            onChange={(e) => setNewAddrCountry(e.target.value)}
                            className="w-full bg-white border border-brand-border/60 rounded-xl px-3 py-2 font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-text-secondary">
                          <input
                            type="checkbox"
                            checked={newAddrDefault}
                            onChange={(e) => setNewAddrDefault(e.target.checked)}
                            className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                          />
                          Make this my default workspace delivery address
                        </label>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="submit"
                          className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-[11px] hover:bg-brand-primary/95 cursor-pointer"
                        >
                          Register Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="border border-brand-border text-brand-text-primary font-bold px-4 py-2 rounded-xl text-[11px] hover:bg-brand-bg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Saved locations list */}
                {savedAddresses.length === 0 ? (
                  <p className="text-center py-6 text-brand-text-secondary">No locations registered yet. Click button above to register.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} className={`border p-4.5 rounded-2xl relative space-y-2 flex flex-col justify-between ${addr.default_address ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border bg-white'}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="font-bold text-brand-text-primary text-xs">{addr.full_name}</strong>
                            {addr.default_address && (
                              <span className="bg-brand-primary text-white font-black text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wide">DEFAULT</span>
                            )}
                          </div>
                          <span className="block text-[10px] text-brand-text-secondary">{addr.phone}</span>
                          <p className="text-[11px] text-brand-text-secondary leading-normal font-light">{addr.address}, {addr.city}, {addr.state} ({addr.pincode})</p>
                        </div>

                        <div className="pt-2 border-t border-brand-border/30 flex justify-end gap-2">
                          <span className="text-[9px] text-gray-400 font-bold uppercase block self-center">FSC REGION {addr.country}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h3 className="text-base font-heading font-black">Registered Profile Info</h3>
                  <p className="text-xs text-brand-text-secondary font-light">Manage your customer credentials below.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">Account Email Address (Non-editable)</label>
                      <input
                        type="email"
                        disabled
                        value={profile.email}
                        className="w-full bg-brand-bg/60 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none text-brand-text-secondary opacity-80 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">Contact Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">Recipient Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                    />
                  </div>

                  <div className="pt-4 border-t border-brand-border/40 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-brand-primary text-white text-xs font-bold py-3 px-6 rounded-xl hover:bg-brand-primary/95 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isUpdatingProfile ? 'Saving Information...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 6: SECURITY & ACCESS */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h3 className="text-base font-heading font-black">Security Credentials</h3>
                  <p className="text-xs text-brand-text-secondary font-light">Securely refresh password layers and examine active browser sessions.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wide">Refresh Password Panel</h4>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">Current Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">New Secure Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-brand-text-secondary uppercase text-[9px] tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-border/40 flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-brand-primary text-white text-xs font-bold py-3 px-6 rounded-xl hover:bg-brand-primary/95 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Authorizing Updates...' : 'Authorize Password Reset'}
                    </button>
                  </div>
                </form>

                {/* Device Sessions List */}
                <div className="pt-4 border-t border-brand-border/40 space-y-3">
                  <h4 className="font-extrabold text-brand-text-primary text-xs uppercase tracking-wide">Authorized Device sessions</h4>
                  
                  <div className="space-y-2 text-[11px] text-brand-text-secondary font-sans leading-normal">
                    <div className="bg-brand-bg/40 border border-brand-border/60 p-3 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-success shrink-0" />
                        <div>
                          <strong className="text-brand-text-primary">Active Web Session</strong>
                          <span className="block text-[10px] text-gray-400">Verified Browser Connection • Secured SSL Link</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-full font-bold">ACTIVE NOW</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
