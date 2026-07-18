import { motion } from 'motion/react';
import { ShieldCheck, Trees, Heart, Compass, Sparkles, HelpCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-36 pb-20 space-y-20">
      {/* Editorial Title */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Our Heritage</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-text-primary tracking-tight leading-tight">
          Where Artisanal Woodcraft Meets Mindful Childhood
        </h1>
        <p className="text-base text-brand-text-secondary leading-relaxed font-light">
          CraftKalash was born out of a desire to bring simplicity, sustainability, and sensory delight back to modern playrooms.
        </p>
      </div>

      {/* Hero Visual Row */}
      <div className="relative h-96 rounded-3xl overflow-hidden border border-brand-border/40 bg-white">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <img
          src="https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=1400"
          alt="Artisanal woodturning workshop"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-8 left-8 right-8 z-20 text-white max-w-lg space-y-2">
          <span className="bg-brand-secondary text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
            Workshop Live
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Every edge chamfered, every block polished by hand.
          </h2>
        </div>
      </div>

      {/* Brand values list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white border border-brand-border/60 p-6 rounded-2xl space-y-3 shadow-xs">
          <Trees className="w-6 h-6 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text-primary tracking-tight">Sustainably Harvested</h3>
          <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
            We exclusively source timber from certified plantations in regions that adhere strictly to regional forestry regrowth regulations.
          </p>
        </div>

        <div className="bg-white border border-brand-border/60 p-6 rounded-2xl space-y-3 shadow-xs">
          <Sparkles className="w-6 h-6 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text-primary tracking-tight">Cold-Pressed Oils</h3>
          <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
            No synthetic glossy chemical lacquers. Our wood fibers are preserved using only organic flaxseed oils and hand-rubbed beeswax.
          </p>
        </div>

        <div className="bg-white border border-brand-border/60 p-6 rounded-2xl space-y-3 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text-primary tracking-tight">Saliva-Safe Colors</h3>
          <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
            Our water-soluble plant pigments are certified saliva-resistant under European Standard EN71-3, making them 100% child-safe.
          </p>
        </div>

        <div className="bg-white border border-brand-border/60 p-6 rounded-2xl space-y-3 shadow-xs">
          <Compass className="w-6 h-6 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text-primary tracking-tight">Open-Ended Design</h3>
          <p className="text-xs text-brand-text-secondary leading-relaxed font-light">
            By removing pre-programmed scripts, child play remains versatile. Bridges become houses, and arches turn into mountain roads.
          </p>
        </div>
      </div>

      {/* Comprehensive Wooden Toy Care Procedures Guide */}
      <div className="bg-white border border-brand-border/60 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs">
        <div className="lg:col-span-7 space-y-5">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            Wood Care & Longevity Guide
          </span>
          <h2 className="text-2xl font-extrabold text-brand-text-primary tracking-tight">
            How to care for raw, organic wooden toys
          </h2>
          <p className="text-sm text-brand-text-secondary leading-relaxed font-light">
            Unlike plastic, natural timber reacts to its surroundings. Proper care ensures your wooden stackers, locomotives, and blocks will be enjoyed by your children, grandchildren, and beyond.
          </p>
          <ul className="space-y-4 text-xs text-brand-text-secondary leading-relaxed">
            <li className="flex gap-2">
              <span className="text-brand-primary font-bold">01.</span>
              <span><strong>Never Submerge:</strong> Wood is highly absorbent. To clean, wipe with a damp, clean cloth. Do not soak or place them in dishwashers.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-primary font-bold">02.</span>
              <span><strong>Natural Air Drying:</strong> Do not place wet wooden toys on heaters or under harsh direct midday sun, as rapid moisture changes can cause minor warping or cracks.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-primary font-bold">03.</span>
              <span><strong>Oil Reconditioning:</strong> If the wood begins to look dry after years of active play, simply rub a few drops of organic olive oil, linseed oil, or food-grade beeswax into the timber with a clean rag.</span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-5 aspect-square rounded-2xl overflow-hidden border border-brand-border/40">
          <img
            src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800"
            alt="Hand-polishing wooden toy"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}
