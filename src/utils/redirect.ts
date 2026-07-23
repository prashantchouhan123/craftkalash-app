/**
 * Utility to manage redirect URL state in sessionStorage for guest users
 * when performing actions (Wishlist, Buy Now, Checkout, Product Click, Protected Pages)
 * that require authentication.
 */

const REDIRECT_KEY = 'redirect_after_login';
const PRODUCT_KEY = 'selected_product_id';
const PRODUCT_DATA_KEY = 'selected_product_data';

export const saveRedirectUrl = (url?: string) => {
  try {
    const target = url || (window.location.pathname + window.location.search + window.location.hash);
    if (target && !target.startsWith('/auth') && !target.startsWith('/reset-password')) {
      sessionStorage.setItem(REDIRECT_KEY, target);
      console.log('[RedirectUtil] Saved redirect URL:', target);
    }
  } catch (err) {
    console.warn('[RedirectUtil] Could not save redirect URL:', err);
  }
};

export const getAndClearRedirectUrl = (): string | null => {
  try {
    const saved = sessionStorage.getItem(REDIRECT_KEY);
    if (saved) {
      sessionStorage.removeItem(REDIRECT_KEY);
      if (saved.startsWith('/') && !saved.startsWith('/auth') && !saved.startsWith('/reset-password')) {
        console.log('[RedirectUtil] Retrieved saved redirect URL:', saved);
        return saved;
      }
    }
  } catch (err) {
    console.warn('[RedirectUtil] Could not retrieve redirect URL:', err);
  }
  return null;
};

export const saveSelectedProduct = (product: { id: string | number; [key: string]: any } | null) => {
  try {
    if (product) {
      sessionStorage.setItem(PRODUCT_KEY, String(product.id));
      sessionStorage.setItem(PRODUCT_DATA_KEY, JSON.stringify(product));
    } else {
      sessionStorage.removeItem(PRODUCT_KEY);
      sessionStorage.removeItem(PRODUCT_DATA_KEY);
    }
  } catch (err) {
    console.warn('[RedirectUtil] Error saving selected product:', err);
  }
};

export const getSavedProduct = (): { id: string; data: any | null } | null => {
  try {
    const id = sessionStorage.getItem(PRODUCT_KEY);
    if (!id) return null;
    const raw = sessionStorage.getItem(PRODUCT_DATA_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return { id, data };
  } catch (err) {
    console.warn('[RedirectUtil] Error getting saved product:', err);
    return null;
  }
};

export const clearSavedProduct = () => {
  try {
    sessionStorage.removeItem(PRODUCT_KEY);
    sessionStorage.removeItem(PRODUCT_DATA_KEY);
  } catch (err) {
    console.warn('[RedirectUtil] Error clearing saved product:', err);
  }
};
