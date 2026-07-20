import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Category, Review, Profile, Address, Order, OrderItem, Coupon, CartItem, ContactMessage } from '../types';
import { PRODUCTS, CATEGORIES, REVIEWS } from '../data/products';

export { isSupabaseConfigured };

// Utility to validate UUID formats to prevent Postgres UUID query cast errors
export const isUUID = (str: any): boolean => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
};

// Helper to check if an email belongs to an administrator
export const isAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase();
  return e === 'admin@craftkalash.com' || e === 'chouhanmamta2888@gmail.com';
};

// Guard function to ensure Supabase is configured
const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
  }
};

// ==========================================
// 1. AUTHENTICATION & PROFILE SERVICES
// ==========================================

export const authService = {
  isConfigured: () => isSupabaseConfigured,

  async register(fullName: string, email: string, phone: string, password: string): Promise<{ user: any; profile: Profile | null; error: string | null; needsVerification?: boolean }> {
    ensureConfigured();
    try {
      const targetRedirectUrl = `${window.location.origin}/auth`;
      console.log('[Supabase Auth] Initiating registration for email:', email);
      console.log('[Supabase Auth] Computed emailRedirectTo URL:', targetRedirectUrl);
      console.log('[Supabase Auth] REQUIRED SETUP CHECK: Ensure that this exact URL (or matching wildcards like http://localhost:3000/** or https://*.vercel.app/**) is added to your Supabase Project "Redirect URLs" under Authentication -> URL Configuration. Also verify that the Site URL matches your production domain.');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: targetRedirectUrl,
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });
      
      if (error) {
        console.error('[Supabase Auth ERROR during sign-up]:', error);
        console.error('[Supabase Auth ERROR Code]:', error.status || 'unknown');
        console.error('[Supabase Auth ERROR Message]:', error.message);
        
        // Troubleshooting diagnostic feedback for common Supabase email delivery issues
        if (error.message?.toLowerCase().includes('rate limit') || error.status === 429) {
          console.error('[Supabase Auth Diagnostician]: You have hit Supabase\'s default built-in SMTP rate limit of 3 emails/hour. To resolve this and enable unrestricted email delivery, please configure a custom SMTP service (SendGrid, Resend, Mailgun, Postmark, AWS SES, etc.) under Authentication -> Providers -> Email -> SMTP Settings in your Supabase Project Dashboard.');
        } else if (error.message?.toLowerCase().includes('smtp') || error.message?.toLowerCase().includes('mail') || error.message?.toLowerCase().includes('deliver')) {
          console.error('[Supabase Auth Diagnostician]: There is an active SMTP configuration error in your Supabase settings. Please verify your custom SMTP host, port, authentication credentials, and sender email under Authentication -> Providers -> Email -> SMTP Settings in your Supabase Dashboard.');
        } else {
          console.error('[Supabase Auth Diagnostician]: Please verify that "Confirm email" is ENABLED under Authentication -> Providers -> Email -> "Confirm email" in the Supabase Dashboard, and that your email provider credentials are fully active.');
        }
        throw error;
      }
      
      console.log('[Supabase Auth] Registration call successful. Returned data:', {
        userId: data.user?.id,
        userEmail: data.user?.email,
        emailConfirmedAt: data.user?.email_confirmed_at,
        sessionExists: Boolean(data.session)
      });

      let profile: Profile | null = null;
      const sessionActive = data.session !== null;
      
      if (data.user && sessionActive) {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (!profErr && profData) {
          profile = profData;
        }
      }

      const needsVerification = !sessionActive || !data.user?.email_confirmed_at;
      if (needsVerification) {
        console.log('[Supabase Auth] User needs verification. A confirmation email was requested to be sent from Supabase with redirect URL:', targetRedirectUrl);
      } else {
        console.log('[Supabase Auth] No verification needed or user already verified immediately.');
      }

      return { user: data.user, profile, error: null, needsVerification };
    } catch (err: any) {
      console.error('[Supabase Auth] Caught unexpected exception in authService.register:', err);
      return { user: null, profile: null, error: err.message || 'Signup failed' };
    }
  },

  async login(email: string, password: string): Promise<{ user: any; profile: Profile | null; error: string | null; isNotVerified?: boolean }> {
    ensureConfigured();
    try {
      console.log('[Supabase Auth] Attempting sign-in for email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[Supabase Auth ERROR during login]:', error);
        console.error('[Supabase Auth ERROR Code]:', error.status || 'unknown');
        console.error('[Supabase Auth ERROR Message]:', error.message);

        const isUnconfirmed = error.message.toLowerCase().includes('confirm') || 
                              error.message.toLowerCase().includes('verify') ||
                              (error.status === 400 && error.message.toLowerCase().includes('not confirmed'));
        
        if (isUnconfirmed) {
          console.warn('[Supabase Auth WARNING]: Sign-in failed because the user email has not been verified yet.');
          return { 
            user: null, 
            profile: null, 
            error: 'Please verify your email before logging in.', 
            isNotVerified: true 
          };
        }
        throw error;
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.warn('[Supabase Auth WARNING]: Signed-in user lacks an email confirmation timestamp. Logging out and enforcing verification screen.');
        await supabase.auth.signOut();
        return { 
          user: null, 
          profile: null, 
          error: 'Please verify your email before logging in.', 
          isNotVerified: true 
        };
      }

      console.log('[Supabase Auth] Login successful. User ID:', data.user?.id);

      let profile: Profile | null = null;
      if (data.user) {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profErr) {
          console.error('[Supabase Auth ERROR loading profile]:', profErr);
          throw profErr;
        }
        profile = profData;

        // Auto-upgrade admin emails to admin role in database
        if (isAdminEmail(email) && profile && profile.role !== 'admin') {
          console.log('[Supabase Auth] Auto-upgrading admin email to admin role:', email);
          const { data: updatedProf } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', data.user.id)
            .select()
            .single();
          if (updatedProf) {
            profile = updatedProf;
          }
        }
      }

      return { user: data.user, profile, error: null };
    } catch (err: any) {
      console.error('[Supabase Auth] Caught unexpected exception in authService.login:', err);
      const errMsg = err.message || 'Login failed';
      const isUnconfirmed = errMsg.toLowerCase().includes('confirm') || 
                            errMsg.toLowerCase().includes('verify');
      
      return { 
        user: null, 
        profile: null, 
        error: isUnconfirmed ? 'Please verify your email before logging in.' : errMsg, 
        isNotVerified: isUnconfirmed 
      };
    }
  },

  async logout(): Promise<{ error: string | null }> {
    ensureConfigured();
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    ensureConfigured();
    if (!isUUID(userId)) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;

    if (data && data.role !== 'admin') {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email && isAdminEmail(userData.user.email)) {
        const { data: updatedData } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select()
          .single();
        if (updatedData) {
          return updatedData;
        }
      }
    }

    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; error: string | null }> {
    ensureConfigured();
    if (!isUUID(userId)) {
      return { profile: null, error: 'Invalid user ID format.' };
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return { profile: data, error: null };
    } catch (err: any) {
      return { profile: null, error: err.message || 'Database update error' };
    }
  },

  async changeRole(userId: string, role: 'customer' | 'admin'): Promise<Profile | null> {
    const res = await this.updateProfile(userId, { role });
    if (res.error) throw new Error(res.error);
    return res.profile;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    ensureConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { success: !error, error: error ? error.message : null };
  },

  async resetPassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
    ensureConfigured();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error: error ? error.message : null };
  },

  async resendVerificationEmail(email: string): Promise<{ success: boolean; error: string | null }> {
    ensureConfigured();
    try {
      const targetRedirectUrl = `${window.location.origin}/auth`;
      console.log('[Supabase Auth] Initiating verification email resend for email:', email);
      console.log('[Supabase Auth] Computed emailRedirectTo URL:', targetRedirectUrl);
      console.log('[Supabase Auth] REQUIRED SETUP CHECK: Ensure that this exact URL (or matching wildcards like http://localhost:3000/** or https://*.vercel.app/**) is added to your Supabase Project "Redirect URLs" under Authentication -> URL Configuration. Also verify that the Site URL matches your production domain.');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: targetRedirectUrl,
        },
      });

      if (error) {
        console.error('[Supabase Auth ERROR during resend]:', error);
        console.error('[Supabase Auth ERROR Code]:', error.status || 'unknown');
        console.error('[Supabase Auth ERROR Message]:', error.message);
        
        // Troubleshooting diagnostic feedback for common Supabase email delivery issues
        if (error.message?.toLowerCase().includes('rate limit') || error.status === 429) {
          console.error('[Supabase Auth Diagnostician]: You have hit Supabase\'s default built-in SMTP rate limit of 3 emails/hour. To resolve this and enable unrestricted email delivery, please configure a custom SMTP service (SendGrid, Resend, Mailgun, Postmark, AWS SES, etc.) under Authentication -> Providers -> Email -> SMTP Settings in your Supabase Project Dashboard.');
        } else if (error.message?.toLowerCase().includes('smtp') || error.message?.toLowerCase().includes('mail') || error.message?.toLowerCase().includes('deliver')) {
          console.error('[Supabase Auth Diagnostician]: There is an active SMTP configuration error in your Supabase settings. Please verify your custom SMTP host, port, authentication credentials, and sender email under Authentication -> Providers -> Email -> SMTP Settings in your Supabase Dashboard.');
        } else {
          console.error('[Supabase Auth Diagnostician]: Please verify that "Confirm email" is ENABLED under Authentication -> Providers -> Email -> "Confirm email" in the Supabase Dashboard, and that your email provider credentials are fully active.');
        }
        return { success: false, error: error.message };
      }

      console.log('[Supabase Auth] Verification email resend call returned success.');
      return { success: true, error: null };
    } catch (err: any) {
      console.error('[Supabase Auth] Caught unexpected exception in authService.resendVerificationEmail:', err);
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  }
};

// ==========================================
// 2. PRODUCT SERVICES
// ==========================================

const getLocalDeletedIds = (): string[] => {
  try {
    const stored = localStorage.getItem('craftkalash_deleted_products');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getLocalAddedProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem('craftkalash_added_products');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getLocalUpdatedProducts = (): Record<string, Partial<Product>> => {
  try {
    const stored = localStorage.getItem('craftkalash_updated_products');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    const reverseMap: Record<string, string> = {
      '11111111-1111-1111-1111-111111111111': 'infant-toddler',
      '22222222-2222-2222-2222-222222222222': 'imaginary-play',
      '33333333-3333-3333-3333-333333333333': 'puzzles-blocks',
      '44444444-4444-4444-4444-444444444444': 'vehicles-motion'
    };

    const getCategorySlug = (p: any): string => {
      if (p.category_id && reverseMap[p.category_id]) {
        return reverseMap[p.category_id];
      }
      if (p.category && isUUID(p.category)) {
        return reverseMap[p.category] || 'puzzles-blocks';
      }
      if (p.categories) {
        let slug = '';
        if (Array.isArray(p.categories)) {
          slug = p.categories[0]?.slug || p.categories[0]?.id || '';
        } else if (typeof p.categories === 'object') {
          slug = p.categories.slug || p.categories.id || '';
        }
        if (slug) {
          if (isUUID(slug)) {
            return reverseMap[slug] || 'puzzles-blocks';
          }
          return slug;
        }
      }
      if (p.category && typeof p.category === 'string') {
        return p.category;
      }
      return 'puzzles-blocks';
    };

    const enrichAndMerge = (dbProducts: any[]): Product[] => {
      const mappedDb = dbProducts.map((p: any) => {
        const catSlug = getCategorySlug(p);
        const dbNameLower = p.name.toLowerCase();

        // Find a matching local product
        const matchedLocal = PRODUCTS.find(lp => {
          const localNameLower = lp.name.toLowerCase();
          return (
            localNameLower.includes(dbNameLower) ||
            dbNameLower.includes(localNameLower) ||
            (dbNameLower.includes('walker') && localNameLower.includes('walker') && (
              (dbNameLower.includes('2') && localNameLower.includes('pastel')) ||
              (dbNameLower.includes('3') && localNameLower.includes('sienna')) ||
              (dbNameLower.includes('4') && localNameLower.includes('forest')) ||
              (!dbNameLower.match(/[234]/) && localNameLower.includes('classic'))
            ))
          );
        });

        if (matchedLocal) {
          return {
            ...p,
            name: matchedLocal.name,
            category: catSlug,
            price: p.price ?? matchedLocal.price,
            originalPrice: p.originalPrice ?? matchedLocal.originalPrice,
            description: matchedLocal.description,
            details: matchedLocal.details || [],
            materials: matchedLocal.materials || [],
            dimensions: matchedLocal.dimensions || p.dimensions,
            ageRange: matchedLocal.ageRange || p.ageRange,
            featured: matchedLocal.featured ?? p.featured,
            bestSeller: matchedLocal.bestSeller ?? p.bestSeller,
            isNew: matchedLocal.isNew ?? p.isNew,
            sku: p.sku || matchedLocal.sku,
            rating: p.rating ?? matchedLocal.rating ?? 4.8,
            reviewsCount: p.reviewsCount ?? matchedLocal.reviewsCount ?? 12
          };
        }

        return {
          ...p,
          category: catSlug,
          rating: p.rating ?? 4.8,
          reviewsCount: p.reviewsCount ?? 12
        };
      });

      // Find local products that aren't in the database to append them
      const appendedProducts = [...mappedDb];
      for (const lp of PRODUCTS) {
        const alreadyInDb = mappedDb.some(dp => {
          const dbNameLower = dp.name.toLowerCase();
          const localNameLower = lp.name.toLowerCase();
          return (
            dbNameLower.includes(localNameLower) ||
            localNameLower.includes(dbNameLower) ||
            (dbNameLower.includes('walker') && localNameLower.includes('walker') && (
              (dbNameLower.includes('2') && localNameLower.includes('pastel')) ||
              (dbNameLower.includes('3') && localNameLower.includes('sienna')) ||
              (dbNameLower.includes('4') && localNameLower.includes('forest')) ||
              (!dbNameLower.match(/[234]/) && localNameLower.includes('classic'))
            ))
          );
        });

        if (!alreadyInDb) {
          appendedProducts.push(lp);
        }
      }

      return appendedProducts;
    };

    let baseList: Product[] = [];

    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('status', 'published');
      
      if (error) throw error;
      baseList = enrichAndMerge(data || []);
    } catch (err: any) {
      console.warn('Fetch products with categories join failed, retrying direct select:', err);
      try {
        ensureConfigured();
        const { data: directData, error: directError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'published');

        if (directError) {
          throw directError;
        }
        baseList = enrichAndMerge(directData || []);
      } catch (innerErr: any) {
        console.warn('All database product fetches failed, returning offline local PRODUCTS dataset:', innerErr);
        baseList = [...PRODUCTS];
      }
    }

    // Merge with local offline/mock storage states
    const localAdded = getLocalAddedProducts();
    const localDeleted = getLocalDeletedIds();
    const localUpdated = getLocalUpdatedProducts();

    let mergedList = [...baseList];

    // 1. Add locally added products if not already there
    for (const lp of localAdded) {
      if (!mergedList.some(p => p.id === lp.id)) {
        mergedList.push(lp);
      }
    }

    // 2. Filter out deleted products
    mergedList = mergedList.filter(p => !localDeleted.includes(p.id));

    // 3. Apply updated fields
    mergedList = mergedList.map(p => {
      if (localUpdated[p.id]) {
        return {
          ...p,
          ...localUpdated[p.id]
        };
      }
      return p;
    });

    return mergedList;
  },

  async createProduct(product: Partial<Product>): Promise<{ data: Product | null; error: string | null }> {
    const localId = product.id || `prod-${Math.random().toString(36).substring(2, 9)}`;
    const name = product.name || 'product';
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = product.slug || `${baseSlug}-${randomSuffix}`;
    const catSlug = product.category || 'puzzles-blocks';
    const category_id = CATEGORY_SLUG_TO_ID[catSlug] || null;

    const newProduct: Product = {
      id: localId,
      name,
      slug,
      category: catSlug,
      category_id: category_id || undefined,
      price: product.price ?? 100,
      originalPrice: product.originalPrice,
      rating: product.rating ?? 4.8,
      reviewsCount: product.reviewsCount ?? 12,
      image: product.image || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600',
      description: product.description || '',
      details: product.details || [],
      materials: product.materials || [],
      dimensions: product.dimensions || '',
      ageRange: product.ageRange || '',
      featured: product.featured || false,
      bestSeller: product.bestSeller || false,
      isNew: product.isNew || true,
      sku: product.sku || `CK-${Math.floor(100000 + Math.random() * 900000)}`,
      inStock: product.inStock !== false,
      stock: product.stock ?? 12
    };

    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          slug,
          category_id,
          status: 'published'
        })
        .select()
        .single();
      if (error) throw error;

      // Also append to localAdded list to keep lists consistent
      const localAdded = getLocalAddedProducts();
      localAdded.push(data || newProduct);
      localStorage.setItem('craftkalash_added_products', JSON.stringify(localAdded));

      return { data: data || newProduct, error: null };
    } catch (err: any) {
      console.warn('Database createProduct failed, falling back to local action:', err);

      const localAdded = getLocalAddedProducts();
      localAdded.push(newProduct);
      localStorage.setItem('craftkalash_added_products', JSON.stringify(localAdded));

      return { data: newProduct, error: null };
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{ data: Product | null; error: string | null }> {
    try {
      ensureConfigured();
      const payload: any = { ...updates };
      if (updates.category) {
        payload.category_id = CATEGORY_SLUG_TO_ID[updates.category] || null;
      }
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      const localUpdated = getLocalUpdatedProducts();
      localUpdated[id] = {
        ...(localUpdated[id] || {}),
        ...updates
      };
      localStorage.setItem('craftkalash_updated_products', JSON.stringify(localUpdated));

      return { data: data || null, error: null };
    } catch (err: any) {
      console.warn('Database updateProduct failed, falling back to local action:', err);

      const localUpdated = getLocalUpdatedProducts();
      localUpdated[id] = {
        ...(localUpdated[id] || {}),
        ...updates
      };
      localStorage.setItem('craftkalash_updated_products', JSON.stringify(localUpdated));

      const allProducts = await this.getProducts();
      const found = allProducts.find(p => p.id === id);

      return { data: found || null, error: null };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
    // Always mark ID as deleted locally to prevent it from ever displaying in UI
    const localDeleted = getLocalDeletedIds();
    if (!localDeleted.includes(id)) {
      localDeleted.push(id);
      localStorage.setItem('craftkalash_deleted_products', JSON.stringify(localDeleted));
    }

    try {
      ensureConfigured();
      const { error } = await supabase.from('products').delete().eq('id', id);
      return { success: !error, error: error ? error.message : null };
    } catch (err: any) {
      console.warn('Database deleteProduct failed, falling back to local action:', err);
      return { success: true, error: null };
    }
  }
};

// ==========================================
// 3. CATEGORIES SERVICES
// ==========================================

const CATEGORY_SLUG_TO_ID: Record<string, string> = {
  'infant-toddler': '11111111-1111-1111-1111-111111111111',
  'imaginary-play': '22222222-2222-2222-2222-222222222222',
  'puzzles-blocks': '33333333-3333-3333-3333-333333333333',
  'vehicles-motion': '44444444-4444-4444-4444-444444444444',
};

const getLocalAddedCategories = (): Category[] => {
  try {
    const stored = localStorage.getItem('craftkalash_added_categories');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getLocalUpdatedCategories = (): Record<string, Partial<Category>> => {
  try {
    const stored = localStorage.getItem('craftkalash_updated_categories');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getLocalDeletedCategories = (): string[] => {
  try {
    const stored = localStorage.getItem('craftkalash_deleted_categories');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    let baseList: Category[] = [];
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (error) throw error;
      baseList = data || [];
    } catch (err) {
      console.warn('Database categories fetch failed, falling back to local categories:', err);
      baseList = [...CATEGORIES];
    }

    // Merge with local offline/mock storage states
    const localAdded = getLocalAddedCategories();
    const localUpdated = getLocalUpdatedCategories();
    const localDeleted = getLocalDeletedCategories();

    let mergedList = [...baseList];

    // 1. Add locally added categories if not already there
    for (const lc of localAdded) {
      if (!mergedList.some(c => c.id === lc.id)) {
        mergedList.push(lc);
      }
    }

    // 2. Apply updated fields
    mergedList = mergedList.map(c => {
      if (localUpdated[c.id]) {
        return {
          ...c,
          ...localUpdated[c.id]
        };
      }
      return c;
    });

    // 3. Filter out deleted categories
    mergedList = mergedList.filter(c => !localDeleted.includes(c.id));

    return mergedList;
  },

  async createCategory(category: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    const localId = category.id || category.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${Math.random().toString(36).substring(2, 9)}`;
    const newCategory: Category = {
      id: localId,
      name: category.name || 'New Category',
      description: category.description || '',
      image: category.image || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=300',
      slug: category.slug || localId
    };

    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.warn('Database createCategory failed, falling back to local action:', err);

      const localAdded = getLocalAddedCategories();
      localAdded.push(newCategory);
      localStorage.setItem('craftkalash_added_categories', JSON.stringify(localAdded));

      return { data: newCategory, error: null };
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.warn('Database updateCategory failed, falling back to local action:', err);

      const localUpdated = getLocalUpdatedCategories();
      localUpdated[id] = {
        ...(localUpdated[id] || {}),
        ...updates
      };
      localStorage.setItem('craftkalash_updated_categories', JSON.stringify(localUpdated));

      return { data: null, error: null };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      ensureConfigured();
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Database deleteCategory failed, falling back to local action:', err);

      const localDeleted = getLocalDeletedCategories();
      if (!localDeleted.includes(id)) {
        localDeleted.push(id);
        localStorage.setItem('craftkalash_deleted_categories', JSON.stringify(localDeleted));
      }

      // Also clean up localAdded if it was created locally
      let localAdded = getLocalAddedCategories();
      localAdded = localAdded.filter(c => c.id !== id);
      localStorage.setItem('craftkalash_added_categories', JSON.stringify(localAdded));

      // Clean up localUpdated
      const localUpdated = getLocalUpdatedCategories();
      delete localUpdated[id];
      localStorage.setItem('craftkalash_updated_categories', JSON.stringify(localUpdated));

      return { success: true, error: null };
    }
  }
};

// ==========================================
// 4. WISHLIST SERVICES
// ==========================================

export const wishlistService = {
  async getWishlist(userId: string): Promise<Product[]> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return [];
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((w: any) => w.products).filter(Boolean);
    } catch (err) {
      console.warn('Database wishlist fetch failed, returning local storage wishlist:', err);
      try {
        const stored = localStorage.getItem('craftkalash_wishlist');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  async toggleWishlist(userId: string, product: Product): Promise<Product[]> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) throw new Error('Invalid user ID.');
      
      const { data: exists, error: checkError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (exists) {
        const { error: deleteError } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', product.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: product.id });
        if (insertError) throw insertError;
      }
      return this.getWishlist(userId);
    } catch (err) {
      console.warn('Database wishlist toggle failed, falling back to local storage:', err);
      try {
        const stored = localStorage.getItem('craftkalash_wishlist');
        let list: Product[] = stored ? JSON.parse(stored) : [];
        if (list.some(p => p.id === product.id)) {
          list = list.filter(p => p.id !== product.id);
        } else {
          list.push(product);
        }
        localStorage.setItem('craftkalash_wishlist', JSON.stringify(list));
        return list;
      } catch {
        return [];
      }
    }
  }
};

// ==========================================
// 5. REVIEWS SERVICES
// ==========================================

export const reviewsService = {
  async getReviews(productId: string): Promise<Review[]> {
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', productId);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        userName: r.profiles?.full_name || 'Verified Family',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        comment: r.review,
        verified: true
      }));
    } catch (err) {
      console.warn('Database reviews fetch failed, falling back to local static reviews:', err);
      return REVIEWS;
    }
  },

  async addReview(productId: string, userId: string, userName: string, rating: number, comment: string): Promise<Review> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) throw new Error('Invalid user session for reviews.');
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          review: comment
        });
      if (error) throw error;
    } catch (err) {
      console.warn('Database review insertion failed, creating client-only review record:', err);
    }
    
    return {
      id: `rev-${Date.now()}`,
      userName,
      rating,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      comment,
      verified: true
    };
  }
};

// ==========================================
// 5.5. CART SERVICES
// ==========================================

export const cartService = {
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return [];
      
      let { data: cartData, error: cartErr } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (cartErr) throw cartErr;
      
      if (!cartData) {
        const { data: newCart, error: createErr } = await supabase
          .from('cart')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (createErr) throw createErr;
        cartData = newCart;
      }
      
      if (!cartData) return [];
      
      const { data: items, error: itemsErr } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('cart_id', cartData.id);
        
      if (itemsErr) throw itemsErr;
      
      return (items || []).map((item: any) => ({
        product: {
          ...item.products,
          category: item.products?.category || 'puzzles-blocks',
          rating: item.products?.rating ?? 4.8,
          reviewsCount: item.products?.reviewsCount ?? 12
        },
        quantity: item.quantity
      })).filter(item => item.product && item.product.id);
    } catch (err) {
      console.warn('Database cart fetch failed, falling back to local storage:', err);
      try {
        const stored = localStorage.getItem('craftkalash_cart');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return;
      
      let { data: cartData, error: cartErr } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (cartErr) throw cartErr;
        
      if (!cartData) {
        const { data: newCart, error: createErr } = await supabase
          .from('cart')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (createErr) throw createErr;
        cartData = newCart;
      }
      
      if (!cartData) return;
      
      const { data: existing, error: existErr } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartData.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (existErr) throw existErr;
        
      if (existing) {
        const { error: updateErr } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartData.id,
            product_id: productId,
            quantity
          });
        if (insertErr) throw insertErr;
      }
    } catch (err) {
      console.warn('Database addToCart failed, handled via client state:', err);
    }
  },

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return;
      
      const { data: cartData, error: cartErr } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (cartErr) throw cartErr;
      if (!cartData) return;
      
      if (quantity <= 0) {
        const { error: deleteErr } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartData.id)
          .eq('product_id', productId);
        if (deleteErr) throw deleteErr;
      } else {
        const { error: updateErr } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('cart_id', cartData.id)
          .eq('product_id', productId);
        if (updateErr) throw updateErr;
      }
    } catch (err) {
      console.warn('Database updateQuantity failed, handled via client state:', err);
    }
  },

  async removeFromCart(userId: string, productId: string): Promise<void> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return;
      
      const { data: cartData, error: cartErr } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (cartErr) throw cartErr;
      if (!cartData) return;
      
      const { error: deleteErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartData.id)
        .eq('product_id', productId);
      if (deleteErr) throw deleteErr;
    } catch (err) {
      console.warn('Database removeFromCart failed, handled via client state:', err);
    }
  },

  async clearCart(userId: string): Promise<void> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return;
      
      const { data: cartData, error: cartErr } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (cartErr) throw cartErr;
      if (!cartData) return;
      
      const { error: deleteErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartData.id);
      if (deleteErr) throw deleteErr;
    } catch (err) {
      console.warn('Database clearCart failed, handled via client state:', err);
    }
  }
};

// ==========================================
// 6. ADDRESS & ORDER SERVICES
// ==========================================

export const addressService = {
  async getAddresses(userId: string): Promise<Address[]> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Database addresses fetch failed, falling back to local storage address registry:', err);
      try {
        const stored = localStorage.getItem('craftkalash_addresses');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  async saveAddress(userId: string, address: Omit<Address, 'id' | 'user_id'>): Promise<Address> {
    const localId = `addr-${Math.random().toString(36).substring(2, 9)}`;
    const newAddress = {
      id: localId,
      user_id: userId,
      ...address
    };

    try {
      ensureConfigured();
      if (!isUUID(userId)) throw new Error('Invalid user ID.');
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          full_name: address.full_name,
          phone: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
          default_address: address.default_address
        })
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Database saveAddress failed, storing address locally instead:', err);
    }

    try {
      const stored = localStorage.getItem('craftkalash_addresses');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newAddress);
      localStorage.setItem('craftkalash_addresses', JSON.stringify(list));
    } catch {}

    return newAddress as Address;
  }
};

export const orderService = {
  async getOrders(userId: string): Promise<Order[]> {
    try {
      ensureConfigured();
      if (!isUUID(userId)) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (*),
          addresses (*),
          order_items (
            *,
            products (
              name,
              image
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((ord: any) => {
        let paymentMethod = ord.payment_method;
        let utr = '';
        let screenshotUrl = '';
        let rzpOrderId = '';
        let rzpPaymentId = '';
        let rzpSignature = '';
        let shippingAddress = ord.addresses;
        
        if (ord.payment_method && ord.payment_method.startsWith('{')) {
          try {
            const parsed = JSON.parse(ord.payment_method);
            paymentMethod = parsed.method || 'UPI';
            utr = parsed.utr || '';
            screenshotUrl = parsed.screenshotUrl || '';
            rzpOrderId = parsed.razorpay_order_id || '';
            rzpPaymentId = parsed.razorpay_payment_id || '';
            rzpSignature = parsed.razorpay_signature || '';
            if (parsed.shippingAddress) {
              shippingAddress = parsed.shippingAddress;
            }
          } catch (e) {
            console.error('Error parsing payment method JSON:', e);
          }
        }

        return {
          ...ord,
          payment_method: paymentMethod,
          utr,
          screenshot_url: screenshotUrl,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: rzpSignature,
          shippingAddress,
          customer_profile: ord.profiles,
          items: (ord.order_items || []).map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            productName: item.products?.name || 'Wooden Heirloom',
            productImage: item.products?.image || ''
          }))
        };
      });
    } catch (err) {
      console.warn('Database getOrders failed, returning local storage fallback orders list:', err);
      try {
        const stored = localStorage.getItem('craftkalash_orders');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (*),
          addresses (*),
          order_items (
            *,
            products (
              name,
              image
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((ord: any) => {
        let paymentMethod = ord.payment_method;
        let utr = '';
        let screenshotUrl = '';
        let rzpOrderId = '';
        let rzpPaymentId = '';
        let rzpSignature = '';
        let shippingAddress = ord.addresses;
        
        if (ord.payment_method && ord.payment_method.startsWith('{')) {
          try {
            const parsed = JSON.parse(ord.payment_method);
            paymentMethod = parsed.method || 'UPI';
            utr = parsed.utr || '';
            screenshotUrl = parsed.screenshotUrl || '';
            rzpOrderId = parsed.razorpay_order_id || '';
            rzpPaymentId = parsed.razorpay_payment_id || '';
            rzpSignature = parsed.razorpay_signature || '';
            if (parsed.shippingAddress) {
              shippingAddress = parsed.shippingAddress;
            }
          } catch (e) {
            console.error('Error parsing payment method JSON:', e);
          }
        }

        return {
          ...ord,
          payment_method: paymentMethod,
          utr,
          screenshot_url: screenshotUrl,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: rzpSignature,
          shippingAddress,
          customer_profile: ord.profiles,
          items: (ord.order_items || []).map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            productName: item.products?.name || 'Wooden Heirloom',
            productImage: item.products?.image || ''
          }))
        };
      });
    } catch (err) {
      console.warn('Database getAllOrders failed, returning local storage fallback orders registry:', err);
      try {
        const stored = localStorage.getItem('craftkalash_orders');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  async createOrder(
    userId: string,
    address: Address,
    cartItems: { product: Product; quantity: number }[],
    subtotal: number,
    discount: number,
    shipping: number,
    total: number,
    paymentMethod: string,
    utr?: string,
    screenshotUrl?: string,
    razorpayDetails?: {
      orderId: string;
      paymentId: string;
      signature: string;
    }
  ): Promise<Order> {
    const orderNumber = `CK-${Math.floor(100000 + Math.random() * 900000)}`;
    const localId = `order-${Math.random().toString(36).substring(2, 9)}`;

    let dbPaymentMethod = '';
    const paymentObj: any = {
      method: paymentMethod,
      shippingAddress: address
    };
    if (paymentMethod === 'RAZORPAY' && razorpayDetails) {
      paymentObj.razorpay_order_id = razorpayDetails.orderId;
      paymentObj.razorpay_payment_id = razorpayDetails.paymentId;
      paymentObj.razorpay_signature = razorpayDetails.signature;
    } else if (paymentMethod === 'UPI') {
      paymentObj.utr = utr || '';
      paymentObj.screenshotUrl = screenshotUrl || '';
    }
    dbPaymentMethod = JSON.stringify(paymentObj);

    const dbPaymentStatus = paymentMethod === 'RAZORPAY' ? 'paid' : 'pending';

    const localOrder: Order = {
      id: localId,
      user_id: userId,
      address_id: address.id,
      order_number: orderNumber,
      subtotal,
      discount,
      shipping,
      total,
      payment_method: paymentMethod,
      payment_status: dbPaymentStatus as any,
      order_status: 'pending',
      created_at: new Date().toISOString(),
      items: cartItems.map(item => ({
        id: `item-${Math.random()}`,
        order_id: localId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        productName: item.product.name,
        productImage: item.product.image
      })),
      shippingAddress: address,
      utr,
      screenshot_url: screenshotUrl,
      razorpay_order_id: razorpayDetails?.orderId,
      razorpay_payment_id: razorpayDetails?.paymentId,
      razorpay_signature: razorpayDetails?.signature
    };

    try {
      ensureConfigured();
      if (!isUUID(userId)) throw new Error('Invalid user ID.');
      if (!isUUID(address.id)) throw new Error('Invalid address ID.');

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          address_id: address.id,
          order_number: orderNumber,
          subtotal,
          discount,
          shipping,
          total,
          payment_method: dbPaymentMethod,
          payment_status: dbPaymentStatus,
          order_status: 'pending'
        })
        .select()
        .single();

      if (orderErr) throw orderErr;
      if (!orderData) throw new Error('Failed to save order in database.');

      // Save Order Items
      const itemsToInsert = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      const newOrder: Order = {
        id: orderData.id,
        user_id: userId,
        address_id: address.id,
        order_number: orderNumber,
        subtotal,
        discount,
        shipping,
        total,
        payment_method: paymentMethod,
        payment_status: orderData.payment_status as any,
        order_status: orderData.order_status as any,
        created_at: orderData.created_at || new Date().toISOString(),
        items: cartItems.map(item => ({
          id: `item-${Math.random()}`,
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          productName: item.product.name,
          productImage: item.product.image
        })),
        shippingAddress: address,
        utr,
        screenshot_url: screenshotUrl,
        razorpay_order_id: razorpayDetails?.orderId,
        razorpay_payment_id: razorpayDetails?.paymentId,
        razorpay_signature: razorpayDetails?.signature
      };

      try {
        const stored = localStorage.getItem('craftkalash_orders');
        const list = stored ? JSON.parse(stored) : [];
        list.push(newOrder);
        localStorage.setItem('craftkalash_orders', JSON.stringify(list));
      } catch {}

      return newOrder;
    } catch (err) {
      console.warn('Database createOrder failed, saving order locally in fallback storage:', err);
      try {
        const stored = localStorage.getItem('craftkalash_orders');
        const list = stored ? JSON.parse(stored) : [];
        list.push(localOrder);
        localStorage.setItem('craftkalash_orders', JSON.stringify(list));
      } catch {}
      return localOrder;
    }
  },

  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<boolean> {
    try {
      ensureConfigured();
      if (!isUUID(orderId)) return false;
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Database updateOrderStatus failed, updating local copy:', err);
      try {
        const stored = localStorage.getItem('craftkalash_orders');
        if (stored) {
          const list: Order[] = JSON.parse(stored);
          const found = list.find(o => o.id === orderId);
          if (found) {
            found.order_status = status;
            localStorage.setItem('craftkalash_orders', JSON.stringify(list));
            return true;
          }
        }
      } catch {}
      return false;
    }
  },

  async updatePaymentStatus(orderId: string, status: 'pending' | 'paid' | 'failed' | 'refunded' | 'Pending COD' | 'Payment Verification Pending'): Promise<boolean> {
    try {
      ensureConfigured();
      if (!isUUID(orderId)) return false;
      let dbStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending';
      if (status === 'paid') dbStatus = 'paid';
      else if (status === 'failed') dbStatus = 'failed';
      else if (status === 'refunded') dbStatus = 'refunded';
      else dbStatus = 'pending';

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: dbStatus })
        .eq('id', orderId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Database updatePaymentStatus failed, updating local copy:', err);
      try {
        const stored = localStorage.getItem('craftkalash_orders');
        if (stored) {
          const list: Order[] = JSON.parse(stored);
          const found = list.find(o => o.id === orderId);
          if (found) {
            found.payment_status = status;
            localStorage.setItem('craftkalash_orders', JSON.stringify(list));
            return true;
          }
        }
      } catch {}
      return false;
    }
  }
};

// ==========================================
// 7. COUPONS & NEWSLETTER SERVICES
// ==========================================

const DEFAULT_COUPONS: Coupon[] = [
  { id: 'c1', code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, active: true, expiry: '2028-12-31T23:59:59.000Z' },
  { id: 'c2', code: 'WOODLOVE20', discount_type: 'fixed', discount_value: 20, active: true, expiry: '2028-12-31T23:59:59.000Z' },
  { id: 'c3', code: 'ARTISAN15', discount_type: 'percentage', discount_value: 15, active: true, expiry: '2028-12-31T23:59:59.000Z' },
  { id: 'festive20', code: 'FESTIVE20', discount_type: 'percentage', discount_value: 20, active: true, expiry: '2028-12-31T23:59:59.000Z' }
];

const getLocalCoupons = (): Coupon[] => {
  try {
    const stored = localStorage.getItem('craftkalash_coupons');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('craftkalash_coupons', JSON.stringify(DEFAULT_COUPONS));
    return DEFAULT_COUPONS;
  } catch {
    return DEFAULT_COUPONS;
  }
};

const saveLocalCoupons = (coupons: Coupon[]) => {
  try {
    localStorage.setItem('craftkalash_coupons', JSON.stringify(coupons));
  } catch (err) {
    console.error('Failed to save local coupons:', err);
  }
};

export const couponsService = {
  async getCoupons(): Promise<Coupon[]> {
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('coupons')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Database getCoupons failed, returning local fallback coupons:', err);
      return getLocalCoupons();
    }
  },

  async createCoupon(coupon: Omit<Coupon, 'id'> & { id?: string }): Promise<Coupon | null> {
    const newCoupon: Coupon = {
      id: coupon.id || `coupon-${Date.now()}`,
      code: coupon.code.trim().toUpperCase(),
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      active: coupon.active ?? true,
      expiry: coupon.expiry
    };

    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...newCoupon,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Database createCoupon failed, saving locally:', err);
      const coupons = getLocalCoupons();
      const updated = [newCoupon, ...coupons];
      saveLocalCoupons(updated);
      return newCoupon;
    }
  },

  async toggleCouponActive(couponId: string): Promise<boolean> {
    try {
      ensureConfigured();
      if (!isUUID(couponId)) throw new Error('Not a valid DB ID');
      
      const { data: current, error: fetchErr } = await supabase
        .from('coupons')
        .select('active')
        .eq('id', couponId)
        .single();
      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from('coupons')
        .update({ active: !current.active })
        .eq('id', couponId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Database toggleCouponActive failed, toggling locally:', err);
      const coupons = getLocalCoupons();
      const updated = coupons.map(c => c.id === couponId ? { ...c, active: !c.active } : c);
      saveLocalCoupons(updated);
      return true;
    }
  },

  async validateCoupon(code: string): Promise<Coupon | null> {
    const cleanCode = code.trim().toUpperCase();
    try {
      ensureConfigured();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('active', true)
        .gt('expiry', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      
      const locals = getLocalCoupons();
      const match = locals.find(c => c.code === cleanCode && c.active && new Date(c.expiry) > new Date());
      return match || null;
    } catch (err) {
      console.warn('Database coupon validation failed, matching local fallback coupons:', err);
      const locals = getLocalCoupons();
      const match = locals.find(c => c.code === cleanCode && c.active && new Date(c.expiry) > new Date());
      return match || null;
    }
  }
};

export const newsletterService = {
  async subscribeNewsletter(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      ensureConfigured();
      const { error } = await supabase
        .from('newsletter')
        .insert({ email });
      return { success: !error, error: error ? error.message : null };
    } catch (err: any) {
      console.warn('Database newsletter subscription failed, returning fallback success:', err);
      return { success: true, error: null };
    }
  }
};

// Local storage helpers for Contact Messages fallback
const getLocalEnquiries = (): ContactMessage[] => {
  try {
    const raw = localStorage.getItem('craft_local_enquiries');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalEnquiries = (list: ContactMessage[]) => {
  try {
    localStorage.setItem('craft_local_enquiries', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local enquiries:', e);
  }
};

export const enquiriesService = {
  async getEnquiries(): Promise<ContactMessage[]> {
    try {
      const response = await fetch('/api/enquiries');
      if (!response.ok) throw new Error('Failed to fetch from API');
      const data = await response.json();
      return data || [];
    } catch (err) {
      console.warn('Database getEnquiries API failed, loading local fallback enquiries:', err);
      return getLocalEnquiries();
    }
  },

  async markAsRead(id: string, isRead: boolean): Promise<boolean> {
    try {
      const response = await fetch(`/api/enquiries/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: isRead })
      });
      if (!response.ok) throw new Error('Failed to update via API');
      return true;
    } catch (err) {
      console.warn('Database markAsRead API failed, updating local fallback:', err);
      const list = getLocalEnquiries();
      const updated = list.map(item => item.id === id ? { ...item, is_read: isRead } : item);
      saveLocalEnquiries(updated);
      return true;
    }
  },

  async deleteEnquiry(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete via API');
      return true;
    } catch (err) {
      console.warn('Database deleteEnquiry API failed, deleting locally:', err);
      const list = getLocalEnquiries();
      const updated = list.filter(item => item.id !== id);
      saveLocalEnquiries(updated);
      return true;
    }
  },

  async addLocalEnquiryFallback(message: Partial<ContactMessage>): Promise<void> {
    const list = getLocalEnquiries();
    const newEnquiry: ContactMessage = {
      id: message.id || `local-${Date.now()}`,
      name: message.name || '',
      email: message.email || '',
      phone: message.phone || '',
      subject: message.subject || '',
      message: message.message || '',
      ip_address: message.ip_address || '127.0.0.1',
      is_read: false,
      created_at: message.created_at || new Date().toISOString()
    };
    saveLocalEnquiries([newEnquiry, ...list]);
  }
};

