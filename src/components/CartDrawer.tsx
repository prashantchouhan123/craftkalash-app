import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MapPin, 
  CheckCircle, 
  Ticket,
  ChevronLeft
} from 'lucide-react';
import { couponsService } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import { saveRedirectUrl } from '../utils/redirect';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemsCount,
    addToast,
    clearCart,
    profile,
    placeOrder
  } = useShop();

  const navigate = useNavigate();

  // Step state: 'cart' | 'checkout' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Address Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync profile values if available
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
    }
  }, [profile?.id]);

  const subtotal = getCartTotal();
  const shippingThreshold = 1500;
  
  // Calculate coupon discount
  const discountAmount = appliedCoupon ? (subtotal * discountPercent) / 100 : 0;
  
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = isShippingFree ? 0 : 99;
  const total = subtotal - discountAmount + shippingCost;
  const itemsCount = getCartItemsCount();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const match = await couponsService.validateCoupon(couponCode);
      if (match) {
        setDiscountPercent(Number(match.discount_value));
        setAppliedCoupon(match.code);
        addToast(`Coupon "${match.code}" applied successfully!`, 'success');
      } else {
        addToast('Invalid or expired coupon code.', 'error');
      }
    } catch {
      addToast('Error validating coupon.', 'error');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      addToast('Please login to finalize your transaction.', 'error');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const addressPayload = {
        full_name: fullName,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        default_address: true
      };

      const finalOrder = await placeOrder(addressPayload, paymentMethod);
      if (finalOrder) {
        setPlacedOrderNumber(finalOrder.order_number);
        setCheckoutStep('success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToAuth = () => {
    saveRedirectUrl('/checkout');
    setIsCartOpen(false);
    navigate('/auth');
  };

  const handleCloseDrawerAndReset = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCheckoutStep('cart');
      setCouponCode('');
      setDiscountPercent(0);
      setAppliedCoupon(null);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDrawerAndReset}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-brand-border"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {checkoutStep === 'checkout' && (
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="p-1 hover:bg-brand-bg rounded-lg mr-1 text-gray-400 hover:text-brand-text-primary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <ShoppingBag className="w-5 h-5 text-brand-primary" />
                <h2 className="text-lg font-bold text-brand-text-primary font-heading">
                  {checkoutStep === 'cart' ? 'Your Cart' : checkoutStep === 'checkout' ? 'Artisanal Checkout' : 'Order Registered!'}
                </h2>
                {checkoutStep === 'cart' && (
                  <span className="bg-brand-bg text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full border border-brand-border">
                    {itemsCount}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseDrawerAndReset}
                className="p-1.5 hover:bg-brand-bg rounded-lg text-gray-400 hover:text-brand-text-primary transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONDITIONAL BODY RENDERING */}

            {checkoutStep === 'cart' && (
              <>
                {/* Free Shipping Alert Bar */}
                <div className="bg-brand-bg/60 px-6 py-3 border-b border-brand-border flex items-center gap-2 text-xs font-medium text-brand-text-primary">
                  <Truck className="w-4 h-4 text-brand-primary shrink-0" />
                  {isShippingFree ? (
                    <span>🎉 You have unlocked <strong>Free Standard Shipping!</strong></span>
                  ) : (
                    <span>
                      Add <strong>₹{(shippingThreshold - subtotal).toFixed(2)}</strong> more for <strong>Free Shipping!</strong>
                    </span>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 border border-brand-border/40">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-bold text-brand-text-primary mb-1">
                        Your cart is empty
                      </h3>
                      <p className="text-xs text-brand-text-secondary max-w-[240px] mb-6 font-light">
                        Browse our heirloom wooden toy collections to fill it.
                      </p>
                      <button
                        onClick={handleCloseDrawerAndReset}
                        className="bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-primary/90 transition-colors shadow-xs"
                      >
                        Continue Exploring
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 p-3 bg-brand-bg/20 rounded-xl border border-brand-border/40 hover:border-brand-border transition-colors group"
                      >
                        <div className="w-16 h-16 bg-brand-bg rounded-lg overflow-hidden shrink-0 border border-brand-border/30">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col min-w-0">
                          <h4 className="text-xs font-bold text-brand-text-primary truncate mb-0.5 group-hover:text-brand-primary transition-colors">
                            {item.product.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">
                            {item.product.category.replace('-', ' & ')}
                          </span>

                          <div className="flex items-center justify-between mt-auto">
                            {/* Quantity controls */}
                            <div className="flex items-center bg-white border border-brand-border rounded-lg overflow-hidden shadow-xs">
                              <button
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="p-0.5 hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-brand-text-primary">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="p-0.5 hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price & Delete */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-brand-primary">
                                ₹{(item.product.price * item.quantity).toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1 text-gray-400 hover:text-brand-error hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer Footer with calculation */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-brand-border bg-white space-y-4">
                    {/* Applied Coupon Info */}
                    <div className="flex gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Enter Promo Code (E.g. WELCOME10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={Boolean(appliedCoupon)}
                        className="flex-1 bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-primary text-xs text-brand-text-primary font-bold uppercase placeholder-gray-400 disabled:opacity-50"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={Boolean(appliedCoupon)}
                        className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-primary/95 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {appliedCoupon && (
                      <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold p-2.5 rounded-xl flex items-center justify-between border border-emerald-100">
                        <span className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                          Promo Code {appliedCoupon} applied
                        </span>
                        <span>-{discountPercent}% OFF</span>
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-brand-text-primary font-medium">
                      <div className="flex justify-between">
                        <span className="text-brand-text-secondary">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Coupon discount</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-brand-text-secondary">Polishing & Shipping</span>
                        <span>{isShippingFree ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-brand-text-primary pt-2 border-t border-brand-border/40">
                        <span>Total Sum</span>
                        <span className="text-brand-primary">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 bg-brand-bg/50 p-3 rounded-xl border border-brand-border/40 text-[10px] text-brand-text-secondary">
                      <ShieldCheck className="w-4 h-4 text-brand-success shrink-0" />
                      <span>
                        FSC Sourced Sustainable Wood Guarantee. Certified non-toxic play.
                      </span>
                    </div>

                    {profile ? (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setIsCartOpen(false);
                          navigate('/checkout');
                        }}
                        className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 shadow-sm transition-all cursor-pointer"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={handleGoToAuth}
                          className="w-full bg-brand-secondary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-secondary/95 shadow-sm cursor-pointer"
                        >
                          Sign In / Register to Checkout
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="block text-center text-[10px] text-gray-400 font-bold">
                          REGISTRATION TAKES LESS THAN 10 SECONDS
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'checkout' && (
              <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-brand-text-primary uppercase text-[10px] tracking-wider border-b border-brand-border/45 pb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    1. Shipping Destination
                  </h3>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Recipient Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="E.g., +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Full Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Street, Apartment number, Landmark"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-secondary uppercase text-[10px]">City</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., Jodhpur"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-secondary uppercase text-[10px]">State</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., Rajasthan"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Pincode / Zip</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., 342001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Country</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-extrabold text-brand-text-primary uppercase text-[10px] tracking-wider border-b border-brand-border/45 pb-1 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-brand-primary" />
                    2. Payment Method
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-3 rounded-xl border-2 text-left space-y-1.5 transition-all ${paymentMethod === 'COD' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg/50'}`}
                    >
                      <span className="block font-bold text-brand-text-primary">Cash on Delivery</span>
                      <span className="block text-[10px] text-gray-400 font-light">Pay at delivery point</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-xl border-2 text-left space-y-1.5 transition-all ${paymentMethod === 'CARD' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg/50'}`}
                    >
                      <span className="block font-bold text-brand-text-primary">Card Simulation</span>
                      <span className="block text-[10px] text-gray-400 font-light">Fully secure sandbox</span>
                    </button>
                  </div>
                </div>

                {/* Final Submit order specs */}
                <div className="pt-4 border-t border-brand-border/50 space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="text-brand-text-secondary">Amount Payable:</span>
                    <span className="text-brand-primary text-base">₹{total.toFixed(2)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold hover:bg-brand-primary/95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <span>Placing Heirloom Order...</span>
                    ) : (
                      <>
                        <span>Place Persistent Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-300">
                  <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-heading font-black text-brand-text-primary">Heirloom Order Confirmed</h3>
                  <p className="text-xs text-brand-text-secondary max-w-sm leading-relaxed font-light">
                    Your wooden craft items have been added to the workshop pipeline. Our master toy builders are preparing and hand-oiling the timber logs.
                  </p>
                </div>

                <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border max-w-xs w-full">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">Database Order Code</span>
                  <span className="text-lg font-black text-brand-primary font-mono">{placedOrderNumber}</span>
                </div>

                <div className="space-y-2.5 pt-4 w-full">
                  <button
                    onClick={() => {
                      handleCloseDrawerAndReset();
                      navigate('/account');
                    }}
                    className="w-full bg-brand-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-brand-primary/95 transition-all"
                  >
                    Track Workshop Pipeline
                  </button>
                  <button
                    onClick={handleCloseDrawerAndReset}
                    className="w-full border border-brand-border text-brand-text-primary py-3 rounded-xl text-xs font-bold hover:bg-brand-bg transition-all"
                  >
                    Continue Browsing Shop
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
