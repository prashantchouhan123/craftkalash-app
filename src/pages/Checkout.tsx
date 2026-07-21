import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  MapPin, 
  Truck, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag,
  Info,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Smartphone,
  Library,
  Briefcase,
  Upload,
  Trash2,
  QrCode
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { addressService } from '../services/supabaseService';

export default function Checkout() {
  const {
    cart,
    profile,
    getCartTotal,
    addToast,
    clearCart,
    placeOrder,
    updateRazorpayPayment,
    products
  } = useShop();

  const navigate = useNavigate();

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      addToast('Your cart is empty. Please add items before checking out.', 'info');
      navigate('/shop');
    }
  }, [cart.length]);

  // Steps: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1 FIELDS (Address details)
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [saveAddress, setSaveAddress] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(true);
  
  // Validation error state
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // STEP 2 FIELDS (Shipping tier)
  // 'standard' (FREE/9.99) | 'express' ($19.99) | 'premium' ($29.99)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'premium'>('standard');

  // STEP 3 FIELDS (Payment method)
  // 'COD' | 'RAZORPAY'
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('RAZORPAY');

  // Payment status states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync profile values if available
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);

      // Pre-fill last saved address if available (fallback or real)
      const loadSavedAddresses = async () => {
        try {
          const list = await addressService.getAddresses(profile.id);
          if (list.length > 0) {
            const def = list.find(a => a.default_address) || list[0];
            setAddress(def.address);
            setCity(def.city);
            setState(def.state);
            setPincode(def.pincode);
            setCountry(def.country);
            setFullName(def.full_name);
            setPhone(def.phone);
          }
        } catch (e) {
          console.warn('Address prefetch skipped');
        }
      };
      loadSavedAddresses();
    }
  }, [profile?.id]);

  // Calculations
  const subtotal = getCartTotal();
  const getShippingCost = () => {
    if (shippingMethod === 'standard') {
      return subtotal >= 1500 ? 0 : 99;
    }
    if (shippingMethod === 'express') {
      return 199;
    }
    return 299; // Premium
  };

  const shippingCost = getShippingCost();
  const grandTotal = subtotal + shippingCost;

  // STEP 1 VALIDATION
  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 3) errors.fullName = 'Please enter a valid recipient full name.';
    if (!phone.match(/^[0-9+\s-]{8,15}$/)) errors.phone = 'Please enter a valid contact phone number.';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Please enter a valid email address.';
    if (address.trim().length < 6) errors.address = 'Please enter a fully descriptive street address.';
    if (city.trim().length < 2) errors.city = 'Please specify city.';
    if (state.trim().length < 2) errors.state = 'Please specify state.';
    if (!pincode.match(/^[0-9\s-]{4,10}$/)) errors.pincode = 'Please enter a valid ZIP/Pincode (e.g. 6 digits).';

    setAddressErrors(errors);

    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
    } else {
      addToast('Please resolve validation errors in the address form.', 'error');
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // STEP 4 ORDER PLACEMENT
  const handlePlaceOrder = async () => {
    if (!profile) {
      addToast('Please login to place your order persistently.', 'error');
      navigate('/auth');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    const addressPayload = {
      full_name: fullName,
      phone,
      address: landmark ? `${address} (Landmark: ${landmark})` : address,
      city,
      state,
      pincode,
      country,
      default_address: defaultAddress
    };

    if (paymentMethod === 'COD') {
      try {
        const finalOrder = await placeOrder(addressPayload, 'COD');
        setIsProcessingPayment(false);

        if (finalOrder) {
          const days = shippingMethod === 'standard' ? 4 : shippingMethod === 'express' ? 2 : 1;
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + days);
          const deliveryString = deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          });

          navigate('/order-success', {
            state: {
              orderNumber: finalOrder.order_number,
              estimatedDelivery: deliveryString,
              paymentMethod: 'COD',
              totalAmount: grandTotal,
              orderId: finalOrder.id
            }
          });
        }
      } catch (err: any) {
        setIsProcessingPayment(false);
        setPaymentError(err.message || 'Error placing Cash on Delivery order.');
        addToast(err.message || 'Error placing Cash on Delivery order.', 'error');
      }
    } else {
      // Razorpay online payment flow
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Failed to load Razorpay Payment Gateway script. Please check your internet connection.');
        }

        // Create Razorpay order securely on the backend
        const createOrderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal, // already in INR
            receipt: `receipt_${Math.floor(100000 + Math.random() * 900000)}`
          })
        });

        if (!createOrderRes.ok) {
          const errData = await createOrderRes.json();
          throw new Error(errData.error || 'Failed to initialize payment gateway order.');
        }

        const razorpayOrder = await createOrderRes.json();

        // Create the pending order record in Supabase first (before starting payment)
        const preOrder = await placeOrder(
          addressPayload,
          'RAZORPAY',
          undefined,
          undefined,
          {
            orderId: razorpayOrder.id,
            paymentId: '',
            signature: ''
          }
        );

        if (!preOrder) {
          throw new Error('Failed to record your pending order. Please try again.');
        }

        // Get Razorpay Key ID
        let rzpKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
        try {
          const configRes = await fetch('/api/razorpay/config');
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.keyId) rzpKeyId = configData.keyId;
          }
        } catch (e) {
          console.warn('Could not fetch Razorpay config from API, using client env key if available.', e);
        }

        if (!rzpKeyId) {
          throw new Error('Razorpay Key ID is not configured. Please set RAZORPAY_KEY_ID on the server.');
        }

        const options = {
          key: rzpKeyId,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "CraftKalash",
          description: "Fine Wooden Heirloom & Creations",
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            setIsProcessingPayment(true);
            setPaymentError(null);

            try {
              // Securely verify signature on the server
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.verified) {
                // Signature verified! Update pending order in database to "paid"
                const updateSuccess = await updateRazorpayPayment(
                  preOrder.id,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  'paid',
                  'processing'
                );

                if (updateSuccess) {
                  // Clear cart as payment is now successful
                  await clearCart();
                }

                setIsProcessingPayment(false);

                const days = shippingMethod === 'standard' ? 4 : shippingMethod === 'express' ? 2 : 1;
                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + days);
                const deliveryString = deliveryDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                });

                navigate('/order-success', {
                  state: {
                    orderNumber: preOrder.order_number,
                    estimatedDelivery: deliveryString,
                    paymentMethod: 'RAZORPAY',
                    totalAmount: grandTotal,
                    orderId: preOrder.id
                  }
                });
              } else {
                throw new Error(verifyData.error || 'Payment signature verification failed.');
              }
            } catch (vErr: any) {
              setIsProcessingPayment(false);
              setPaymentError(vErr.message || 'Signature verification failed.');
              addToast(vErr.message || 'Payment verification failed.', 'error');
              // Mark order as failed in Supabase
              await updateRazorpayPayment(
                preOrder.id,
                response.razorpay_order_id || razorpayOrder.id,
                response.razorpay_payment_id || '',
                response.razorpay_signature || '',
                'failed',
                'cancelled'
              );
            }
          },
          prefill: {
            name: fullName,
            email: email,
            contact: phone
          },
          theme: {
            color: "#B45309"
          },
          modal: {
            ondismiss: async function() {
              setIsProcessingPayment(false);
              addToast('Payment cancelled by customer.', 'info');
              // Mark order as failed / cancelled in Supabase
              await updateRazorpayPayment(
                preOrder.id,
                razorpayOrder.id,
                '',
                '',
                'failed',
                'cancelled'
              );
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', async function (resp: any) {
          setIsProcessingPayment(false);
          setPaymentError(resp.error.description || 'Payment transaction failed.');
          addToast(resp.error.description || 'Payment failed.', 'error');
          // Mark order as failed / cancelled in Supabase
          await updateRazorpayPayment(
            preOrder.id,
            razorpayOrder.id,
            '',
            '',
            'failed',
            'cancelled'
          );
        });
        rzp.open();
      } catch (err: any) {
        setIsProcessingPayment(false);
        setPaymentError(err.message || 'Razorpay standard checkout failed to initialize.');
        addToast(err.message || 'Razorpay checkout failed.', 'error');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-24 text-brand-text-primary">
      {/* Step Indicators Tracker */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mb-12 max-w-3xl mx-auto">
        {[
          { num: 1, label: 'Delivery Address', icon: MapPin },
          { num: 2, label: 'Secure Payment', icon: CreditCard },
          { num: 3, label: 'Review & Order', icon: FileText }
        ].map((step) => {
          const IconComponent = step.icon;
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                    isCompleted
                      ? 'bg-brand-success text-white border-transparent'
                      : isActive
                        ? 'bg-brand-primary text-white border-transparent shadow-xs'
                        : 'bg-white text-gray-400 border-brand-border'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={`text-xs font-bold transition-all ${
                    isActive ? 'text-brand-primary' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {step.num < 3 && <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Columns - Form Entry based on step */}
        <div className="lg:col-span-8 bg-white border border-brand-border/60 p-6 sm:p-8 rounded-3xl shadow-xs min-h-[420px]">
          
          {/* STEP 1: DELIVERY ADDRESS */}
          {currentStep === 1 && (
            <form onSubmit={handleAddressNext} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-heading font-black">1. Shipping Destination</h2>
                <p className="text-xs text-brand-text-secondary font-light">Where should we deliver your handcrafted wood designs?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.fullName && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.fullName}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="Recipient Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.email && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.email}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Recipient Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.phone && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.phone}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Landmark / Instruction (Optional)</label>
                  <input
                    type="text"
                    placeholder="Landmark (optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, house number, apartment"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                />
                {addressErrors.address && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.address}</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1.5 col-span-1">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.city && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.city}</span>}
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">State / Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.state && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.state}</span>}
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Pincode / ZIP *</label>
                  <input
                    type="text"
                    required
                    placeholder="ZIP / Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-gray-400"
                  />
                  {addressErrors.pincode && <span className="text-[10px] text-brand-error font-semibold">{addressErrors.pincode}</span>}
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-brand-primary text-brand-text-primary"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-text-secondary">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  Save address to my address book
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-text-secondary">
                  <input
                    type="checkbox"
                    checked={defaultAddress}
                    onChange={(e) => setDefaultAddress(e.target.checked)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  Make this my default shipping address
                </label>
              </div>

              {!profile && (
                <div className="bg-brand-secondary/5 border border-brand-secondary/20 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-brand-text-secondary">
                  <Info className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-brand-secondary">Guest Checkout Active</strong>. 
                    Registering or logging in will auto-sync this address and save your orders to a persistent timeline. 
                    <Link to="/auth" className="text-brand-primary font-black hover:underline ml-1">Login here</Link>.
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-brand-border/40 flex justify-end">
                <button
                  type="submit"
                  className="bg-brand-primary text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center gap-1.5 hover:bg-brand-primary/95 shadow-sm cursor-pointer transition-all"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT METHODS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-heading font-black">2. Complete Secure Payment</h2>
                <p className="text-xs text-brand-text-secondary font-light">Select your preferred payment option below. Fast, secure, and reliable transaction gateways.</p>
              </div>

              {/* Grid of payment modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  { id: 'RAZORPAY', title: 'Razorpay Online Payment', desc: 'Pay instantly via UPI, Credit/Debit Cards, Net Banking, or Wallets securely', icon: CreditCard },
                  { id: 'COD', title: 'Cash on Delivery (COD)', desc: 'Place your order and pay in cash or UPI at delivery doorstep', icon: Briefcase }
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id as any)}
                      className={`p-4 rounded-2xl border-2 text-left space-y-2 flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === mode.id
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-text-primary'
                          : 'border-brand-border hover:bg-brand-bg/40 text-brand-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${paymentMethod === mode.id ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-text-secondary'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <strong className="font-heading font-black text-sm">{mode.title}</strong>
                      </div>
                      <p className="text-[11px] font-light leading-relaxed text-brand-text-secondary">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {paymentMethod === 'RAZORPAY' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-brand-bg/30 border border-brand-border/60 p-5 rounded-2xl space-y-4 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
                      <span className="font-black text-[11px] text-brand-primary uppercase tracking-wider">Razorpay Online Payment</span>
                      <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-black px-2 py-0.5 rounded-full border border-brand-primary/25">SECURE INTEGRATION</span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-bold text-xs text-brand-text-primary uppercase tracking-wider">Secure Standard Checkout</h4>
                        <p className="text-[11px] text-brand-text-secondary leading-relaxed font-light">
                          Clicking "Place Order" will open Razorpay's secure checkout gateway. You can make payment instantly using your preferred option:
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px] font-semibold text-brand-text-secondary">
                          <span className="bg-white px-2 py-1 rounded-md border border-brand-border/40">⚡ UPI (GPay/PhonePe)</span>
                          <span className="bg-white px-2 py-1 rounded-md border border-brand-border/40">💳 Credit & Debit Cards</span>
                          <span className="bg-white px-2 py-1 rounded-md border border-brand-border/40">🏦 Net Banking</span>
                          <span className="bg-white px-2 py-1 rounded-md border border-brand-border/40">💼 Mobile Wallets</span>
                        </div>
                        <p className="text-[10px] text-gray-400 italic font-light pt-1">
                          Amount will be securely processed in Indian Rupees (INR) via Razorpay.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'COD' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-brand-bg/40 border border-brand-border/60 p-5 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-brand-text-primary block font-black text-sm">Cash on Delivery selected</strong>
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ Pay status will be Pending COD</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary font-light leading-relaxed pl-12">
                      No deposit required right now. You can pay with Cash or scan our delivery executive's personal UPI QR code directly at your doorstep during delivery. Hand-polishing quality check available on delivery.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-6 border-t border-brand-border/40 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="border border-brand-border text-brand-text-primary text-xs font-bold py-3 px-5 rounded-xl flex items-center gap-1.5 hover:bg-brand-bg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-brand-primary text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center gap-1.5 hover:bg-brand-primary/95 shadow-sm cursor-pointer transition-all"
                >
                  Continue to Review
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ORDER */}
          {currentStep === 3 && (
            <div className="space-y-6 text-xs">
              <div className="space-y-1">
                <h2 className="text-xl font-heading font-black">3. Review & Execute Heirloom Order</h2>
                <p className="text-xs text-brand-text-secondary font-light">Please verify your final workshop instructions and address destination.</p>
              </div>

              {/* Review summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-brand-border p-4 rounded-xl space-y-1.5 bg-brand-bg/10">
                  <span className="font-extrabold uppercase text-[10px] text-gray-400 block tracking-wider">Recipient Destination</span>
                  <strong className="text-brand-text-primary block font-bold">{fullName}</strong>
                  <p className="text-brand-text-secondary leading-relaxed font-light">{address}, {city}, {state} ({pincode})</p>
                  <span className="block text-brand-text-secondary">Phone: {phone}</span>
                </div>

                <div className="border border-brand-border p-4 rounded-xl space-y-1.5 bg-brand-bg/10">
                  <span className="font-extrabold uppercase text-[10px] text-gray-400 block tracking-wider">Method & Secure Payment</span>
                  <div className="flex justify-between">
                    <span className="font-bold">Shipping Care:</span>
                    <span className="capitalize font-extrabold text-brand-primary">{shippingMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Payment Option:</span>
                    <span className="font-extrabold text-brand-primary uppercase">{paymentMethod === 'RAZORPAY' ? 'Razorpay Secure' : 'Cash on Delivery'}</span>
                  </div>
                  {paymentMethod === 'RAZORPAY' && (
                    <div className="text-[10px] text-brand-text-secondary mt-1 pt-1 border-t border-brand-border/20 space-y-0.5">
                      <div className="text-brand-primary font-bold">Instantly processed via Razorpay Gateway</div>
                      <div className="text-gray-400 font-light italic">Signature will be validated on submission</div>
                    </div>
                  )}
                  <span className="block text-gray-400 text-[10px] font-light leading-relaxed pt-1.5 border-t border-brand-border/30">
                    FSC certified biological lumber warranty included.
                  </span>
                </div>
              </div>

              {/* Secure Payment Processing state */}
              {isProcessingPayment ? (
                <div className="bg-brand-primary/5 border border-brand-primary/20 p-8 rounded-2xl text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-brand-primary">Processing Payment Authorization</h3>
                    <p className="text-[11px] text-brand-text-secondary">Contacting secure sandbox gateway. Please do not close or reload this terminal window.</p>
                  </div>
                </div>
              ) : paymentError ? (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-4">
                  <AlertTriangle className="w-10 h-10 text-brand-error mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-brand-error">Payment Authorization Failed</h3>
                    <p className="text-[11px] text-rose-800 leading-normal">{paymentError}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setPaymentError(null);
                        setCurrentStep(3); // Go back to payment selection
                      }}
                      className="bg-brand-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-brand-primary/95 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry with different payment method
                    </button>
                    <button
                      onClick={() => setPaymentError(null)}
                      className="border border-brand-border text-brand-text-primary font-bold py-2 px-4 rounded-xl hover:bg-brand-bg text-xs cursor-pointer"
                    >
                      Dismiss Error
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-brand-border/40 space-y-4">
                  <p className="text-[11px] text-brand-text-secondary leading-relaxed font-light">
                    By clicking the button below, you authorize CraftKalash to process this simulated transaction and record this order in your Supabase or local state database catalog.
                  </p>
                  
                  <div className="flex justify-between gap-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="border border-brand-border text-brand-text-primary text-xs font-bold py-3.5 px-6 rounded-xl flex items-center gap-1 hover:bg-brand-bg transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Payment
                    </button>

                    <button
                      onClick={handlePlaceOrder}
                      className="bg-brand-primary text-white text-xs font-bold py-3.5 px-8 rounded-xl flex items-center gap-1.5 hover:bg-brand-primary/95 shadow-md hover:scale-101 active:scale-98 transition-all cursor-pointer"
                    >
                      Place Heirloom Order (₹{grandTotal.toFixed(2)})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Order Summary Widget */}
        <div className="lg:col-span-4 bg-white border border-brand-border/60 p-6 rounded-3xl shadow-xs space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-brand-border/40 pb-3">Your Crate Summary</h3>
          
          <div className="divide-y divide-brand-border/30 max-h-[220px] overflow-y-auto space-y-3 pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-3 items-center text-xs py-2 first:pt-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover border border-brand-border/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-brand-text-primary truncate">{item.product.name}</h4>
                  <span className="text-[10px] text-gray-400 block font-light">
                    Qty: <strong>{item.quantity}</strong> • ₹{item.product.price.toFixed(2)} each
                  </span>
                </div>
                <span className="font-extrabold text-brand-primary shrink-0">₹{(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-border/40 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-brand-text-secondary">
              <span>Cart items subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-text-secondary">
              <span>Shipping cost</span>
              <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-black text-brand-text-primary text-sm pt-2 border-t border-brand-border/30">
              <span>Grand Total</span>
              <span className="text-brand-primary text-base">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-brand-bg p-3.5 rounded-xl border border-brand-border/50 text-[10px] text-brand-text-secondary flex gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-brand-success shrink-0" />
            <span>
              Heirloom 100-Year Solid Lumber warranty automatically applied to items in this crate.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
