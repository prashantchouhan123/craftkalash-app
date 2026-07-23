import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { saveRedirectUrl } from '../utils/redirect';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Info,
  AlertTriangle,
  RotateCcw,
  Banknote,
  Lock,
  Truck
} from 'lucide-react';
import { addressService } from '../services/supabaseService';

export default function Checkout() {
  const {
    cart,
    profile,
    getCartTotal,
    addToast,
    clearCart,
    placeOrder,
    updateRazorpayPayment
  } = useShop();

  const navigate = useNavigate();

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      addToast('Your cart is empty. Please add items before checking out.', 'info');
      navigate('/shop');
    }
  }, [cart.length]);

  // Steps: 1 | 2 | 3
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
  const [shippingMethod] = useState<'standard' | 'express' | 'premium'>('standard');

  // STEP 3 FIELDS (Payment method)
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
    return 299;
  };

  const shippingCost = getShippingCost();
  const grandTotal = subtotal + shippingCost;

  // STEP 1 VALIDATION
  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (fullName.trim().length < 3) errors.fullName = 'Please enter full name.';
    if (!phone.match(/^[0-9+\s-]{8,15}$/)) errors.phone = 'Please enter a valid phone number.';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Please enter a valid email address.';
    if (address.trim().length < 6) errors.address = 'Please enter street address.';
    if (city.trim().length < 2) errors.city = 'Please enter city.';
    if (state.trim().length < 2) errors.state = 'Please enter state.';
    if (!pincode.match(/^[0-9\s-]{4,10}$/)) errors.pincode = 'Please enter a valid pincode.';

    setAddressErrors(errors);

    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('Please complete all required address fields correctly.', 'error');
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

  // STEP 3 ORDER PLACEMENT
  const handlePlaceOrder = async () => {
    if (!profile) {
      addToast('Please login to place your order securely.', 'error');
      saveRedirectUrl('/checkout');
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
          throw new Error('Failed to load Razorpay Payment Gateway. Please check your internet connection.');
        }

        const createOrderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            receipt: `receipt_${Math.floor(100000 + Math.random() * 900000)}`
          })
        });

        if (!createOrderRes.ok) {
          const errData = await createOrderRes.json();
          throw new Error(errData.error || 'Failed to initialize payment gateway.');
        }

        const razorpayOrder = await createOrderRes.json();

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
          throw new Error('Failed to record pending order. Please try again.');
        }

        let rzpKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
        try {
          const configRes = await fetch('/api/razorpay/config');
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.keyId) rzpKeyId = configData.keyId;
          }
        } catch (e) {
          console.warn('Razorpay config lookup warning:', e);
        }

        if (!rzpKeyId) {
          throw new Error('Razorpay Key ID is not configured.');
        }

        const options = {
          key: rzpKeyId,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "CraftKalash",
          description: "Order Checkout Payment",
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            setIsProcessingPayment(true);
            setPaymentError(null);

            try {
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
                const updateSuccess = await updateRazorpayPayment(
                  preOrder.id,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  'paid',
                  'processing'
                );

                if (updateSuccess) {
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
            color: "#78350F"
          },
          modal: {
            ondismiss: async function() {
              setIsProcessingPayment(false);
              addToast('Payment cancelled by user.', 'info');
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
        setPaymentError(err.message || 'Razorpay checkout failed to initialize.');
        addToast(err.message || 'Razorpay checkout failed.', 'error');
      }
    }
  };

  const steps = [
    { num: 1, label: 'Delivery Address', icon: MapPin },
    { num: 2, label: 'Payment Method', icon: CreditCard },
    { num: 3, label: 'Review & Confirm', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-stone-50/70 pt-28 pb-20 text-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Complete your order securely</p>
        </div>

        {/* Step Indicator Bar */}
        <div className="mb-10 max-w-xl mx-auto bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <React.Fragment key={step.num}>
                  <div 
                    onClick={() => {
                      if (isCompleted) setCurrentStep(step.num);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all ${
                      isCompleted ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:inline-block ${
                        isActive ? 'text-gray-900 font-semibold' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            
            {/* STEP 1: DELIVERY ADDRESS */}
            {currentStep === 1 && (
              <form onSubmit={handleAddressNext} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-800 shrink-0" />
                    Delivery Address
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Where should we deliver your handcrafted items?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.fullName && <p className="text-[11px] text-red-500 mt-1">{addressErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.email && <p className="text-[11px] text-red-500 mt-1">{addressErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.phone && <p className="text-[11px] text-red-500 mt-1">{addressErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="Near City Hospital"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat / House No., Building, Street Name"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                  />
                  {addressErrors.address && <p className="text-[11px] text-red-500 mt-1">{addressErrors.address}</p>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.city && <p className="text-[11px] text-red-500 mt-1">{addressErrors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.state && <p className="text-[11px] text-red-500 mt-1">{addressErrors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="110001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-amber-800 transition-all placeholder:text-gray-400"
                    />
                    {addressErrors.pincode && <p className="text-[11px] text-red-500 mt-1">{addressErrors.pincode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-700"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="rounded border-gray-300 text-amber-800 focus:ring-amber-800"
                    />
                    Save to address book
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={defaultAddress}
                      onChange={(e) => setDefaultAddress(e.target.checked)}
                      className="rounded border-gray-300 text-amber-800 focus:ring-amber-800"
                    />
                    Set as default address
                  </label>
                </div>

                {!profile && (
                  <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-xl flex gap-3 text-xs text-amber-900 items-start">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Guest Checkout:</span> Registering or logging in saves your address and order history automatically. 
                      <Link to="/auth" onClick={() => saveRedirectUrl('/checkout')} className="font-semibold text-amber-800 underline ml-1">Login here</Link>.
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-medium py-3 px-6 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-800 shrink-0" />
                    Payment Method
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Select how you would like to complete your payment</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Razorpay Option */}
                  <div
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      paymentMethod === 'RAZORPAY'
                        ? 'border-amber-800 bg-amber-50/30 ring-1 ring-amber-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === 'RAZORPAY' ? 'bg-amber-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Online Payment</p>
                          <p className="text-[11px] text-gray-500">UPI, Cards, NetBanking, Wallets</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'RAZORPAY' ? 'border-amber-800 bg-amber-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'RAZORPAY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* COD Option */}
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      paymentMethod === 'COD'
                        ? 'border-amber-800 bg-amber-50/30 ring-1 ring-amber-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === 'COD' ? 'bg-amber-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Cash on Delivery (COD)</p>
                          <p className="text-[11px] text-gray-500">Pay cash or UPI at delivery</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'COD' ? 'border-amber-800 bg-amber-800' : 'border-gray-300'}`}>
                        {paymentMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Boxes */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'RAZORPAY' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="bg-gray-50/80 border border-gray-200/80 p-4 rounded-xl text-xs space-y-2.5"
                    >
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Secure Razorpay Gateway</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        You will be directed to Razorpay's encrypted checkout to complete your payment via UPI (GPay, PhonePe, Paytm), Cards, NetBanking or Wallets.
                      </p>
                    </motion.div>
                  )}

                  {paymentMethod === 'COD' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="bg-gray-50/80 border border-gray-200/80 p-4 rounded-xl text-xs space-y-2.5"
                    >
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Banknote className="w-4 h-4 text-amber-800 shrink-0" />
                        <span>Cash or UPI on Delivery</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        No online payment required now. Hand over exact cash or scan delivery partner's UPI QR code upon receipt of your package.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="border border-gray-200 text-gray-700 text-xs font-medium py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-medium py-3 px-6 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    Review Order
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW ORDER */}
            {currentStep === 3 && (
              <div className="space-y-6 text-xs">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-800 shrink-0" />
                    Review & Confirm
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Please check your details before placing the order</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Delivery Info Box */}
                  <div className="border border-gray-200 p-4 rounded-xl space-y-1.5 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Shipping To</span>
                      <button onClick={() => setCurrentStep(1)} className="text-[11px] text-amber-800 font-medium hover:underline">Change</button>
                    </div>
                    <p className="font-semibold text-gray-900">{fullName}</p>
                    <p className="text-gray-600 leading-normal">{address}, {city}, {state} ({pincode})</p>
                    <p className="text-gray-500 text-[11px]">Phone: {phone}</p>
                  </div>

                  {/* Payment Info Box */}
                  <div className="border border-gray-200 p-4 rounded-xl space-y-1.5 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider">Payment Method</span>
                      <button onClick={() => setCurrentStep(2)} className="text-[11px] text-amber-800 font-medium hover:underline">Change</button>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {paymentMethod === 'RAZORPAY' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}
                    </p>
                    <p className="text-gray-500 text-[11px]">
                      {paymentMethod === 'RAZORPAY' ? 'UPI, Credit/Debit Card, NetBanking' : 'Pay cash or UPI at doorstep'}
                    </p>
                  </div>
                </div>

                {isProcessingPayment ? (
                  <div className="bg-amber-50/50 border border-amber-200/80 p-6 rounded-xl text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Processing Payment</p>
                      <p className="text-xs text-gray-500 mt-0.5">Please complete transaction in the popup window...</p>
                    </div>
                  </div>
                ) : paymentError ? (
                  <div className="bg-red-50 border border-red-200 p-5 rounded-xl text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
                    <div>
                      <p className="font-semibold text-red-900 text-xs">Payment Failed</p>
                      <p className="text-[11px] text-red-700 mt-0.5">{paymentError}</p>
                    </div>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setPaymentError(null);
                          setCurrentStep(2);
                        }}
                        className="bg-amber-800 text-white font-medium py-2 px-3.5 rounded-lg text-xs hover:bg-amber-900 inline-flex items-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="border border-gray-200 text-gray-700 text-xs font-medium py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>

                      <button
                        onClick={handlePlaceOrder}
                        className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-medium py-3 px-7 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        Place Order (₹{grandTotal.toFixed(2)})
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sticky Order Summary Widget */}
          <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs sticky top-28 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>
            
            {/* Products List */}
            <div className="divide-y divide-gray-100 max-h-[260px] overflow-y-auto space-y-3 pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 items-center text-xs py-2 first:pt-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-xs">{item.product.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Qty: {item.quantity} • ₹{item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <span className="text-emerald-700 font-medium">FREE</span> : `₹${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 text-sm pt-3 border-t border-gray-100">
                <span>Total Amount</span>
                <span className="text-amber-900 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Guarantee badge */}
            <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl text-[11px] text-gray-600 flex gap-2.5 items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Genuine Handcrafted Quality & Secure Checkout</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

