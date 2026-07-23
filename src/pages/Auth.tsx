import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Eye,
  EyeOff,
  AlertCircle,
  Send,
  Sparkles,
  X,
  Clock,
  ChevronLeft,
  Star,
  Check,
  RefreshCw,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabaseService';
import { getAndClearRedirectUrl } from '../utils/redirect';

export default function Auth() {
  const { login, register, resendVerificationEmail, user } = useShop();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const navigate = useNavigate();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Pending View State
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Resend Countdown Timer (60s)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Focused Field for Floating Label Animation
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Notification Toast States
  const [toast, setToast] = useState<{
    type: 'error' | 'success' | 'info';
    title: string;
    message: string;
    action?: 'login' | 'resend';
  } | null>(null);

  // Countdown effect
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Parse email verification tokens and parameters from URL hash / search
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const isRecovery =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('type=recovery_grant') ||
      search.includes('type=recovery_grant');

    if (isRecovery) {
      console.log('[Auth.tsx] Password recovery URL detected. Redirecting to /reset-password');
      navigate('/reset-password', { replace: true });
      return;
    }

    if (hash || search) {
      if (hash.includes('error_description=')) {
        const match = hash.match(/error_description=([^&]+)/);
        const decoded = match 
          ? decodeURIComponent(match[1].replace(/\+/g, ' '))
          : 'Email verification link is invalid or has expired.';
        
        setToast({
          type: 'error',
          title: 'Verification Link Error',
          message: decoded,
          action: 'resend'
        });
      } else if (
        (hash.includes('type=signup') || 
        hash.includes('type=email_change') || 
        search.includes('verified=true')) &&
        !hash.includes('type=recovery')
      ) {
        setToast({
          type: 'success',
          title: 'Account Verified!',
          message: 'Your email has been verified successfully. Please sign in to continue.'
        });
        setIsLogin(true);
        setIsVerificationPending(false);
        authService.logout();
      }
      // Clean up URL without triggering reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [navigate]);

  // Auto redirect if logged in
  useEffect(() => {
    if (user && user.email_confirmed_at && isLogin) {
      const targetUrl = getAndClearRedirectUrl() || '/account';
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setToast(null);
    setIsSubmitting(true);

    try {
      if (isForgot) {
        if (resendCooldown > 0) {
          setToast({
            type: 'error',
            title: 'Please Wait',
            message: `Please wait ${resendCooldown} seconds before requesting another password reset email.`
          });
          setIsSubmitting(false);
          return;
        }

        const res = await authService.forgotPassword(email);
        if (res.error) {
          const isRateLimit = res.error.toLowerCase().includes('rate limit') || res.error.toLowerCase().includes('rate_limit');
          if (isRateLimit) {
            setResendCooldown(60);
          }
          setToast({
            type: 'error',
            title: isRateLimit ? 'Too Many Requests' : 'Reset Failed',
            message: isRateLimit
              ? 'Supabase email rate limit reached. Please wait 60 seconds before requesting another password reset email.'
              : res.error
          });
        } else {
          setResendCooldown(60);
          setToast({
            type: 'success',
            title: 'Password Reset Email Sent',
            message: `We've sent a password reset link to ${email}. Please check your inbox and spam folder.`
          });
        }
      } else if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          const targetUrl = getAndClearRedirectUrl() || '/account';
          navigate(targetUrl);
        } else {
          const errLower = (res.error || '').toLowerCase();
          const isUnverified = res.isNotVerified || errLower.includes('verify');
          
          setToast({
            type: 'error',
            title: isUnverified ? 'Email Verification Required' : 'Sign In Failed',
            message: res.error || 'Authentication failed. Please check your credentials.',
            action: isUnverified ? 'resend' : undefined
          });

          if (isUnverified) {
            setPendingEmail(email);
          }
        }
      } else {
        const res = await register(fullName, email, phone, password);
        if (res.success) {
          if (res.needsVerification) {
            setPendingEmail(email);
            setIsVerificationPending(true);
            setResendCooldown(60);
            setToast({
              type: 'success',
              title: 'Account Created Successfully!',
              message: `Verification link sent to ${email}. Please verify your email before logging in.`
            });
          } else {
            const targetUrl = getAndClearRedirectUrl() || '/account';
            navigate(targetUrl);
          }
        } else {
          const errLower = (res.error || '').toLowerCase();
          const isDuplicate = errLower.includes('already') || errLower.includes('exists');
          
          setToast({
            type: 'error',
            title: isDuplicate ? 'Account Exists' : 'Registration Failed',
            message: res.error || 'Could not complete registration.',
            action: isDuplicate ? 'login' : errLower.includes('verify') ? 'resend' : undefined
          });
        }
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Unexpected Error',
        message: err.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = pendingEmail || email;
    if (!targetEmail) {
      setToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address to resend the verification link.'
      });
      return;
    }

    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const res = await resendVerificationEmail(targetEmail);
      if (res.success) {
        setResendCooldown(60);
        setToast({
          type: 'success',
          title: 'Verification Email Sent',
          message: `A fresh verification link has been sent to ${targetEmail}. Please check your inbox and spam folder.`
        });
      } else {
        setToast({
          type: 'error',
          title: 'Resend Failed',
          message: res.error || 'Failed to resend verification email.'
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to resend verification email.'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1D16] flex flex-col justify-center relative overflow-x-hidden font-sans selection:bg-[#785338]/20 selection:text-[#2C1D16]">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#EAE0D2] via-[#E2D4C0] to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-gradient-to-tl from-[#E2D5C3] via-[#FAF7F2] to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(#8C6D53_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 items-center">
        
        {/* LEFT COLUMN - Luxury Brand Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 h-full min-h-[640px] max-h-[820px] rounded-[32px] bg-gradient-to-br from-[#2D1E17] via-[#3E2B21] to-[#1C110B] p-10 xl:p-14 flex-col justify-between relative overflow-hidden text-[#FAF7F2] shadow-2xl shadow-amber-950/20 border border-amber-900/20 my-auto">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80"
              alt="CraftKalash Artisanal Toys"
              className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C110B] via-[#2D1E17]/80 to-[#2D1E17]/40" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8C6D53] to-[#C2A68C] p-0.5 shadow-lg shadow-black/30">
                <div className="w-full h-full bg-[#2D1E17] rounded-[14px] flex items-center justify-center">
                  <img src="/logo.svg" alt="CraftKalash Logo" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div>
                <span className="font-heading font-bold tracking-tight text-lg block text-amber-50">CraftKalash</span>
                <span className="text-[10px] uppercase tracking-widest text-amber-200/70 font-semibold">Artisan Wooden Toys</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-medium text-amber-100/90">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>CE Certified • Non-Toxic</span>
            </div>
          </div>

          {/* Middle Copy Showcase */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs font-semibold backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Handcrafted with Love in India</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl xl:text-4xl font-serif font-bold text-amber-50 leading-[1.2] tracking-tight"
            >
              Pure Wooden Toys.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300">
                Infinite Childhood Joy.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-amber-100/70 text-sm leading-relaxed max-w-md font-light"
            >
              Shaped by master artisans from FSC-certified beechwood and natural plant dyes. Designed to nurture creativity without screen-time or chemical toxins.
            </motion.p>
          </div>

          {/* Bottom Testimonial / Social Proof */}
          <div className="relative z-10 space-y-4">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2.5">
              <div className="flex items-center gap-1 text-amber-300">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-300" />
                ))}
                <span className="text-xs font-bold text-amber-100 ml-2">4.9 / 5</span>
              </div>
              <p className="text-xs text-amber-100/90 font-light italic leading-relaxed">
                "The weight, smell, and smooth finish of these wooden blocks are unmatched. Knowing my children are playing with chemical-free toys is invaluable."
              </p>
              <div className="flex items-center justify-between text-[11px] text-amber-200/70 pt-1">
                <span className="font-semibold text-amber-100">Ananya S. — Verified Parent</span>
                <span>Over 10,000+ Happy Families</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Centered Luxury Authentication Card */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col items-center justify-center p-2 sm:p-6 my-auto">
          
          {/* Mobile Top Branding */}
          <div className="lg:hidden flex flex-col items-center mb-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C6D53] to-[#C2A68C] p-0.5 shadow-md">
              <div className="w-full h-full bg-[#2D1E17] rounded-[14px] flex items-center justify-center">
                <img src="/logo.svg" alt="CraftKalash Logo" className="w-7 h-7 object-contain" />
              </div>
            </div>
            <h1 className="text-xl font-bold font-serif text-[#2C1D16]">CraftKalash</h1>
            <p className="text-xs text-[#786355]">Handcrafted Non-Toxic Wooden Toys</p>
          </div>

          {/* Toast Notification Container */}
          <AnimatePresence mode="wait">
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`w-full max-w-[440px] mb-4 p-4 rounded-2xl border backdrop-blur-xl shadow-xl flex items-start justify-between gap-3 relative z-30 ${
                  toast.type === 'error'
                    ? 'bg-rose-50/95 border-rose-200/80 text-rose-950 shadow-rose-900/5'
                    : toast.type === 'success'
                    ? 'bg-emerald-50/95 border-emerald-200/80 text-emerald-950 shadow-emerald-900/5'
                    : 'bg-amber-50/95 border-amber-200/80 text-amber-950 shadow-amber-900/5'
                }`}
              >
                <div className="flex items-start gap-3 text-xs leading-relaxed">
                  {toast.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 pr-2">
                    <span className="font-bold block tracking-tight text-[13px]">
                      {toast.title}
                    </span>
                    <p className="text-slate-700 font-normal leading-normal">
                      {toast.message}
                    </p>

                    {/* Toast Inline Quick Actions */}
                    {toast.action === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setIsVerificationPending(false);
                          setToast(null);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4A3226] text-amber-50 rounded-lg text-[11px] font-bold hover:bg-[#38241B] transition-all shadow-sm cursor-pointer"
                      >
                        <span>Switch to Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {toast.action === 'resend' && (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || resendCooldown > 0}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 text-white rounded-lg text-[11px] font-bold hover:bg-rose-800 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : isResending
                            ? 'Sending Email...'
                            : 'Resend Verification Email'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glassmorphic Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] bg-white/85 backdrop-blur-2xl border border-[#E3D8C8] rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(72,46,26,0.08)] relative z-10 transition-all duration-300"
          >
            {/* Top luxury line accent */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#8C6D53] to-transparent opacity-80" />

            {/* SCREEN 1: VERIFICATION PENDING STATE */}
            {isVerificationPending ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-2"
              >
                {/* Illustration Circle */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#8C6D53]/10 rounded-full animate-ping opacity-30" />
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#2D1E17] to-[#4A3226] rounded-3xl flex items-center justify-center shadow-xl shadow-amber-950/15 border border-amber-900/20 relative z-10">
                    <Mail className="w-9 h-9 text-amber-200" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md z-20 border-2 border-white">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-[#2C1D16] tracking-tight">
                    Check Your Email
                  </h2>
                  <p className="text-xs text-[#6B574A] leading-relaxed max-w-[320px] mx-auto">
                    We've sent a verification link to activate your CraftKalash account:
                  </p>
                  <div className="inline-block mt-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E3D8C8] text-xs font-bold text-[#3E2B21] tracking-wide">
                    {pendingEmail}
                  </div>
                </div>

                {/* Email Folders Notice */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E3D8C8]/80 text-left space-y-2.5 text-xs text-[#524136]">
                  <span className="font-bold text-[#2C1D16] block text-[11px] uppercase tracking-wider">
                    📬 Important Next Steps
                  </span>
                  <ul className="space-y-2 text-[11px]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Click the confirmation link inside your email to complete verification.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>If missing in main inbox, check your <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder.</span>
                    </li>
                  </ul>
                </div>

                {/* Resend Action & Countdown */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className="w-full bg-gradient-to-r from-[#4A3226] via-[#3D291F] to-[#2D1D16] text-amber-50 py-3.5 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-950/15 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                        <span>Sending Link...</span>
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-200" />
                        <span>Resend Email in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-amber-200" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerificationPending(false);
                      setIsLogin(true);
                      setToast({
                        type: 'info',
                        title: 'Ready to Sign In',
                        message: 'Once you click the link in your email, sign in with your password below.'
                      });
                    }}
                    className="w-full text-xs font-bold text-[#6B574A] hover:text-[#2C1D16] py-2 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Sign In Form</span>
                  </button>
                </div>
              </motion.div>
            ) : (

              /* SCREEN 2: MAIN AUTH FORM (LOGIN / REGISTER / FORGOT) */
              <div className="space-y-6">
                
                {/* Header Title & Subtitle */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-[#2C1D16] tracking-tight">
                    {isForgot 
                      ? 'Reset Password' 
                      : isLogin 
                        ? 'Welcome Back' 
                        : 'Create Account'}
                  </h2>
                  <p className="text-xs text-[#786355] leading-relaxed max-w-[300px] mx-auto font-normal">
                    {isForgot 
                      ? 'Enter your registered email address to receive password recovery instructions.'
                      : isLogin 
                        ? 'Access your saved wishlists, check order status, and track handcrafted toys.' 
                        : 'Join the CraftKalash family for organic beechwood handcrafted toys.'}
                  </p>
                </div>

                {/* Segmented Control Tabs (Sign In / Register) */}
                {!isForgot && (
                  <div className="bg-[#FAF5EE] p-1.5 rounded-2xl border border-[#E3D8C8]/80 relative grid grid-cols-2 gap-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(true);
                        setToast(null);
                      }}
                      className={`relative z-10 py-2.5 rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                        isLogin ? 'text-[#2C1D16]' : 'text-[#8C7A6D] hover:text-[#2C1D16]'
                      }`}
                    >
                      {isLogin && (
                        <motion.div
                          layoutId="activeTabPill"
                          className="absolute inset-0 bg-white rounded-xl shadow-md shadow-amber-950/5 border border-stone-200/60 z-[-1]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span>Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        setToast(null);
                      }}
                      className={`relative z-10 py-2.5 rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                        !isLogin ? 'text-[#2C1D16]' : 'text-[#8C7A6D] hover:text-[#2C1D16]'
                      }`}
                    >
                      {!isLogin && (
                        <motion.div
                          layoutId="activeTabPill"
                          className="absolute inset-0 bg-white rounded-xl shadow-md shadow-amber-950/5 border border-stone-200/60 z-[-1]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span>Register</span>
                    </button>
                  </div>
                )}

                {/* Main Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {!isLogin && !isForgot && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Full Name Input */}
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-4 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                          />
                        </div>

                        {/* Phone Number Input */}
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-4 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-4 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Password Field */}
                  {!isForgot && (
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (Min. 6 characters)"
                        className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-10 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] hover:text-[#4A3226] transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Forgot Password toggle */}
                  {isLogin && !isForgot && (
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setToast(null);
                        }}
                        className="text-[11px] font-bold text-[#786355] hover:text-[#2C1D16] transition-colors hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Back to Login link */}
                  {isForgot && (
                    <div className="flex justify-start pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(false);
                          setToast(null);
                        }}
                        className="text-[11px] font-bold text-[#4A3226] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || (isForgot && resendCooldown > 0)}
                    className="w-full bg-gradient-to-r from-[#4A3226] via-[#3D291F] to-[#2D1D16] text-amber-50 py-4 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-950/15 hover:shadow-xl hover:shadow-amber-950/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                        <span>Processing...</span>
                      </>
                    ) : isForgot && resendCooldown > 0 ? (
                      <>
                        <span>Resend in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {isForgot 
                            ? 'Send Recovery Link' 
                            : isLogin 
                              ? 'Sign In to Account' 
                              : 'Create Free Account'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-amber-200" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Footer Badges & Trust Guarantees */}
                <div className="pt-4 border-t border-[#E3D8C8]/60 text-center space-y-2 text-[10px] text-[#786355]">
                  <p className="flex items-center justify-center gap-1.5 font-bold text-[#4A3226]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>CE Certified Non-Toxic Play Safe Guarantee</span>
                  </p>
                  <div className="flex justify-center gap-3 font-semibold text-[#8C7A6D]">
                    <span>• Solid Beechwood</span>
                    <span>• Plant Dyes</span>
                    <span>• FSC Sourced</span>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

