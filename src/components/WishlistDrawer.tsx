import { motion, AnimatePresence } from 'motion/react';
import { useShop } from '../context/ShopContext';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistDrawer() {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart
  } = useShop();

  const handleMoveToCart = (product: any) => {
    addToCart(product);
    // remove from wishlist
    toggleWishlist(product);
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsWishlistOpen(false)}
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
                <Heart className="w-5 h-5 text-brand-error fill-brand-error" />
                <h2 className="text-lg font-bold text-brand-text-primary">
                  Your Wishlist
                </h2>
                <span className="bg-brand-bg text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full border border-brand-border">
                  {wishlist.length}
                </span>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1.5 hover:bg-brand-bg rounded-lg text-gray-400 hover:text-brand-text-primary transition-colors"
                aria-label="Close wishlist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 border border-brand-border/40">
                    <Heart className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-brand-text-primary mb-1">
                    Your wishlist is empty
                  </h3>
                  <p className="text-sm text-brand-text-secondary max-w-[240px] mb-6">
                    Save your favorite items by tapping the heart icon on cards.
                  </p>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-primary/90 transition-colors shadow-xs"
                  >
                    Start Exploring
                  </button>
                </div>
              ) : (
                wishlist.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 p-3 bg-brand-bg/30 rounded-xl border border-brand-border/40 hover:border-brand-border transition-colors group"
                  >
                    <div className="w-20 h-20 bg-brand-bg rounded-lg overflow-hidden shrink-0 border border-brand-border/30">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-brand-text-primary truncate mb-0.5 group-hover:text-brand-primary transition-colors">
                        {product.name}
                      </h4>
                      <span className="text-xs text-brand-text-secondary mb-2 uppercase tracking-wide">
                        {product.category.replace('-', ' & ')}
                      </span>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-extrabold text-brand-primary">
                          ₹{product.price}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWishlist(product)}
                            className="p-1.5 text-gray-400 hover:text-brand-error hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleMoveToCart(product)}
                            disabled={!product.inStock}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              product.inStock
                                ? 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-xs'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
