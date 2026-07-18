import { motion, AnimatePresence } from 'motion/react';
import { useShop } from '../context/ShopContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useShop();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-start gap-3 bg-white border border-brand-border rounded-xl p-4 shadow-xl text-brand-text-primary"
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle className="w-5 h-5 text-brand-success" />}
                {isError && <AlertTriangle className="w-5 h-5 text-brand-error" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-accent" />}
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
