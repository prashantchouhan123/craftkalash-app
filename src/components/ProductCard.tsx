import React, { useState } from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Heart, ShoppingBag, Eye, Star, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const isFavorite = isInWishlist(product.id);

  // Calculate discount percentage if original price is given
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border border-brand-border/60 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full shadow-2xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Section */}
      <div className="relative aspect-square overflow-hidden bg-brand-bg/40 cursor-pointer" onClick={() => onQuickView?.(product)}>
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-brand-secondary text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="bg-brand-error text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
          {product.bestSeller && (
            <span className="bg-brand-primary text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
              Best Seller
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-400 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-xs rounded-full shadow-sm hover:bg-white hover:scale-110 active:scale-95 text-gray-400 hover:text-brand-error transition-all duration-200"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-brand-error text-brand-error' : 'text-gray-500'
            }`}
          />
        </button>

        {/* Dynamic Image Hover */}
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Quick View Cover Overlay */}
        <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full shadow-lg text-sm font-semibold text-brand-text-primary hover:bg-white border border-brand-border/40"
          >
            <Eye className="w-4 h-4 text-brand-primary" />
            Quick View
          </motion.button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-bold mb-1">
          {product.category.replace('-', ' & ')}
        </span>
        
        <h3 
          className="text-sm sm:text-base font-extrabold text-brand-text-primary tracking-tight hover:text-brand-primary transition-colors cursor-pointer mb-1 flex-1 line-clamp-2"
          onClick={() => onQuickView?.(product)}
        >
          {product.name}
        </h3>

        {/* Short one-line description matching Prompt 2 */}
        <p className="text-xs text-brand-text-secondary/90 font-light line-clamp-1 mb-2.5">
          {product.description}
        </p>

        {/* Ratings and Stock Badge in line */}
        <div className="flex items-center justify-between mb-3.5 pt-1.5">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-500">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-3 h-3 ${
                    idx < Math.floor(product.rating)
                      ? 'fill-current'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary">
              {product.rating.toFixed(1)}
            </span>
          </div>

          {/* Premium Stock Badge (Scarcity or Availability) */}
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
            product.inStock 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            {product.inStock ? 'In Stock' : 'Sold Out'}
          </span>
        </div>

        {/* Price and Action Section */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-border/40">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
            <span className="text-base sm:text-lg font-black text-brand-primary leading-none">
              ${product.price}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
              product.inStock
                ? 'bg-brand-primary text-white hover:bg-brand-primary/95 shadow-xs'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add
          </motion.button>
        </div>
      </div>
    </div>
  );
}
