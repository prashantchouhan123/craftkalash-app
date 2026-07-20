import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { motion } from 'motion/react';
import { Lock, ArrowRight, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabaseService';

export default function ResetPassword() {
  const { addToast } = useShop();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // We should verify that we can parse the session from hash or that the user is logged in
  useEffect(() => {
    // Supabase automatically parses recovery hashes into a session, so we should have a session.
    // Let's do a quick check to ensure the user is logged in or wait briefly for Supabase to resolve the session.
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          // It is possible the hash is still processing or there is no session.
          // We won't block immediately, but we will warn the user if they submit and it fails.
        }
      } catch (err) {
        console.error('Error checking recovery session:', err);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      addToast('Password too short', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      addToast('Passwords do not match', 'error');
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
        addToast(res.error || 'Password update failed', 'error');
      } else {
        setStatus('success');
        setMessage('Your password has been successfully updated.');
        addToast('Password updated successfully!', 'success');
        
        // Log out of the current recovery session to force a fresh login with the new credentials
        await authService.logout();
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred during password reset.');
      addToast('Error resetting password', 'error');
    } finally {
      setIsSubmitting(false);
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

        {/* Header Branding */}
        <div className="text-center space-y-3.5">
          <div className="py-1">
            <img
              src="/logo.svg"
              alt="CraftKalash Logo"
              className="h-11 w-auto mx-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-brand-text-primary tracking-tight font-heading">
              Configure New Password
            </h2>
            <p className="text-[11px] text-brand-text-secondary font-medium leading-relaxed max-w-[280px] mx-auto">
              Choose a strong, secure password of at least 6 characters for your heirloom craft account.
            </p>
          </div>
        </div>

        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4"
          >
            <CheckCircle className="w-10 h-10 text-brand-success mx-auto" />
            <h4 className="text-sm font-bold text-emerald-800">Password Updated</h4>
            <p className="text-xs text-emerald-600 font-light leading-relaxed">
              Your new password is now active. You can log in to your account with your updated credentials.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-brand-primary text-white py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {status === 'error' && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl flex gap-2.5 items-start">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed font-semibold">
                  {message}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="New Password (Min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/10 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Trust badge footer */}
        <div className="border-t border-[#FAF8F5] pt-5 text-center space-y-2 text-[10px] text-brand-text-secondary">
          <p className="flex items-center justify-center gap-1.5 font-bold text-brand-primary/80">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
            CE Certified Non-Toxic Play Safe Guarantee
          </p>
        </div>
      </motion.div>
    </div>
  );
}
