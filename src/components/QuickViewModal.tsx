import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review } from '../types';
import { useShop } from '../context/ShopContext';
import { REVIEWS } from '../data/products';
import { reviewsService } from '../services/supabaseService';
import { 
  X, 
  Star, 
  Heart, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Award, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  HeartHandshake, 
  Smile,
  Truck,
  RotateCcw
} from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onSwitchProduct?: (product: Product) => void;
}

export default function QuickViewModal({ product, onClose, onSwitchProduct }: QuickViewModalProps) {
  const { products, addToCart, toggleWishlist, isInWishlist, addToast, profile } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Interactive Tab Selector
  const [activeTab, setActiveTab] = useState<'details' | 'care' | 'reviews'>('details');

  // Realistic Review List local state
  const [dbReviews, setDbReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load reviews from Supabase when product changes
  useEffect(() => {
    if (product) {
      setLoadingReviews(true);
      reviewsService.getReviews(product.id)
        .then(data => {
          setDbReviews(data);
        })
        .catch(err => {
          console.error('Failed to load reviews from database:', err);
        })
        .finally(() => {
          setLoadingReviews(false);
        });
    }
  }, [product]);

  // Write Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Image Zoom States
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<HTMLDivElement>(null);

  // Reset values when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedImage(null);
    setActiveTab('details');
    setShowReviewForm(false);
    setReviewName('');
    setReviewRating(5);
    setReviewComment('');
  }, [product]);

  if (!product) return null;

  const isFavorite = isInWishlist(product.id);
  const previewImage = selectedImage || product.image;

  // Handle Image Zoom Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const { left, top, width, height } = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onClose();
    // Simulate immediately opening cart drawer for checkout flow
    setTimeout(() => {
      const cartBtn = document.getElementById('cart-trigger-button');
      if (cartBtn) cartBtn.click();
    }, 400);
  };

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      addToast('Please fill out all fields in the review form.', 'error');
      return;
    }

    if (!profile) {
      addToast('Please login to leave a review.', 'error');
      return;
    }

    try {
      const addedReview = await reviewsService.addReview(
        product.id,
        profile.id,
        reviewName.trim(),
        reviewRating,
        reviewComment.trim()
      );
      setDbReviews(prev => [addedReview, ...prev]);
      addToast('Thank you for your heirloom review! Verified badge added.', 'success');
      
      // Reset form
      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
      setShowReviewForm(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to submit review. Please try again.', 'error');
    }
  };

  // Calculate Average dynamically
  const totalReviewsCount = dbReviews.length > 0 ? dbReviews.length : product.reviewsCount;
  const totalRatingSum = dbReviews.length > 0 ? dbReviews.reduce((sum, r) => sum + r.rating, 0) : (product.rating * product.reviewsCount);
  const computedAverageRating = totalReviewsCount > 0 ? (totalRatingSum / totalReviewsCount) : product.rating;

  // Get Related Products (from same category, limit 3)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  // Simulated delivery estimate (e.g., 3-5 business days)
  const today = new Date();
  const deliveryStart = new Date();
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(today.getDate() + 5);
  
  const formatDateRange = () => {
    const startStr = deliveryStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = deliveryEnd.toLocaleDateString('en-US', { day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl z-50 flex flex-col md:flex-row border border-brand-border/60 max-h-[92vh] md:max-h-[85vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-gray-500 hover:text-brand-text-primary hover:bg-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Product Images Area with zoom capability */}
          <div className="md:w-1/2 p-6 bg-brand-bg/20 flex flex-col justify-between border-r border-brand-border/40 overflow-y-auto md:overflow-visible">
            <div className="space-y-4">
              {/* Image Container with premium Hover Zoom */}
              <div 
                ref={zoomRef}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                className="aspect-square w-full rounded-2xl overflow-hidden border border-brand-border/30 bg-white relative cursor-crosshair group shadow-inner"
              >
                <img
                  src={previewImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  style={{
                    transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                    transform: isZoomed ? 'scale(1.4)' : 'scale(1)'
                  }}
                  className="w-full h-full object-cover transition-transform duration-100 ease-out"
                />
                
                {/* Micro zoom prompt badge */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] text-white font-bold uppercase tracking-wider pointer-events-none flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
                  Hover to inspect texture
                </div>
              </div>

              {/* Thumbnail Selector */}
              {product.hoverImage && (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSelectedImage(product.image)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      previewImage === product.image ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={product.image} alt="Primary detail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(product.hoverImage || null)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      previewImage === product.hoverImage ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={product.hoverImage} alt="Alternate detail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                </div>
              )}
            </div>

            {/* Delivery estimate with truck icon */}
            <div className="mt-6 p-3 bg-white/90 border border-brand-border/50 rounded-2xl flex items-center gap-3 text-xs text-brand-text-primary">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold">Estimated Delivery</span>
                <span className="block text-brand-text-secondary text-[11px]">
                  Free Standard Shipping: <strong className="text-brand-primary">{formatDateRange()}</strong>
                </span>
              </div>
            </div>

            {/* Safety Specifications Row */}
            <div className="hidden md:grid grid-cols-2 gap-3 mt-4 text-[11px] text-brand-text-secondary font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 p-2 bg-white/60 rounded-xl border border-brand-border/20 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
                CE Certified Safe
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/60 rounded-xl border border-brand-border/20 justify-center">
                <Award className="w-3.5 h-3.5 text-brand-secondary" />
                100% Solid Wood
              </div>
            </div>
          </div>

          {/* Right Side: Product Details & Tab Options Area */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-none">
            
            {/* Upper basic detail */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-extrabold">
                  {product.category.replace('-', ' & ')}
                </span>
                {/* Stock badge */}
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  product.inStock 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {product.inStock ? '✓ Available & Custom Polished' : 'Sold Out'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-primary tracking-tight leading-tight">
                {product.name}
              </h2>

              {/* Pricing & Savings information */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-brand-primary">${product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through">${product.originalPrice}</span>
                    <span className="bg-brand-error/10 text-brand-error text-xs font-bold px-2.5 py-0.5 rounded-md border border-brand-error/20">
                      Save ${(product.originalPrice - product.price).toFixed(0)} ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off)
                    </span>
                  </>
                )}
              </div>

              {/* Ratings and reviews stats */}
              <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3.5 h-3.5 ${
                        idx < Math.floor(computedAverageRating) ? 'fill-current' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-extrabold text-brand-text-primary">
                  {computedAverageRating.toFixed(1)}
                </span>
                <span>({totalReviewsCount} heirloom reviews)</span>
              </div>

              <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            {/* TAB CONTROLS */}
            <div className="mt-6 border-b border-brand-border/60">
              <div className="flex gap-6 -mb-px">
                {[
                  { id: 'details', name: 'Toy Specs', icon: FileText },
                  { id: 'care', name: 'Care Instructions', icon: HeartHandshake },
                  { id: 'reviews', name: `Reviews (${totalReviewsCount})`, icon: Smile }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'border-brand-primary text-brand-primary font-black'
                          : 'border-transparent text-gray-400 hover:text-brand-text-primary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="py-5 flex-1 min-h-[140px]">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    key="tab-details"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 text-xs"
                  >
                    {/* Basic specs list */}
                    <div className="grid grid-cols-2 gap-3 bg-brand-bg/40 p-3.5 rounded-2xl border border-brand-border/40 font-medium text-brand-text-primary">
                      <div>
                        <span className="block text-gray-400 text-[10px] uppercase font-bold mb-0.5">Suitable Age</span>
                        <span className="font-bold">{product.ageRange}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-[10px] uppercase font-bold mb-0.5">Dimensions</span>
                        <span className="font-bold">{product.dimensions}</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-brand-border/30">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold mb-0.5">Sourcing Materials</span>
                        <span className="font-bold">{product.materials.join(', ')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-primary">Key Features & Pedagogy</h4>
                      <ul className="space-y-1.5 text-brand-text-secondary leading-relaxed font-light">
                        {product.details.map((det, idx) => (
                          <li key={idx} className="flex gap-2">
                            <Check className="w-3.5 h-3.5 text-brand-success shrink-0 mt-0.5" />
                            <span>{det}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'care' && (
                  <motion.div
                    key="tab-care"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 text-xs text-brand-text-secondary leading-relaxed font-light"
                  >
                    <div className="p-4 bg-brand-bg/40 border border-brand-border/40 rounded-2xl space-y-3">
                      <p className="font-bold text-brand-text-primary flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                        100% Organic Wood Care Guidelines
                      </p>
                      <p>
                        Since our toys are coated exclusively with plant dyes and natural linseed oils, they retain raw cellular grain. Follow these tips to keep them beautiful for generations:
                      </p>
                      <ul className="space-y-1.5 list-disc list-inside">
                        <li><strong>Damp Cleaning Only:</strong> Wipe gently with a soft microfiber cloth damp with lukewarm water.</li>
                        <li><strong>No Chemical Solvents:</strong> Avoid industrial dishwashing soaps, bleach, or alcohols.</li>
                        <li><strong>Natural Re-conditioning:</strong> If the wood starts to look dry after years of play, lightly polish with organic olive oil or raw beeswax.</li>
                        <li><strong>Dry Naturally:</strong> Do not place on heating vents or in direct harsh sunlight to dry, as wood can twist.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    key="tab-reviews"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 text-xs"
                  >
                    {/* Write review & Breakdown Header */}
                    <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
                      <div>
                        <span className="font-bold text-brand-text-primary">Review Board</span>
                        <p className="text-[10px] text-gray-400">Read verified family testimonials</p>
                      </div>
                      
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-brand-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-brand-primary/95 transition-all shadow-xs"
                        >
                          Write a Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowReviewForm(false)}
                          className="border border-brand-border text-brand-text-primary text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-brand-bg transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Write Review Form */}
                    <AnimatePresence>
                      {showReviewForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleSubmitReview}
                          className="bg-brand-bg/30 p-4 rounded-2xl border border-brand-border/50 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-brand-text-secondary mb-1">Your Name</label>
                              <input
                                type="text"
                                required
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                placeholder="E.g., Sarah Parker"
                                className="w-full bg-white border border-brand-border/60 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-brand-text-secondary mb-1">Star Rating</label>
                              <div className="flex gap-1 items-center h-8">
                                {[1, 2, 3, 4, 5].map(num => (
                                  <button
                                    type="button"
                                    key={num}
                                    onClick={() => setReviewRating(num)}
                                    className="p-0.5 hover:scale-110 transition-transform"
                                  >
                                    <Star className={`w-4 h-4 ${num <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-brand-text-secondary mb-1">Your Review</label>
                            <textarea
                              required
                              rows={2}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Describe your children's playing experience, texture, or scent..."
                              className="w-full bg-white border border-brand-border/60 rounded-lg p-3 focus:outline-none focus:border-brand-primary resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="bg-brand-primary text-white w-full py-2 rounded-xl font-bold shadow-xs hover:bg-brand-primary/95 active:scale-98"
                          >
                            Submit Verified Heirloom Review
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Reviews list */}
                    <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
                      {loadingReviews ? (
                        <div className="text-center py-4 text-[11px] text-brand-text-secondary animate-pulse">
                          Loading heirloom reviews...
                        </div>
                      ) : (dbReviews.length > 0 ? dbReviews : REVIEWS).map((rev) => (
                        <div key={rev.id} className="p-3 bg-brand-bg/20 rounded-xl border border-brand-border/30 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-brand-text-primary">{rev.userName}</span>
                            <span className="text-gray-400 text-[10px]">{rev.date}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`w-3 h-3 ${idx < rev.rating ? 'fill-current' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                            {rev.verified && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Verified Purchase
                              </span>
                            )}
                          </div>

                          <p className="text-brand-text-secondary font-light leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RELATED PRODUCTS */}
            {relatedProducts.length > 0 && (
              <div className="border-t border-brand-border/40 pt-4 mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-primary mb-2.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                  Related Heirloom Woodcrafts
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {relatedProducts.map(rp => (
                    <div
                      key={rp.id}
                      onClick={() => onSwitchProduct?.(rp)}
                      className="cursor-pointer group p-2 rounded-xl bg-brand-bg/30 border border-brand-border/40 hover:border-brand-primary hover:bg-white transition-all text-center flex flex-col justify-between"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-brand-border/20 bg-white mb-1">
                        <img src={rp.image} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-brand-text-primary truncate">{rp.name}</span>
                        <span className="block text-[10px] font-black text-brand-primary">${rp.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Quantity Selection and Buy Controls */}
            {product.inStock ? (
              <div className="space-y-4 pt-4 border-t border-brand-border/40 mt-auto">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
                      Qty
                    </span>
                    <div className="flex items-center bg-brand-bg border border-brand-border rounded-xl overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1 bg-white hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-extrabold text-brand-text-primary">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-1 bg-white hover:bg-brand-bg text-gray-500 hover:text-brand-text-primary transition-colors font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-xs text-brand-text-secondary font-bold">
                    Subtotal: <strong className="text-brand-primary text-sm font-black">${(product.price * quantity).toFixed(2)}</strong>
                  </span>
                </div>

                <div className="flex gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddToCart}
                    className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-brand-primary/95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </motion.button>

                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-brand-secondary text-white py-3 rounded-xl text-xs font-bold tracking-wide hover:bg-brand-secondary/95 shadow-md cursor-pointer"
                  >
                    Buy It Now
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-3 border border-brand-border hover:bg-brand-bg text-gray-400 hover:text-brand-error rounded-xl transition-all duration-200 shadow-2xs cursor-pointer shrink-0"
                    aria-label="Toggle wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-error text-brand-error' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center text-xs font-bold text-gray-400 mt-auto">
                Temporarily Out of Stock. Join the waitlist for restock alerts.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
