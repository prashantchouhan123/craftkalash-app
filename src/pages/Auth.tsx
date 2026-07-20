import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Info,
  Eye,
  EyeOff,
  AlertTriangle,
  Send,
  Sparkles,
  Edit3,
  ArrowLeft,
  RefreshCw,
  Clock,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabaseService';

export default function Auth() {
  const { login, register, user, isSupabaseConfigured, addToast } = useShop();
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

  // States for verification & notifications
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Resend action states
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Timer for resending verification email
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (needsVerification) {
      setTimer(60);
    }
  }, [needsVerification]);

  // Auto redirect if already logged in and verified
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      navigate('/account');
    }
  }, [user?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset error & success states
    setErrorMessage('');
    setSuccessMessage('');
    setIsNotVerified(false);
    setNeedsVerification(false);
    setResendSuccess(false);

    setIsSubmitting(true);
    try {
      if (isForgot) {
        const res = await authService.forgotPassword(email);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Restoration Link Dispatched. Please check your email inbox.');
        }
      } else if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          navigate('/account');
        } else {
          setErrorMessage(res.error || 'Authentication failed');
          if (res.isNotVerified) {
            setIsNotVerified(true);
            setVerificationEmail(email);
          }
        }
      } else {
        const res = await register(fullName, email, phone, password);
        if (res.success) {
          if (res.needsVerification) {
            setNeedsVerification(true);
            setVerificationEmail(email);
            setSuccessMessage('Registration successful! Please verify your email.');
          } else {
            navigate('/account');
          }
        } else {
          setErrorMessage(res.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendLoading || timer > 0) return;
    setResendLoading(true);
    setResendSuccess(false);
    setErrorMessage('');

    try {
      const emailToResend = verificationEmail || email;
      if (!emailToResend) {
        setErrorMessage('Please enter an email address first.');
        setResendLoading(false);
        return;
      }

      const res = await authService.resendVerificationEmail(emailToResend);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setResendSuccess(true);
        setTimer(60);
        addToast('Verification link dispatched successfully!', 'success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4 pt-32 pb-20 relative">
      {/* Delicate background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#f0ebe1_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-bg/40 rounded-full filter blur-3xl opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative bg-white border border-[#EBE5DB] rounded-3xl p-8 max-w-md w-full shadow-xl shadow-brand-primary/5 space-y-6 z-10 overflow-hidden"
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-primary" />

        {/* Supabase Status Banner */}
        {!isSupabaseConfigured && !needsVerification && (
          <div className="bg-[#FCFBF9] border border-[#EBE5DB] rounded-2xl p-3.5 flex gap-3 text-[11px] text-brand-text-secondary leading-normal">
            <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-primary font-bold block mb-0.5">Demo Mode Active</strong>
              Local Storage is configured to handle user registrations & orders instantly.
            </div>
          </div>
        )}

        {/* Header Branding */}
        {!needsVerification && (
          <div className="text-center space-y-3.5">
            <div className="py-1">
              <img
                src="/logo.svg"
                alt="CraftKalash Logo"
                className="h-11 w-auto mx-auto object-contain transition-transform duration-300 hover:scale-102"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-brand-text-primary tracking-tight font-heading">
                {isForgot 
                  ? 'Reset Your Password' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'}
              </h2>
              <p className="text-[11px] text-brand-text-secondary font-medium leading-relaxed max-w-[280px] mx-auto">
                {isForgot 
                  ? 'Enter your registered email address below to receive password restoration links.'
                  : isLogin 
                    ? 'Access your saved wishlists, check order history, and manage custom commissions.' 
                    : 'Join the CraftKalash family to receive workshop updates and track handcrafted toys.'}
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher (Hidden in Forgot Password or Needs Verification state) */}
        {!isForgot && !needsVerification && (
          <div className="grid grid-cols-2 gap-1 bg-[#FDFCFB] p-1 rounded-xl border border-[#EBE5DB]/60 text-xs font-bold">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setSuccessMessage('');
                setIsNotVerified(false);
              }}
              className={`py-2 rounded-lg transition-all duration-200 cursor-pointer ${isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMessage('');
                setSuccessMessage('');
                setIsNotVerified(false);
              }}
              className={`py-2 rounded-lg transition-all duration-200 cursor-pointer ${!isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Register
            </button>
          </div>
        )}

        {/* Alerts Block */}
        {!needsVerification && (
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-2xl flex gap-3 text-[11px] leading-relaxed"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span className="font-bold block">Action Blocked</span>
                  <p className="font-medium text-red-700">{errorMessage}</p>
                  {isNotVerified && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-1 font-bold text-red-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {resendLoading ? 'Requesting Link...' : 'Resend Verification Email'} 
                      <Send className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl flex gap-3 text-[11px] leading-relaxed"
              >
                <CheckCircle className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Action Completed</span>
                  <p className="font-medium text-emerald-700">{successMessage}</p>
                  {resendSuccess && (
                    <p className="font-bold text-emerald-800 mt-1">A fresh verification link has been successfully dispatched.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Registration / Login / Forgot Form */}
        {needsVerification ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-8 py-4 text-center"
          >
            {/* 1. Large Email Illustration */}
            <div className="flex justify-center py-2">
              <div className="relative">
                {/* Soft modern pulse glow accent */}
                <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="relative w-20 h-20 bg-brand-primary/5 rounded-full flex items-center justify-center border border-brand-primary/10">
                  <Mail className="w-10 h-10 text-brand-primary stroke-[1.1]" />
                </div>
              </div>
            </div>

            {/* 2. Heading & Short Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-brand-text-primary tracking-tight font-heading">
                Verify your email
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed max-w-[300px] mx-auto">
                We've sent a verification link to your email address. Please verify your email to activate your account.
              </p>
              
              {/* 3. Registered Email Badge */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] border border-[#EBE5DB]/60 rounded-full text-xs font-semibold text-brand-primary">
                  <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping" />
                  {verificationEmail || email}
                </span>
              </div>
            </div>

            {/* Premium Alerts Banner inside verification flow if they resend or error */}
            <AnimatePresence mode="wait">
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-[11px] leading-relaxed max-w-sm mx-auto text-left flex gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                  <p className="font-medium text-emerald-700">{successMessage}</p>
                </motion.div>
              )}
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-[11px] leading-relaxed max-w-sm mx-auto text-left flex gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="font-medium text-red-700">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. Action Buttons */}
            <div className="space-y-3 max-w-sm mx-auto pt-2">
              {/* Primary button: Open Gmail */}
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/10 active:scale-98 cursor-pointer"
              >
                <span>Open Gmail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {/* Secondary button: Back to Sign In */}
              <button
                type="button"
                onClick={() => {
                  setNeedsVerification(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                  setIsLogin(true);
                }}
                className="w-full bg-white hover:bg-[#FAF8F5] border border-[#EBE5DB] hover:border-brand-text-secondary py-3 rounded-xl text-xs font-bold text-brand-text-secondary transition-all active:scale-98 cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

            {/* 5. Small text link: Resend verification email (Show only after 30 seconds) */}
            <div className="pt-2">
              {timer > 30 ? (
                <p className="text-[10px] text-gray-400 font-medium">
                  Resend verification email available in {timer - 30}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-[11px] text-brand-primary hover:underline font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? 'Resending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <AnimatePresence mode="wait">
              {/* Registration Only Fields */}
              {!isLogin && !isForgot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Common Email field */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
              />
            </div>

            {/* Password field (hidden in forgot) */}
            {!isForgot && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password (Min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Forgot password trigger link */}
            {isLogin && !isForgot && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                    setIsNotVerified(false);
                  }}
                  className="text-[11px] text-gray-400 hover:text-brand-primary transition-colors font-semibold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Forgot password Back option */}
            {isForgot && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                    setIsNotVerified(false);
                  }}
                  className="text-[11px] text-brand-primary hover:underline font-bold cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/10 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {isForgot 
                      ? 'Send Reset Link' 
                      : isLogin 
                        ? 'Sign In to Account' 
                        : 'Register Account'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Trust badge footer inside login card */}
        <div className="border-t border-[#FAF8F5] pt-5 text-center space-y-2 text-[10px] text-brand-text-secondary">
          <p className="flex items-center justify-center gap-1.5 font-bold text-brand-primary/80">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
            CE Certified Non-Toxic Play Safe Guarantee
          </p>
          <div className="flex justify-center gap-3 font-semibold text-gray-400">
            <span>• Solid Beechwood</span>
            <span>• Plant Dyes</span>
            <span>• FSC Sourced</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
