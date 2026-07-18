import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, ShieldAlert, Sparkles, Trees, Heart } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Footer() {
  const { addToast } = useShop();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Thank you for subscribing to CraftKalash journals!', 'success');
  };

  return (
    <footer className="bg-white border-t border-brand-border/60 text-brand-text-primary pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto rounded-t-3xl mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-brand-border/40">
        {/* Brand statement */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="CraftKalash Logo"
              className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-102"
              referrerPolicy="no-referrer"
            />
          </Link>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Heirloom-grade wooden toys sculpted by hand from sustainably-grown maple and beechwood. Built for sensory growth and screen-free imagination.
          </p>
          <div className="flex gap-4 text-brand-text-secondary">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-brand-primary transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Collections links */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-5">
            Collections
          </h4>
          <ul className="space-y-3.5 text-sm font-medium text-brand-text-secondary">
            <li>
              <Link to="/shop" className="hover:text-brand-primary transition-colors">
                Infant & Toddler
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-brand-primary transition-colors">
                Imaginary Play
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-brand-primary transition-colors">
                Puzzles & Blocks
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-brand-primary transition-colors">
                Vehicles & Motion
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-5">
            Support & Info
          </h4>
          <ul className="space-y-3.5 text-sm font-medium text-brand-text-secondary">
            <li>
              <Link to="/about" className="hover:text-brand-primary transition-colors">
                Our Sustainability Commitment
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-brand-primary transition-colors">
                Contact & Showrooms
              </Link>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">
                Care & Oil Maintenance
              </span>
            </li>
            <li>
              <span className="text-gray-400 cursor-not-allowed">
                Safety & Certification (EN71/ASTM)
              </span>
            </li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-5">
            The CraftKalash Journal
          </h4>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Receive quarterly journals on slow parenting, sustainable play guidelines, and new limited-edition releases.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <input
              type="email"
              placeholder="Your email address"
              required
              className="flex-1 bg-brand-bg/60 border border-brand-border/60 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-primary text-brand-text-primary font-medium"
            />
            <button
              type="submit"
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary/95 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Sustainable Certification and Copyright Footnote */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-brand-text-secondary">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 font-medium">
          <span className="flex items-center gap-1.5">
            <Trees className="w-4 h-4 text-brand-success" />
            FSC C112048 Certified Pine
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-accent" />
            Saliva-Resistant Linseed Oil
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-brand-secondary" />
            ASTM F963 Toy Safe
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-400 font-light">
          <span>&copy; {new Date().getFullYear()} CraftKalash. Made with</span>
          <Heart className="w-3.5 h-3.5 text-brand-error fill-brand-error" />
          <span>for a beautiful tomorrow.</span>
        </div>
      </div>
    </footer>
  );
}
