import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { REVIEWS } from '../data/products';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { ArrowRight, Trees, FlameKindling, ShieldCheck, Award, MessageSquare, Star, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface HomeProps {
  onQuickView: (product: Product) => void;
}

export default function Home({ onQuickView }: HomeProps) {
  const navigate = useNavigate();
  const { products, categories, setSelectedCategory, addToCart } = useShop();

  // Get featured products
  const featuredProducts = products.filter((p) => p.featured);
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 4);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    navigate('/shop');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  return (
    <div className="space-y-24 pb-12">
      {/* 1. Hero Section */}
      <section className="relative min-h-[75vh] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center rounded-3xl overflow-hidden mt-28 p-6 sm:p-10 lg:p-14 max-w-7xl mx-auto border border-brand-border/40 bg-white shadow-xs">
        {/* Left Column - Content */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 w-full"
          >
            {/* Tagline Badge */}
            <span className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-brand-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              100% Heirloom Quality Wooden Toys
            </span>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-text-primary tracking-tight leading-[1.1] font-heading">
              Crafted With Love.<br />
              <span className="text-brand-primary">Designed For Curious Minds.</span>
            </h1>

            {/* Subheading */}
            <p className="text-base text-brand-text-secondary leading-relaxed font-light">
              We shape sustainable European beechwood and maple into open-ended toys. Completely chemical-free, painted in natural dyes, and designed to inspire timeless tactile learning.
            </p>

            {/* Interactive CTA buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  navigate('/shop');
                }}
                className="bg-brand-primary text-white text-sm font-bold px-8 py-4 rounded-xl hover:bg-brand-primary/95 transition-all shadow-md flex items-center gap-2 group cursor-pointer hover:shadow-lg active:scale-98"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="bg-white hover:bg-brand-bg text-brand-text-primary text-sm font-bold px-8 py-4 rounded-xl border border-brand-border transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Our Story
              </button>
            </div>

            {/* Horizontal Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-brand-border/60 w-full">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center text-brand-primary shrink-0 border border-brand-border/40">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-brand-text-primary uppercase tracking-wide">FSC Wood</span>
                  <span className="block text-[10px] text-brand-text-secondary leading-none mt-0.5">Sustainable</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center text-brand-primary shrink-0 border border-brand-border/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-brand-text-primary uppercase tracking-wide">100% Safe</span>
                  <span className="block text-[10px] text-brand-text-secondary leading-none mt-0.5">Non-toxic</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center text-brand-primary shrink-0 border border-brand-border/40">
                  <FlameKindling className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-brand-text-primary uppercase tracking-wide">Handmade</span>
                  <span className="block text-[10px] text-brand-text-secondary leading-none mt-0.5">Artisanal</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center text-brand-primary shrink-0 border border-brand-border/40">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-brand-text-primary uppercase tracking-wide">Natural Oils</span>
                  <span className="block text-[10px] text-brand-text-secondary leading-none mt-0.5">Linseed finish</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Beautiful Premium Framed Image with decorative details */}
        <div className="lg:col-span-5 relative w-full h-[380px] lg:h-full min-h-[380px] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full h-full max-w-[420px] lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border border-brand-border/50 bg-brand-bg/30 p-3 flex items-center justify-center group"
          >
            {/* Soft decorative background circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial from-brand-accent/10 to-transparent blur-3xl rounded-full opacity-60 -z-10" />
            
            {/* Inner elegant frame container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-brand-border/40 bg-white shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=1600"
                alt="Handcrafted toys background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              
              {/* Subtle overlay lines */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-80" />
            </div>

            {/* Overlapping Floating Specs Badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute bottom-6 -left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-brand-border/60 shadow-lg flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-black">
                CK
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-medium leading-none">Designed in</p>
                <p className="text-xs font-extrabold text-brand-text-primary">100% Solid Wood</p>
              </div>
            </motion.div>

            {/* Absolute Overlapping Floating Eco Badge */}
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-6 -right-4 bg-brand-primary text-white px-4 py-2 rounded-2xl border border-brand-primary/20 shadow-lg flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Biodegradable</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Collections</span>
          <h2 className="text-3xl font-extrabold text-brand-text-primary tracking-tight">
            Artisanal Play Categories
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Every collection is designed to feed specific milestones of physical and sensory childhood development.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              onClick={() => handleCategoryClick(category.slug || category.id)}
              className="group relative h-80 rounded-2xl overflow-hidden border border-brand-border/60 shadow-xs hover:shadow-md cursor-pointer bg-white flex flex-col justify-end"
            >
              {/* Image & Overlay */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:via-black/50 transition-all duration-300" />
                <img
                  src={category.image}
                  alt={category.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 duration-700 ease-out"
                />
              </div>

              {/* Text info */}
              <div className="relative z-10 p-6 space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-300 font-light leading-relaxed line-clamp-2">
                  {category.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent group-hover:text-white pt-2 transition-colors">
                  Shop Collection
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2.5">
            <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Hand-Selected</span>
            <h2 className="text-3xl font-extrabold text-brand-text-primary tracking-tight">
              Featured Wooden Sculptures
            </h2>
            <p className="text-sm text-brand-text-secondary leading-relaxed font-light max-w-lg">
              Each toy has been selected for its exceptional design balance, physical versatility, and eco-friendly craftsmanship.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              navigate('/shop');
            }}
            className="text-sm font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 shrink-0"
          >
            View All Toys
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </section>

      {/* 4. Best Sellers banner/carousels */}
      <section className="bg-white border-y border-brand-border/60 py-20 max-w-7xl mx-auto rounded-3xl px-8 sm:px-12 lg:px-16 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Customer Favorites</span>
          <h2 className="text-3xl font-extrabold text-brand-text-primary tracking-tight">
            Best Sellers of the Season
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Our most popular modular play designs, rated 5/5 by parents and educators worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </section>

      {/* 5. Why Choose CraftKalash (Bento Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Our Philosophy</span>
          <h2 className="text-3xl font-extrabold text-brand-text-primary tracking-tight">
            Designed to Last Generations
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Why wooden toys are an investment in healthier cognitive development, safety, and a sustainable future.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-brand-border/60 p-8 rounded-2xl flex flex-col gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary tracking-tight">
              100% Saliva-Safe Finishes
            </h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
              Unlike cheap plastic toys that off-gas microplastics, our toys are finished using cold-pressed linseed oils and organic beeswax. Even when chewed, they remain entirely food-grade safe.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-brand-border/60 p-8 rounded-2xl flex flex-col gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Trees className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary tracking-tight">
              Regenerative Forestry
            </h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
              Every branch used in CraftKalash is harvested under strict FSC guidelines. For every tree harvested, five new saplings are planted, contributing to sustainable local bio-environments.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-brand-border/60 p-8 rounded-2xl flex flex-col gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary tracking-tight">
              Anti-Overstimulation Design
            </h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
              By removing batteries, blinking lights, and loud pre-programmed sound boxes, our minimalistic designs stimulate natural lateral problem solving and deeper child concentration.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Parent Reviews</span>
          <h2 className="text-3xl font-extrabold text-brand-text-primary tracking-tight">
            Loved by Conscious Parents
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Read stories of families who replaced plastic noises with quiet, creative tactile play.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review) => (
            <div key={review.id} className="bg-white border border-brand-border/60 p-8 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current text-amber-500" />
                    ))}
                  </div>
                  {review.verified && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-success bg-green-50 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-secondary leading-relaxed font-light italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-brand-border/40">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary">
                  {review.userName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text-primary">{review.userName}</h4>
                  <span className="text-[10px] text-gray-400">{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
