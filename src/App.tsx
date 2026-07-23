import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ToastContainer from './components/ToastContainer';
import QuickViewModal from './components/QuickViewModal';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import { Product } from './types';

// Global listener for Supabase Auth recovery events
function AuthRecoveryListener() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial check for explicit recovery tokens in URL hash or search
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const isExplicitRecoveryUrl =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('type=recovery_grant') ||
      search.includes('type=recovery_grant') ||
      hash.includes('error_description=') ||
      search.includes('error_description=');

    if (isExplicitRecoveryUrl && window.location.pathname !== '/reset-password') {
      console.log('[AuthRecoveryListener] Recovery link detected in URL. Navigating to /reset-password');
      navigate('/reset-password', { replace: true });
    }

    // 2. Subscribe to Supabase auth events (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('[AuthRecoveryListener] Supabase Auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AuthRecoveryListener] PASSWORD_RECOVERY event received. Navigating to /reset-password');
        navigate('/reset-password', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
}

function AppContent() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-brand-primary/20 bg-brand-bg/10 antialiased">
      <AuthRecoveryListener />
      <Navbar />
      
      {/* Drawer and overlay portals */}
      <CartDrawer />
      <WishlistDrawer />
      <ToastContainer />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home onQuickView={setQuickViewProduct} />} />
          <Route path="/shop" element={<Shop onQuickView={setQuickViewProduct} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cart" element={<Cart onQuickView={setQuickViewProduct} />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </main>

      <Footer />

      {/* Quick Specs modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onSwitchProduct={setQuickViewProduct}
      />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ShopProvider>
  );
}
