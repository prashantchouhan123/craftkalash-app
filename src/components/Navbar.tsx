import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Search, Heart, ShoppingBag, Menu, X, Globe, ChevronDown, Award, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../data/products';

export default function Navbar() {
  const {
    getCartItemsCount,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    user,
    profile
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  // Listen to scroll events to toggle transparency
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawers when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCategoriesDropdownOpen(false);
  }, [location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/shop');
      setIsSearchOpen(false);
    }
  };

  const selectCategoryAndNavigate = (catId: string) => {
    setSelectedCategory(catId);
    navigate('/shop');
    setIsCategoriesDropdownOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isDocked = isScrolled || !isHomepage;

  return (
    <>
      {/* Upper Promo Banner */}
      <div className="bg-brand-primary text-white text-[11px] font-semibold tracking-widest text-center py-2 px-4 uppercase flex items-center justify-center gap-1.5 z-50 relative">
        <Award className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
        Free shipping on orders over ₹1500 • Heirloom Handcrafted Wooden Art
      </div>

      <header
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
          isDocked
            ? 'top-0 px-0 max-w-full'
            : 'top-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        }`}
      >
        <div
          className={`transition-all duration-300 border ${
            isDocked
              ? 'bg-white/95 backdrop-blur-md shadow-md border-brand-border/80 py-3 rounded-none border-x-0 border-t-0'
              : 'bg-white/30 backdrop-blur-xs border-white/20 py-4 rounded-2xl'
          }`}
        >
          <div className="px-6 flex items-center justify-between">
            {/* Left: Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/logo.svg"
                alt="CraftKalash Logo"
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
            </Link>

            {/* Center: Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-sm font-semibold tracking-wide transition-colors ${
                      isActive
                        ? 'text-brand-primary font-bold border-b-2 border-brand-primary/80 pb-1'
                        : 'text-brand-text-primary/80 hover:text-brand-primary'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              {/* Categories Dropdown Link */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className="flex items-center gap-1 text-sm font-semibold tracking-wide text-brand-text-primary/80 hover:text-brand-primary transition-colors cursor-pointer"
                >
                  Categories
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Categories Mega Dropdown */}
                <AnimatePresence>
                  {isCategoriesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 bg-white border border-brand-border rounded-2xl p-4 shadow-xl z-50 grid grid-cols-1 gap-1"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pb-2 border-b border-brand-border/40 mb-1">
                        Select Collection
                      </p>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => selectCategoryAndNavigate(cat.id)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-bg/50 text-left transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-brand-border/40">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-brand-text-primary group-hover:text-brand-primary">
                              {cat.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 line-clamp-1">
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-1.5 rounded-full hover:bg-brand-bg/60 text-brand-text-primary/95 transition-all duration-200"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist Link button with badge */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="p-1.5 rounded-full hover:bg-brand-bg/60 text-brand-text-primary/95 transition-all duration-200 relative"
                aria-label="Open wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-error text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Account Profile Trigger */}
              <Link
                to={user ? "/account" : "/auth"}
                className="p-1.5 rounded-full hover:bg-brand-bg/60 text-brand-text-primary/95 transition-all duration-200 flex items-center justify-center"
                aria-label="Account details"
                title={profile ? `Account: ${profile.full_name}` : "Access Heirlooms"}
              >
                {profile ? (
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase flex items-center justify-center border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all">
                    {profile.full_name.charAt(0)}
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>

              {/* Cart Button with badge */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-xs"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">Cart</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {getCartItemsCount()}
                </span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-full hover:bg-brand-bg/60 text-brand-text-primary/95 transition-all"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Horizontal Search Box Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mt-3 mx-auto max-w-xl bg-white border border-brand-border p-3.5 rounded-2xl shadow-xl z-30"
            >
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search wooden puzzles, stackers, infant toys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-brand-text-primary font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-primary/95 transition-colors shadow-xs"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Elegant Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-full max-w-xs bg-white shadow-2xl z-50 flex flex-col p-6 border-r border-brand-border"
            >
              <div className="flex items-center justify-between pb-6 border-b border-brand-border/60 mb-6">
                <span className="text-lg font-black tracking-tight text-brand-text-primary">
                  Craft<span className="text-brand-accent">Kalash</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-brand-bg rounded-lg text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-5 text-base font-semibold text-brand-text-primary">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-brand-primary transition-colors py-1"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Categories lists */}
              <div className="mt-8 pt-8 border-t border-brand-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Explore Categories
                </p>
                <div className="flex flex-col gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategoryAndNavigate(cat.id)}
                      className="text-sm font-semibold text-brand-text-primary hover:text-brand-primary text-left py-1 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Support footer */}
              <div className="mt-auto pt-6 border-t border-brand-border/40 text-xs text-brand-text-secondary">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-brand-accent" />
                  Made sustainably in India
                </p>
                <p>Support: support@craftkalash.com</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
