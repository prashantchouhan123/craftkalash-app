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
  Eye,
  EyeOff,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabaseService';

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
  const [isResending, setIsResending] = useState(false);

  // Notification States
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResend, setShowResend] = useState(false);

  // Parse email verification tokens and parameters from URL hash / search
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    if (hash || search) {
      if (hash.includes('error_description=')) {
        const match = hash.match(/error_description=([^&]+)/);
        if (match) {
          const decoded = decodeURIComponent(match[1].replace(/\+/g, ' '));
          setErrorMessage(decoded);
        } else {
          setErrorMessage('Email verification link is invalid or has expired.');
        }
        setShowResend(true);
      } else if (
        hash.includes('type=signup') || 
        hash.includes('type=email_change') || 
        hash.includes('access_token') ||
        search.includes('verified=true')
      ) {
        setSuccessMessage('Email verified successfully. You can now log in.');
        setIsLogin(true);
        // Ensure user is signed out so they log in explicitly via the login form
        authService.logout();
      }
      // Clean up URL without triggering reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Auto redirect if logged in
  useEffect(() => {
    if (user && user.email_confirmed_at && isLogin) {
      navigate('/account');
    }
  }, [user, navigate, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setSuccessMessage('');
    setShowResend(false);

    setIsSubmitting(true);
    try {
      if (isForgot) {
        const res = await authService.forgotPassword(email);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Password reset link sent to your email. Please check your inbox.');
        }
      } else if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          navigate('/account');
        } else {
          setErrorMessage(res.error || 'Authentication failed');
          if (res.isNotVerified || (res.error && res.error.toLowerCase().includes('verify'))) {
            setShowResend(true);
          }
        }
      } else {
        const res = await register(fullName, email, phone, password);
        if (res.success) {
          if (res.needsVerification) {
            setSuccessMessage(
              `Registration successful! We have sent a verification email to ${email}. Please click the link in your email to verify your account before logging in.`
            );
            setIsLogin(true);
            setShowResend(true);
          } else {
            navigate('/');
          }
        } else {
          setErrorMessage(res.error || 'Registration failed');
          const errLower = (res.error || '').toLowerCase();
          if (errLower.includes('rate limit') || errLower.includes('already registered') || errLower.includes('verify')) {
            setShowResend(true);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address to receive a verification link.');
      return;
    }
    setIsResending(true);
    setErrorMessage('');
    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        setSuccessMessage(`A new verification email has been sent to ${email}. Please check your inbox.`);
      } else {
        setErrorMessage(res.error || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4 pt-32 pb-20 relative">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#f0ebe1_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-bg/40 rounded-full filter blur-3xl opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative bg-white border border-[#EBE5DB] rounded-3xl p-8 max-w-md w-full shadow-xl shadow-brand-primary/5 space-y-6 z-10 overflow-hidden"
      >
        {/* Top accent border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-primary" />

        {/* Header Branding */}
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
                ? 'Enter your registered email address below to receive password reset links.'
                : isLogin 
                  ? 'Access your saved wishlists, check order history, and manage custom orders.' 
                  : 'Join the CraftKalash family to order handcrafted non-toxic wooden toys.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        {!isForgot && (
          <div className="grid grid-cols-2 gap-1 bg-[#FDFCFB] p-1 rounded-xl border border-[#EBE5DB]/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setSuccessMessage('');
                setShowResend(false);
              }}
              className={`py-2 rounded-lg transition-all duration-200 cursor-pointer ${isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMessage('');
                setSuccessMessage('');
                setShowResend(false);
              }}
              className={`py-2 rounded-lg transition-all duration-200 cursor-pointer ${!isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Register
            </button>
          </div>
        )}

        {/* Alerts Block */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-2xl flex flex-col gap-2.5 text-[11px] leading-relaxed"
            >
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Action Required</span>
                  <p className="font-medium text-red-700">{errorMessage}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {!isLogin && (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('created') || errorMessage.toLowerCase().includes('sign in')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMessage('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-bold hover:bg-brand-primary/90 transition-colors cursor-pointer"
                  >
                    <span>Switch to Sign In</span>
                  </button>
                )}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isResending ? 'Sending Email...' : 'Resend Verification Email'}</span>
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
              className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl flex flex-col gap-2.5 text-[11px] leading-relaxed"
            >
              <div className="flex gap-2.5 items-start">
                <CheckCircle className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-emerald-900">Success</span>
                  <p className="font-medium text-emerald-700">{successMessage}</p>
                </div>
              </div>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isResending ? 'Sending...' : 'Resend Verification Email'}</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration / Login / Forgot Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <AnimatePresence mode="wait">
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

          {/* Email field */}
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

          {/* Password field */}
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

          {/* Forgot password link */}
          {isLogin && !isForgot && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                  setShowResend(false);
                }}
                className="text-[11px] text-gray-400 hover:text-brand-primary transition-colors font-semibold hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Back to Login link */}
          {isForgot && (
            <div className="text-left">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                  setShowResend(false);
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

        {/* Footer info */}
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
