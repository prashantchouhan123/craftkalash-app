import { Product, Category, Review } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'infant-toddler',
    name: 'Infant & Toddler',
    description: 'Gentle materials, soothing sounds, and safe edges for early developmental stages.',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'imaginary-play',
    name: 'Imaginary Play',
    description: 'Open-ended worlds, wooden kitchen sets, and storytelling block sets.',
    image: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'puzzles-blocks',
    name: 'Puzzles & Blocks',
    description: 'Geometric stackers, nesting trees, and spatial logic timber blocks.',
    image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'vehicles-motion',
    name: 'Vehicles & Motion',
    description: 'Smooth-rolling locomotives, modern racer cars, and dynamic motion blocks.',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=600'
  }
];

export const PRODUCTS: Product[] = [
  // 1. Classic Wooden Baby Walker
  {
    id: 'ef2a2237-6eed-4b28-85a8-4c49a507bc42',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Wooden Baby Walker (Classic)',
    price: 400,
    originalPrice: 499,
    rating: 4.9,
    reviewsCount: 142,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/i5qzx32uael-1784295688077.jpeg',
    description: 'Meet the walker that turns every step into an adventure. Beautifully handcrafted with love, this sturdy, baby-approved wooden walker supports your child\'s first steps while providing endless fun.',
    details: [
      'Safe, sturdy & baby-approved structure.',
      'Handmade with love using organic child-safe pigments.',
      'Builds balance, boosts confidence, and encourages movement.',
      'Includes premium sensory hangings for auditory development.'
    ],
    materials: ['Sustainable European Beechwood', 'Non-toxic Plant Dyes', 'Linseed Oil Finish'],
    dimensions: '48cm x 36cm x 46cm',
    ageRange: '10-24 Months',
    inStock: true,
    featured: true,
    bestSeller: true,
    isNew: false,
    sku: 'CK-WALK-CLASSIC'
  },
  // 2. Wooden Baby Walker (Pastel Bells)
  {
    id: '16ef768e-1970-40e0-ae1c-0ce2c6b2a3f5',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Wooden Baby Walker (Pastel Chimes)',
    price: 400,
    originalPrice: 499,
    rating: 4.8,
    reviewsCount: 96,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/45jn71tfzkr-1784296474763.jpeg',
    description: 'A perfect blend of tradition, play, and learning. This handcrafted premium wooden walker features safe non-toxic pastel colors and charming chime rattle bells that sound with every step.',
    details: [
      'Supports first steps, balance, and physical confidence.',
      'Acoustic sensory development through hanging wood chimes.',
      'Made from premium wood with child-safe colors.',
      'Perfect gift for early milestones and baby showers.'
    ],
    materials: ['Sustainable Solid Maple', 'Non-toxic Safe Pastel Paints', 'Raw Beeswax Finish'],
    dimensions: '48cm x 36cm x 46cm',
    ageRange: '10-24 Months',
    inStock: true,
    featured: true,
    bestSeller: true,
    isNew: false,
    sku: 'CK-WALK-PASTEL'
  },
  // 3. Wooden Baby Walker (Sienna Amber)
  {
    id: '30acd9a9-217a-4196-b057-12e89ee80585',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Wooden Baby Walker (Sienna Amber)',
    price: 300,
    originalPrice: 399,
    rating: 4.7,
    reviewsCount: 54,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/aw8x81u363-1784297144167.jpeg',
    description: 'A timeless wooden baby walker in rich sienna and amber wood tones. Encourages movement, coordination, and physical exploration, crafted manually by skilled artisans.',
    details: [
      'Eco-friendly natural wood and child-safe finishes.',
      'Handcrafted excellence with focus on fine motor skills.',
      'Safe & durable design built to last generations.',
      'Encourages walking, curiosity, and independent play.'
    ],
    materials: ['FSC-Certified Hardwood', 'Artisanal Plant Pigments', 'Cold-pressed Linseed Oil'],
    dimensions: '48cm x 36cm x 46cm',
    ageRange: '10-24 Months',
    inStock: true,
    featured: false,
    bestSeller: false,
    isNew: true,
    sku: 'CK-WALK-SIENNA'
  },
  // 4. Wooden Baby Walker (Forest Trails)
  {
    id: '5e6fa03a-d44f-4d27-b3b0-46ad8cba7541',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Wooden Baby Walker (Forest Trails)',
    price: 300,
    originalPrice: 399,
    rating: 4.8,
    reviewsCount: 72,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/t3kk8zy4tj-1784302564297.jpeg',
    description: 'A premium handcrafted wooden walker featuring forest-green and saffron-red accents. Specially weighted for stability, ensuring safe steps and a happy childhood.',
    details: [
      'Weighted base for sturdy first steps.',
      'Artisanal lacquer-free soft wood texture.',
      'Promotes muscle coordination and posture.',
      '100% natural, biodegradable and chemical-free.'
    ],
    materials: ['Sustainably Harvested Maple Wood', 'Organic Water-based Dyes', 'Linseed Oil Finish'],
    dimensions: '48cm x 36cm x 46cm',
    ageRange: '10-24 Months',
    inStock: true,
    featured: false,
    bestSeller: true,
    isNew: true,
    sku: 'CK-WALK-FOREST'
  },
  // 5. Miniature Farm Tractor Set
  {
    id: '189ac8bc-25ff-4402-b7b5-65d0aa266fe9',
    category: 'vehicles-motion',
    category_id: '44444444-4444-4444-4444-444444444444',
    name: 'CraftKalash Miniature Wooden Farm Tractor Set',
    price: 250,
    originalPrice: 299,
    rating: 4.9,
    reviewsCount: 118,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/js8yvzfx9y-1784302454182.jpeg',
    description: 'Tiny tools, big imagination! This eco-friendly, artisan-crafted wooden farm tractor set is designed to boost creativity, improve hand-eye coordination, and offer durable screen-free entertainment.',
    details: [
      '100% non-toxic and safe for kids.',
      'Beautiful dual-tone premium quality wood with rich grain.',
      'Includes rolling tractor wheels and detachable cargo trailer.',
      'Improves fine motor skills, role play, and spatial thinking.'
    ],
    materials: ['Premium Mahogany and Walnut Wood', 'Organic Linseed Finish'],
    dimensions: '25cm x 10cm x 12cm',
    ageRange: '3 Years +',
    inStock: true,
    featured: true,
    bestSeller: false,
    isNew: false,
    sku: 'CK-TRACTOR-MINI'
  },
  // 6. Three-in-One Smart Puzzle
  {
    id: 'e5773220-5e0c-4149-84ad-3e57bbe6878f',
    category: 'puzzles-blocks',
    category_id: '33333333-3333-3333-3333-333333333333',
    name: 'CraftKalash Three-in-One Learn Play Grow Smart Puzzle',
    price: 500,
    originalPrice: 599,
    rating: 4.8,
    reviewsCount: 88,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/42f3i64m239-1784302947436.jpeg',
    description: 'Endless fun, endless learning! This premium wood puzzle set combines three timeless games in one: a Tangram Puzzle, a Shape Puzzle, and a Block Puzzle. Designed to boost brain power and hand-eye coordination.',
    details: [
      '3 games in 1 puzzle - Tangram, Shape, and Block Puzzle.',
      'Encourages creativity, imagination, and spatial awareness.',
      'Helps recognize different shapes, sizes, and vibrant colors.',
      'Child-safe materials with smooth edges and durable build.'
    ],
    materials: ['Premium Quality Linden Wood', 'Water-based Non-toxic Inks', 'Satin Polish'],
    dimensions: '28cm x 28cm x 2cm',
    ageRange: '3 Years +',
    inStock: true,
    featured: true,
    bestSeller: false,
    isNew: false,
    sku: 'CK-PUZZLE-3IN1'
  },
  // 7. Handcrafted Wooden Couple Set
  {
    id: '49829cc2-d347-401a-bc7b-a9055bf6c70a',
    category: 'imaginary-play',
    category_id: '22222222-2222-2222-2222-222222222222',
    name: 'CraftKalash Handcrafted Wooden Couple (Timeless Decor)',
    price: 600,
    originalPrice: 799,
    rating: 4.7,
    reviewsCount: 34,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/13ko7y8k63dj-1784304650424.jpeg',
    description: 'Timeless decor with traditional charm. These beautifully hand-painted wooden couple dolls are crafted by skilled artisans, perfect for festival gifting, living room decoration, or storytelling imaginary play.',
    details: [
      'Handcrafted with care by skilled traditional artisans.',
      'Eco-friendly, made from sustainable natural wood.',
      'Exquisite hand-painted details with child-safe paint.',
      'Perfect gift idea for festivals, housewarmings, or special occasions.'
    ],
    materials: ['Sustainable Hardwood', 'Traditional Organic Colors', 'Varnish Seal'],
    dimensions: '18cm x 6cm x 6cm (each)',
    ageRange: 'All Ages',
    inStock: true,
    featured: false,
    bestSeller: false,
    isNew: true,
    sku: 'CK-DECOR-COUPLE'
  },
  // 8. Mini Kitchen Wooden Set
  {
    id: '7a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    category: 'imaginary-play',
    category_id: '22222222-2222-2222-2222-222222222222',
    name: 'CraftKalash Mini Kitchen Wooden Set',
    price: 350,
    originalPrice: 420,
    rating: 4.9,
    reviewsCount: 52,
    image: 'https://jvkoodqqvqjeupjusfqh.supabase.co/storage/v1/object/public/product-images/products/lesf1z125r9-1784303855427.jpeg',
    description: 'Tiny tools, big imagination! This eco-friendly, handcrafted kitchen set is a perfect pretend play companion that improves fine motor skills and hand-eye coordination.',
    details: [
      '100% non-toxic and child-safe materials.',
      'Includes wooden rolling pin, cooking pot, mini jars, and pestle & mortar.',
      'Made from premium quality solid wood.',
      'Perfect screen-free entertainment and creative play.'
    ],
    materials: ['Natural Beechwood', 'Non-toxic Food-grade Colors', 'Raw Honey Beeswax Seal'],
    dimensions: 'Various sizes (pot diameter 10cm)',
    ageRange: '3 Years +',
    inStock: true,
    featured: true,
    bestSeller: true,
    isNew: true,
    sku: 'CK-KITCHEN-MINI'
  },
  // 9. Handcrafted Wooden Baby Chowki
  {
    id: '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Handcrafted Wooden Baby Chowki',
    price: 320,
    originalPrice: 450,
    rating: 4.8,
    reviewsCount: 46,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    description: 'Crafted with love, made to share! The CraftKalash Handcrafted Wooden Baby Chowki is a premium child stool featuring a strong solid-wood base and a comfortable, colorful woven seat cord. Perfect for playrooms and sitting activities.',
    details: [
      'Sturdy and durable design with safe, non-toxic materials.',
      'Handwoven cotton seat top encouraging sensory tactile play.',
      'Encourages growth, independent play, and motor skills.',
      'Crafted by skilled artisans with timeless organic finishes.'
    ],
    materials: ['Sustainable Mango Wood', 'Organic Cotton Weave Cord', 'Non-toxic Sealants'],
    dimensions: '32cm x 32cm x 22cm',
    ageRange: '12 months - 6 years',
    inStock: true,
    featured: false,
    bestSeller: true,
    isNew: true,
    sku: 'CK-CHOWKI-BABY'
  },
  // 10. Handcrafted Wooden Tank Toy
  {
    id: '9a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    category: 'vehicles-motion',
    category_id: '44444444-4444-4444-4444-444444444444',
    name: 'CraftKalash Handcrafted Wooden Tank Toy',
    price: 199,
    originalPrice: 250,
    rating: 4.6,
    reviewsCount: 28,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
    description: 'Timeless play, built to last. This handcrafted wooden tank toy is made of premium natural wood with smooth edges and durable rolling wheels for safe, imaginative play.',
    details: [
      '100% natural wood with smooth, baby-safe edges.',
      'Artisanal hand-sanded finish with non-toxic oils.',
      'Durable wooden wheels that roll smoothly.',
      'Makes a perfect gift idea for toddler collections.'
    ],
    materials: ['Solid Pine Wood', 'Natural Walnut Highlights', 'Linseed Oil Coating'],
    dimensions: '15cm x 8cm x 10cm',
    ageRange: '2 Years +',
    inStock: true,
    featured: false,
    bestSeller: false,
    isNew: true,
    sku: 'CK-TANK-TOY'
  },
  // 11. Relaxing Scalp Head Massager
  {
    id: 'a2b3c4d5-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    category: 'infant-toddler',
    category_id: '11111111-1111-1111-1111-111111111111',
    name: 'CraftKalash Relaxing Scalp Head Massager',
    price: 99,
    originalPrice: 150,
    rating: 4.8,
    reviewsCount: 165,
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800',
    description: 'Premium Head Massager. Relax. Refresh. Rejuvenate. Experience instant relief and ultimate relaxation in seconds with 12 flexible metal fingers designed to gently stimulate your scalp.',
    details: [
      '12 flexible metal fingers with custom protective tips.',
      'Ergonomic wooden handle for comfortable grip.',
      'Lightweight and highly portable for use anywhere.',
      'Durable and long-lasting premium build.'
    ],
    materials: ['Flexible Stainless Steel', 'Premium Hardwood Handle', 'Soft Protective Beads'],
    dimensions: '22cm length',
    ageRange: 'All Ages',
    inStock: true,
    featured: false,
    bestSeller: false,
    isNew: true,
    sku: 'CK-MASSAGER-HEAD'
  }
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    userName: 'Katherina M.',
    rating: 5,
    date: 'June 14, 2026',
    comment: 'The wooden walker is incredibly beautiful. The finish is soft and slightly textured, so the wheels don’t slide too fast. My son took his first independent steps with this walker! Absolute luxury.',
    verified: true
  },
  {
    id: 'rev-2',
    userName: 'Jonathan D.',
    rating: 5,
    date: 'July 02, 2026',
    comment: 'My daughter plays with the mini kitchen set every single day. She uses it as real cooking tools! It is spectacular as a living room display piece too!',
    verified: true
  },
  {
    id: 'rev-3',
    userName: 'Elena R.',
    rating: 5,
    date: 'May 28, 2026',
    comment: 'Top quality farm tractor. The mahogany has zero splinters and the wheels roll beautifully. You can tell they put a lot of artisanal work into this. Packaging was sustainable too, zero plastic!',
    verified: true
  }
];
