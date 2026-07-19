import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const { login, register, user, isSupabaseConfigured } = useShop();
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

  // Success message after reset
  const [resetSent, setResetSent] = useState(false);

  // Auto redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isForgot) {
        // Trigger simulated or real forgot password
        setTimeout(() => {
          setResetSent(true);
          setIsSubmitting(false);
        }, 800);
      } else if (isLogin) {
        const success = await login(email, password);
        if (success) {
          navigate('/account');
        }
      } else {
        const success = await register(fullName, email, phone, password);
        if (success) {
          navigate('/account');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg/20 flex items-center justify-center px-4 pt-32 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white border border-brand-border/60 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6 z-10 overflow-hidden"
      >
        {/* Top organic accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-accent" />

        {/* Supabase Status Banner */}
        {!isSupabaseConfigured && (
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-3 flex gap-2.5 text-[11px] text-brand-text-secondary leading-normal">
            <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-primary block">Demo Mode Active</strong>
              Supabase keys are currently empty. Local Storage state machine will handle registration & orders instantly!
            </div>
          </div>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <span className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center font-black text-white text-lg mx-auto shadow-sm">
            CK
          </span>
          <h2 className="text-2xl font-black text-brand-text-primary tracking-tight font-heading">
            {isForgot ? 'Reset Woodcraft Password' : isLogin ? 'Access Heirlooms' : 'Join CraftFamily'}
          </h2>
          <p className="text-xs text-brand-text-secondary font-light">
            {isForgot 
              ? 'Enter email to receive restoration links'
              : isLogin 
                ? 'Sign in to sync your wishlist, track orders and write reviews' 
                : 'Create an account to join workshops, customize orders & build memories'}
          </p>
        </div>

        {/* Mode Switcher */}
        {!isForgot && (
          <div className="grid grid-cols-2 gap-1 bg-brand-bg/60 p-1 rounded-xl border border-brand-border/40 text-xs font-bold">
            <button
              onClick={() => setIsLogin(true)}
              className={`py-2 rounded-lg transition-all ${isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-2 rounded-lg transition-all ${!isLogin ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-brand-text-primary'}`}
            >
              Register
            </button>
          </div>
        )}

        {/* Registration / Login / Forgot Form */}
        {resetSent ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-800">Restoration Link Dispatched</h4>
            <p className="text-xs text-emerald-600 font-light leading-relaxed">
              If that account is registered with CraftKalash, check your email inbox for password configuration instructions.
            </p>
            <button
              onClick={() => {
                setResetSent(false);
                setIsForgot(false);
                setIsLogin(true);
              }}
              className="text-xs text-brand-primary font-bold hover:underline"
            >
              Back to Sign In
            </button>
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
                      placeholder="Your Full Name (E.g. Sarah Parker)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold placeholder-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Contact Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold placeholder-gray-400"
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
                className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold placeholder-gray-400"
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
                  className="w-full bg-brand-bg/40 border border-brand-border/60 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-brand-primary text-brand-text-primary font-bold placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors focus:outline-none"
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
                  onClick={() => setIsForgot(true)}
                  className="text-[11px] text-gray-400 hover:text-brand-primary transition-colors font-medium hover:underline"
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
                  onClick={() => setIsForgot(false)}
                  className="text-[11px] text-brand-primary hover:underline font-bold"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 transition-all shadow-md active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Transmitting Session...</span>
              ) : (
                <>
                  <span>
                    {isForgot 
                      ? 'Dispatch Link' 
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
        <div className="border-t border-brand-border/40 pt-4 text-center space-y-2 text-[10px] text-brand-text-secondary">
          <p className="flex items-center justify-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
            CE Certified Non-Toxic Play Safe Guarantee
          </p>
          <div className="flex justify-center gap-3 font-semibold">
            <span>• Solid Beechwood</span>
            <span>• Plant Dyes</span>
            <span>• FSC Sourced</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
