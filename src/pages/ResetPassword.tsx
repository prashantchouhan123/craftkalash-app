import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, CheckCircle2, ShieldCheck, Eye, EyeOff, KeyRound, Sparkles, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabaseService';

export default function ResetPassword() {
  const { addToast } = useShop();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const checkSessionAndErrors = async () => {
      // 1. Check for stored recovery error (e.g. link expired or invalid)
      const storedError =
        sessionStorage.getItem('password_recovery_error') ||
        localStorage.getItem('password_recovery_error');
      if (storedError) {
        setStatus('error');
        setMessage(storedError);
        setToast({
          type: 'error',
          title: 'Reset Link Expired or Invalid',
          message: storedError
        });
        sessionStorage.removeItem('password_recovery_error');
        localStorage.removeItem('password_recovery_error');
        return;
      }

      // 2. Check current user session
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          console.log('[ResetPassword] Note: Session resolving or pending user authentication.');
        }
      } catch (err) {
        console.error('[ResetPassword] Session check exception:', err);
      }
    };
    checkSessionAndErrors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setToast(null);

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      setToast({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      setToast({
        type: 'error',
        title: 'Mismatch',
        message: 'The new password and confirm password fields do not match.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await authService.resetPassword(password);
      if (res.error) {
        setStatus('error');
        setMessage(res.error || 'Failed to update your password. The reset link may have expired.');
        setToast({
          type: 'error',
          title: 'Reset Link Expired or Invalid',
          message: res.error || 'Failed to update password. Please request a new password reset email.'
        });
      } else {
        setStatus('success');
        setMessage('Your password has been successfully updated.');
        addToast('Password updated successfully!', 'success');
        
        // Clean up recovery storage flags
        sessionStorage.removeItem('is_password_recovery');
        localStorage.removeItem('is_password_recovery');
        sessionStorage.removeItem('password_recovery_error');
        localStorage.removeItem('password_recovery_error');
        sessionStorage.removeItem('reset_password_email_sent');
        localStorage.removeItem('reset_password_email_sent');

        // Log out of the current recovery session so user signs in cleanly
        await authService.logout();
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred during password reset.');
      setToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An unexpected error occurred during password reset.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] text-[#2C1D16] flex flex-col justify-center items-center px-4 py-12 sm:py-20 relative overflow-hidden font-sans selection:bg-[#785338]/20 selection:text-[#2C1D16]">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#EAE0D2] via-[#E2D4C0] to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-gradient-to-tl from-[#E2D5C3] via-[#FAF7F2] to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(#8C6D53_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Toast Notification Container */}
        <AnimatePresence mode="wait">
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className={`w-full mb-4 p-4 rounded-2xl border backdrop-blur-xl shadow-xl flex items-start justify-between gap-3 ${
                toast.type === 'error'
                  ? 'bg-rose-50/95 border-rose-200/80 text-rose-950'
                  : 'bg-emerald-50/95 border-emerald-200/80 text-emerald-950'
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
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Luxury Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/85 backdrop-blur-2xl border border-[#E3D8C8] rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(72,46,26,0.08)] relative z-10 space-y-6"
        >
          {/* Top line accent */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#8C6D53] to-transparent opacity-80" />

          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-[#2D1E17] to-[#4A3226] rounded-2xl flex items-center justify-center shadow-lg shadow-amber-950/15 border border-amber-900/20">
              <KeyRound className="w-7 h-7 text-amber-200" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#2C1D16] tracking-tight">
                New Password
              </h2>
              <p className="text-xs text-[#786355] leading-relaxed max-w-[300px] mx-auto font-normal">
                Enter your new password below to secure your CraftKalash account.
              </p>
            </div>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-3"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-serif font-bold text-[#2C1D16]">
                  Password Reset Complete!
                </h3>
                <p className="text-xs text-[#6B574A] leading-relaxed max-w-[280px] mx-auto">
                  Your new password is now active. Please log in to your account with your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-[#4A3226] via-[#3D291F] to-[#2D1D16] text-amber-50 py-3.5 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-950/15 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4 text-amber-200" />
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password (Min. 6 chars)"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-10 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] hover:text-[#4A3226] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password Field */}
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] group-focus-within:text-[#4A3226] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E3D8C8] rounded-2xl pl-10 pr-10 py-3.5 text-xs font-semibold text-[#2C1D16] placeholder-[#A39285] focus:bg-white focus:border-[#6B4B38] focus:ring-4 focus:ring-[#6B4B38]/10 focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E8B7E] hover:text-[#4A3226] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Save Password Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#4A3226] via-[#3D291F] to-[#2D1D16] text-amber-50 py-3.5 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-950/15 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving New Password...</span>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4 text-amber-200" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-xs font-semibold text-[#786355] hover:text-[#2C1D16] transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Footer badge */}
          <div className="border-t border-[#FAF5EE] pt-4 text-center space-y-1 text-[10px] text-[#8C7B70]">
            <p className="flex items-center justify-center gap-1.5 font-bold text-[#4A3226]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>CraftKalash Account Protection</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

