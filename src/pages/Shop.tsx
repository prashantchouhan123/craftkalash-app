import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SlidersHorizontal, 
  Search, 
  RotateCcw, 
  ArrowUpDown, 
  ChevronRight, 
  Star, 
  Check, 
  Sparkles, 
  X, 
  TrendingUp, 
  History 
} from 'lucide-react';
import { Product } from '../types';

interface ShopProps {
  onQuickView: (product: Product) => void;
}

export default function Shop({ onQuickView }: ShopProps) {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy
  } = useShop();

  // Expanded Filter States
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Calculate dynamic maximum price limit from products
  const maxLimit = products.length > 0 
    ? Math.max(1000, Math.ceil(Math.max(...products.map(p => p.price)) / 50) * 50) 
    : 1000;

  // Auto-sync price filter with loaded products
  useEffect(() => {
    if (products.length > 0) {
      setMaxPrice(maxLimit);
    }
  }, [products.length, maxLimit]);

  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('craftkalash_recent_searches');
      return saved ? JSON.parse(saved) : ['Stacker', 'Walnut', 'Blocks'];
    } catch {
      return ['Stacker', 'Walnut', 'Blocks'];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Trigger brief shimmer loading on filter change to give premium, realistic app feel
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    selectedCategory,
    searchQuery,
    minPrice,
    maxPrice,
    selectedAgeGroups.join(','),
    selectedMaterials.join(','),
    onlyInStock,
    minRating,
    sortBy
  ]);

  // Save recent searches
  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, 5);
      localStorage.setItem('craftkalash_recent_searches', JSON.stringify(updated));
      return updated;
    });
    setSearchQuery(cleanTerm);
    setIsSearchFocused(false);
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('craftkalash_recent_searches');
  };

  // Reset all filters easily
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
    setMinPrice(0);
    setMaxPrice(maxLimit);
    setSelectedAgeGroups([]);
    setSelectedMaterials([]);
    setOnlyInStock(false);
    setMinRating(0);
  };

  // Check if a product fits age group selections
  const matchesAgeGroup = (product: Product) => {
    if (selectedAgeGroups.length === 0) return true;
    
    const ageLower = product.ageRange.toLowerCase();
    return selectedAgeGroups.some(group => {
      if (group === 'infant') {
        return ageLower.includes('month') || ageLower.includes('18 months') || ageLower.includes('12 months');
      }
      if (group === 'toddler') {
        return ageLower.includes('18 months') || ageLower.includes('2 years') || ageLower.includes('3 years');
      }
      if (group === 'preschool') {
        return ageLower.includes('3 years') || ageLower.includes('4 years') || ageLower.includes('preschool');
      }
      return false;
    });
  };

  // Check if a product fits material selections
  const matchesMaterial = (product: Product) => {
    if (selectedMaterials.length === 0) return true;
    return product.materials.some(pm => 
      selectedMaterials.some(sm => pm.toLowerCase().includes(sm.toLowerCase()))
    );
  };

  // Filter products based on all filters
  const filteredProducts = products.filter((product) => {
    let matchesCategory = selectedCategory === 'all';
    
    if (!matchesCategory) {
      const activeCategoryObj = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);
      if (activeCategoryObj) {
        const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const normCatName = normalize(activeCategoryObj.name);
        const normProdCat = normalize(product.category);
        
        matchesCategory = 
          product.category === selectedCategory ||
          product.category_id === selectedCategory ||
          product.category_id === activeCategoryObj.id ||
          product.category === activeCategoryObj.slug ||
          normCatName === normProdCat ||
          normProdCat.includes(normCatName) ||
          normCatName.includes(normProdCat);
      } else {
        matchesCategory = 
          product.category === selectedCategory || 
          product.category_id === selectedCategory;
      }
    }
    
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    
    const matchesStock = !onlyInStock || product.inStock;
    
    const matchesRating = product.rating >= minRating;

    return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesRating && matchesAgeGroup(product) && matchesMaterial(product);
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    // default/featured: sort by featured or ID length or simply custom priority
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Toggle Materials Handler
  const handleToggleMaterial = (mat: string) => {
    setSelectedMaterials(prev => 
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    );
  };

  // Toggle Age Group Handler
  const handleToggleAgeGroup = (age: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
    );
  };

  // Instant Suggestions list
  const activeSuggestions = searchQuery.trim() 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const filterSidebarContent = (isMobile: boolean = false) => (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/40">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4.5 h-4.5 text-brand-primary" />
          <h2 className="text-sm font-extrabold text-brand-text-primary uppercase tracking-wide font-heading">
            Filter Options
          </h2>
        </div>
        {isMobile && (
          <button 
            onClick={() => setIsMobileFilterOpen(false)}
            className="p-1.5 hover:bg-brand-bg rounded-lg text-gray-400 hover:text-brand-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 1. Professional Price Range Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-text-primary">
            Price Range
          </h3>
          {(minPrice > 0 || maxPrice < maxLimit) && (
            <button
              onClick={() => {
                setMinPrice(0);
                setMaxPrice(maxLimit);
              }}
              className="text-[10px] text-brand-primary font-bold hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Interactive Range Preset Chips */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Under ₹500', min: 0, max: 500 },
            { label: '₹500 - ₹1000', min: 500, max: 1000 },
            { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
            { label: '₹2000 & Above', min: 2000, max: maxLimit },
          ].map((preset, idx) => {
            const isSelected = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                }}
                className={`px-2 py-2.5 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                    : 'bg-[#FCFBF9] border-[#EBE5DB] text-brand-text-secondary hover:bg-white hover:text-brand-text-primary'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Min/Max Numeric Inputs with visual labels and custom border styling */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₹</span>
            <input
              type="number"
              min="0"
              max={maxLimit}
              placeholder="Min"
              value={minPrice || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setMinPrice(val);
              }}
              className="w-full bg-[#FAF8F5]/60 border border-[#EBE5DB] rounded-xl pl-6 pr-6 py-2 text-[11px] font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/15 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-wider text-gray-400 select-none">Min</span>
          </div>

          <span className="text-gray-400 text-xs font-semibold">—</span>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₹</span>
            <input
              type="number"
              min="0"
              max={maxLimit}
              placeholder="Max"
              value={maxPrice === maxLimit ? '' : maxPrice}
              onChange={(e) => {
                const val = e.target.value === '' ? maxLimit : Number(e.target.value);
                setMaxPrice(val);
              }}
              className="w-full bg-[#FAF8F5]/60 border border-[#EBE5DB] rounded-xl pl-6 pr-6 py-2 text-[11px] font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/15 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-wider text-gray-400 select-none">Max</span>
          </div>
        </div>

        {/* Polished Slider for interactive cap control */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-brand-text-secondary font-bold">
            <span>Selected Range:</span>
            <span className="text-brand-primary">₹{minPrice} - ₹{maxPrice}</span>
          </div>
          <div className="relative pt-1 flex items-center">
            <input
              type="range"
              min="0"
              max={maxLimit}
              step="10"
              value={maxPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= minPrice) {
                  setMaxPrice(val);
                }
              }}
              className="w-full h-1.5 bg-[#FAF8F5] border border-[#EBE5DB]/50 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* 2. Materials */}
      <div className="space-y-3 pt-4 border-t border-brand-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
          Wood Materials
        </h3>
        <div className="space-y-2 text-xs text-brand-text-secondary">
          {[
            { id: 'beech', name: 'Sustainable Beechwood' },
            { id: 'maple', name: 'Premium Maple Wood' },
            { id: 'walnut', name: 'American Walnut' },
            { id: 'linden', name: 'Linden Block Wood' }
          ].map(mat => {
            const checked = selectedMaterials.includes(mat.id);
            return (
              <label key={mat.id} className="flex items-center gap-2.5 font-medium cursor-pointer group select-none">
                <input 
                  type="checkbox" 
                  checked={checked}
                  onChange={() => handleToggleMaterial(mat.id)}
                  className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4 border-brand-border transition-colors cursor-pointer" 
                />
                <span className={`group-hover:text-brand-primary transition-colors ${checked ? 'text-brand-text-primary font-bold' : ''}`}>
                  {mat.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Age Suitability */}
      <div className="space-y-3 pt-4 border-t border-brand-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
          Age Suitability
        </h3>
        <div className="space-y-2 text-xs text-brand-text-secondary">
          {[
            { id: 'infant', name: 'Infants (0-12m)' },
            { id: 'toddler', name: 'Toddlers (1-3y)' },
            { id: 'preschool', name: 'Preschoolers (4y+)' }
          ].map(age => {
            const checked = selectedAgeGroups.includes(age.id);
            return (
              <label key={age.id} className="flex items-center gap-2.5 font-medium cursor-pointer group select-none">
                <input 
                  type="checkbox" 
                  checked={checked}
                  onChange={() => handleToggleAgeGroup(age.id)}
                  className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4 border-brand-border transition-colors cursor-pointer" 
                />
                <span className={`group-hover:text-brand-primary transition-colors ${checked ? 'text-brand-text-primary font-bold' : ''}`}>
                  {age.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Minimum Customer Rating */}
      <div className="space-y-3 pt-4 border-t border-brand-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
          Rating
        </h3>
        <div className="space-y-1.5">
          {[
            { score: 4.8, label: '4.8 & Above' },
            { score: 4.5, label: '4.5 & Above' },
            { score: 4.0, label: '4.0 & Above' }
          ].map(rat => (
            <button
              key={rat.score}
              onClick={() => setMinRating(minRating === rat.score ? 0 : rat.score)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-all ${
                minRating === rat.score
                  ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                  : 'bg-brand-bg/20 hover:bg-brand-bg text-brand-text-secondary border border-transparent'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {rat.label}
              </span>
              {minRating === rat.score && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Availability Status */}
      <div className="space-y-3 pt-4 border-t border-brand-border/40">
        <label className="flex items-center gap-2.5 font-bold text-xs text-brand-text-primary cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4 border-brand-border cursor-pointer" 
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Reset button inside widget */}
      <button
        onClick={handleResetFilters}
        className="w-full flex items-center justify-center gap-1.5 py-3 border border-brand-border hover:bg-brand-bg text-brand-text-primary text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs mt-4 active:scale-98"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-20 space-y-8">
      {/* Page Header / Breadcrumbs */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary font-medium uppercase tracking-wider">
          <span>Home</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-primary font-bold">Shop Collection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight font-heading">
          Sustainably Crafted Toys
        </h1>
        <p className="text-sm text-brand-text-secondary leading-relaxed font-light max-w-2xl">
          Polished raw wood blocks, kinetic marble trajectories, and open-ended play materials. Zero synthetic paints or plastic elements.
        </p>
      </div>

      {/* Catalog Search, Filtering and Sorting Controls Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white border border-brand-border/60 p-4 rounded-2xl shadow-xs relative">
        
        {/* Search Input Box with suggestions dropdown */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search our woodcrafts catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // delay to allow clicks
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(searchQuery);
            }}
            className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-brand-bg rounded-full text-gray-400 hover:text-brand-text-primary"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Premium Interactive Dropdown Suggestions Box */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white border border-brand-border shadow-xl rounded-2xl p-4 z-40 space-y-4"
              >
                {/* Popular / Recent searches */}
                {recentSearches.length > 0 && !searchQuery && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3" />
                        Recent Searches
                      </span>
                      <button 
                        onMouseDown={handleClearRecentSearches}
                        className="text-brand-primary hover:underline lowercase font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((s, idx) => (
                        <button
                          key={idx}
                          onMouseDown={() => {
                            setSearchQuery(s);
                            setIsSearchFocused(false);
                          }}
                          className="bg-brand-bg/60 hover:bg-brand-bg text-brand-text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg border border-brand-border/40 flex items-center gap-1"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Suggestions list */}
                {searchQuery.trim() && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-brand-secondary" />
                      Matching Suggestions
                    </span>
                    {activeSuggestions.length === 0 ? (
                      <p className="text-xs text-brand-text-secondary italic">No immediate name matches...</p>
                    ) : (
                      <div className="space-y-1">
                        {activeSuggestions.map(p => (
                          <button
                            key={p.id}
                            onMouseDown={() => {
                              setSearchQuery(p.name);
                              setIsSearchFocused(false);
                              onQuickView(p);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-brand-text-primary hover:bg-brand-bg flex items-center gap-2 group"
                          >
                            <img src={p.image} className="w-6 h-6 rounded-md object-cover border border-brand-border/40 shrink-0" referrerPolicy="no-referrer" />
                            <span className="flex-1 truncate group-hover:text-brand-primary transition-colors">{p.name}</span>
                            <span className="text-[10px] text-brand-primary font-black">₹{p.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-brand-border/40 pt-2 flex items-center justify-between text-[10px] text-brand-text-secondary">
                  <span>Press <kbd className="font-mono bg-brand-bg px-1 rounded">Enter</kbd> to search everything</span>
                  <span className="flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
                    Premium Wooden Quality
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Quick Filter Row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-brand-bg/60 border border-brand-border/40 text-brand-text-primary hover:bg-brand-bg'
            }`}
          >
            All Toys
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug || cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === (cat.slug || cat.id)
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-brand-bg/60 border border-brand-border/40 text-brand-text-primary hover:bg-brand-bg'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort selector & Mobile filter trigger */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-brand-border/40 lg:hidden">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-brand-border/60 rounded-xl bg-brand-bg/30 text-xs font-bold text-brand-text-primary hover:bg-brand-bg"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters & Specifications
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-full max-w-xs bg-white shadow-2xl z-50 p-6 overflow-y-auto flex flex-col justify-between border-r border-brand-border lg:hidden"
            >
              {filterSidebarContent(true)}
              <div className="pt-4 mt-4 border-t border-brand-border/40 text-center">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="bg-brand-primary text-white w-full py-2.5 rounded-xl text-xs font-extrabold shadow-sm active:scale-98"
                >
                  View {sortedProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Category Specs Widget (Desktop only) */}
        <div className="hidden lg:block lg:col-span-3 bg-white border border-brand-border/60 p-6 rounded-2xl space-y-6 sticky top-28 shadow-xs">
          {filterSidebarContent(false)}
        </div>

        {/* Right Side: Grid of Cards */}
        <div className="lg:col-span-9 space-y-6">
          {/* PROFESSIONAL SORT TABS BAR (Flipkart/Amazon/E-Commerce Style) */}
          <div className="bg-white border border-brand-border/50 rounded-2xl p-1 shadow-2xs flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 min-w-max">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-text-secondary px-4 py-2 select-none">
                Sort By:
              </span>
              {[
                { value: 'featured', label: 'Popularity' },
                { value: 'price-asc', label: 'Price -- Low to High' },
                { value: 'price-desc', label: 'Price -- High to Low' },
                { value: 'newest', label: 'Newest First' },
                { value: 'rating', label: 'Highest Rated' },
              ].map((option) => {
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`relative px-4 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
                      isActive
                        ? 'text-brand-primary font-black bg-brand-primary/5'
                        : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg/50'
                    }`}
                  >
                    {option.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeSortBarUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filtering Stats */}
          <div className="flex items-center justify-between text-xs text-brand-text-secondary font-medium">
            <span>
              Showing <strong>{sortedProducts.length}</strong> of <strong>{products.length}</strong> heirloom toys
            </span>
            {(searchQuery || selectedCategory !== 'all' || sortBy !== 'featured' || minPrice > 0 || maxPrice < maxLimit || selectedAgeGroups.length > 0 || selectedMaterials.length > 0 || onlyInStock || minRating > 0) && (
              <button
                onClick={handleResetFilters}
                className="text-brand-primary hover:text-brand-secondary font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Active Filters
              </button>
            )}
          </div>

          {/* Catalog grid */}
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              /* Shimmer skeletons while filtering for elite feel */
              <motion.div 
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array.from({ length: Math.min(6, Math.max(3, sortedProducts.length)) }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-brand-border/40 overflow-hidden p-4 space-y-4 shadow-2xs">
                    <div className="w-full aspect-square bg-gray-100 animate-pulse rounded-xl" />
                    <div className="h-3.5 w-1/3 bg-gray-100 animate-pulse rounded" />
                    <div className="h-5 w-3/4 bg-gray-100 animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
                    <div className="flex items-center justify-between pt-2 border-t border-brand-border/20">
                      <div className="h-6 w-1/4 bg-gray-100 animate-pulse rounded" />
                      <div className="h-8 w-1/3 bg-gray-100 animate-pulse rounded-lg" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : sortedProducts.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-brand-border/60 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm"
              >
                <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto border border-brand-border/40">
                  <SlidersHorizontal className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-brand-text-primary font-heading">
                  No Heirloom Toys Found
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
                  We couldn't find any wooden crafts matching your combined filter specs. Try adjusting the sliders, materials, or clearing searches.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-brand-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition-all shadow-xs active:scale-98"
                >
                  Clear All Filters & Specs
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="catalog-grid"
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ProductCard product={product} onQuickView={onQuickView} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
