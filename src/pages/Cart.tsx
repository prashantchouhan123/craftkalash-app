import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Heart, 
  Plus, 
  Minus, 
  Ticket, 
  Truck, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { couponsService } from '../services/supabaseService';
import ProductCard from '../components/ProductCard';

export default function Cart({ onQuickView }: { onQuickView?: (product: any) => void }) {
  const {
    cart,
    wishlist,
    updateCartQuantity,
    removeFromCart,
    toggleWishlist,
    isInWishlist,
    getCartTotal,
    getCartItemsCount,
    addToast,
    products
  } = useShop();

  const navigate = useNavigate();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const shippingThreshold = 1500;
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = isShippingFree ? 0 : 99;
  
  const discountAmount = appliedCoupon ? (subtotal * discountPercent) / 100 : 0;
  const grandTotal = subtotal - discountAmount + shippingCost;

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

  const handleMoveToWishlist = (product: any) => {
    if (!isInWishlist(product.id)) {
      toggleWishlist(product);
    }
    removeFromCart(product.id);
    addToast(`Moved ${product.name} to your Wishlist.`, 'success');
  };

  // Recommendations: products that are NOT currently in the cart
  const cartProductIds = cart.map(item => item.product.id);
  const recommendations = products
    .filter(p => !cartProductIds.includes(p.id))
    .slice(0, 4);

  // Delivery estimation (approx. 4 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDelivery = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-24 text-brand-text-primary">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-brand-text-secondary font-medium uppercase tracking-wider mb-8">
        <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-brand-primary transition-colors">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-primary font-bold">Your Cart</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading flex items-center gap-2.5">
          Shopping Cart
          <span className="bg-brand-primary/10 text-brand-primary text-sm font-black px-3 py-1 rounded-full border border-brand-primary/10">
            {getCartItemsCount()} items
          </span>
        </h1>
        <p className="text-sm text-brand-text-secondary font-light mt-1">
          Review, customize, and polish your collection of handcrafted wooden toys.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="space-y-16">
          {/* Empty State Illustration */}
          <div className="bg-white border border-brand-border/60 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xs space-y-6">
            <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto border border-brand-border/40">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black font-heading">Your cart is empty</h2>
              <p className="text-xs text-brand-text-secondary max-w-sm mx-auto leading-relaxed font-light">
                You haven't added any of our sustainable heirlooms yet. Explore our workshop catalog and find the perfect playmate.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex bg-brand-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition-all shadow-xs"
            >
              Explore Heirloom Toys
            </Link>
          </div>

          {/* Recommended products */}
          <div className="space-y-6">
            <div className="border-b border-brand-border/50 pb-4">
              <h3 className="text-lg font-heading font-black flex items-center gap-1.5 text-brand-text-primary">
                <Sparkles className="w-5 h-5 text-brand-secondary" />
                Workshop Recommendations
              </h3>
              <p className="text-xs text-brand-text-secondary font-light">Handpicked favorites loved by other families.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-brand-border/60 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-6 border-b border-brand-border/40 bg-brand-bg/10 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Product details</span>
                <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Subtotal</span>
              </div>

              <div className="divide-y divide-brand-border/30">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    {/* Image */}
                    <div className="w-20 h-20 bg-brand-bg rounded-xl overflow-hidden border border-brand-border/40 shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-heading font-extrabold text-sm text-brand-text-primary hover:text-brand-primary transition-colors">
                          <Link to={`/shop`}>{item.product.name}</Link>
                        </h4>
                      </div>
                      <span className="block text-[11px] text-brand-secondary font-semibold uppercase tracking-wider">
                        {item.product.category.replace('-', ' & ')}
                      </span>
                      <p className="text-[11px] text-brand-text-secondary font-light line-clamp-1 max-w-md">
                        {item.product.description}
                      </p>

                      {/* Controls Row */}
                      <div className="flex flex-wrap items-center gap-4 pt-3 text-xs">
                        {/* Quantity controls */}
                        <div className="flex items-center bg-brand-bg/40 border border-brand-border rounded-xl overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3.5 text-xs font-bold text-brand-text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Move to Wishlist */}
                        <button
                          onClick={() => handleMoveToWishlist(item.product)}
                          className="flex items-center gap-1.5 text-brand-text-secondary hover:text-brand-primary transition-colors font-medium text-[11px]"
                        >
                          <Heart className="w-3.5 h-3.5 text-brand-accent" />
                          Move to Wishlist
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-brand-error transition-colors font-medium text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price column */}
                    <div className="text-right sm:shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-brand-border/40 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <span className="sm:hidden text-xs text-brand-text-secondary font-bold">Subtotal:</span>
                      <div className="space-y-0.5">
                        <span className="block text-sm font-black text-brand-primary">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <span className="hidden sm:block text-[10px] text-gray-400 font-light">
                          ₹{item.product.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="bg-white border border-brand-border/60 p-6 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center border border-brand-primary/10">
                  <Truck className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide">
                    {isShippingFree ? 'Free Shipping Unlocked!' : 'Free Shipping Goal'}
                  </h4>
                  <p className="text-[11px] text-brand-text-secondary font-light">
                    {isShippingFree 
                      ? 'Your order qualifies for free standard polishing & shipping.' 
                      : `Add ₹${(shippingThreshold - subtotal).toFixed(2)} more of hand-crafted items for free shipping.`}
                  </p>
                </div>
              </div>
              {!isShippingFree && (
                <Link
                  to="/shop"
                  className="bg-brand-bg hover:bg-brand-bg/80 text-[11px] font-bold px-4 py-2 border border-brand-border rounded-xl text-brand-primary shrink-0 transition-colors"
                >
                  Shop More
                </Link>
              )}
            </div>
          </div>

          {/* Right: Summary Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-brand-border/60 p-6 rounded-2xl shadow-xs space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider border-b border-brand-border/40 pb-3">
                Order Summary
              </h3>

              {/* Promo Code Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-brand-text-secondary tracking-wider block">Have a promo code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.G. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={Boolean(appliedCoupon)}
                    className="flex-grow bg-brand-bg/40 border border-brand-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={Boolean(appliedCoupon)}
                    className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-primary/95 transition-all disabled:opacity-50 cursor-pointer"
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
              </div>

              {/* Estimation */}
              <div className="flex items-center gap-3 bg-brand-bg/30 p-3 rounded-xl border border-brand-border/30 text-xs">
                <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Estimated Delivery</span>
                  <span className="font-bold text-brand-text-primary">{formattedDelivery}</span>
                </div>
              </div>

              {/* Price list */}
              <div className="space-y-3.5 text-xs text-brand-text-primary">
                <div className="flex justify-between font-medium">
                  <span className="text-brand-text-secondary">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Coupon discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-brand-text-secondary">Workshop Polishing & Shipping</span>
                  <span>{isShippingFree ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-3 border-t border-brand-border/40">
                  <span>Grand Total</span>
                  <span className="text-brand-primary text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 shadow-sm transition-all cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex gap-2.5 bg-brand-bg/40 p-3.5 rounded-xl border border-brand-border/40 text-[10px] text-brand-text-secondary leading-normal">
                <ShieldCheck className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                <span>
                  100% Secure Checkout. Handcrafted wood certified by FSC. Stains made from cold-pressed natural oils and seed extracts. Safe for toddler mouthing.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
