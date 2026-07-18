import React, { useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  ArrowRight, 
  Download, 
  ShoppingBag, 
  Truck, 
  Clock, 
  Package, 
  Check, 
  MapPin, 
  Calendar,
  Sparkles,
  FileText
} from 'lucide-react';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // Fallback defaults if accessed directly or refreshed
  const orderDetails = location.state || {
    orderNumber: `CK-${Math.floor(100000 + Math.random() * 900000)}`,
    estimatedDelivery: 'Wednesday, July 22, 2026',
    paymentMethod: 'CARD',
    totalAmount: 48.00,
    orderId: `ord-${Date.now()}`
  };

  const handleDownloadInvoice = () => {
    // Elegant system print or custom download trigger
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-32 pb-24 text-brand-text-primary text-xs">
      {/* SUCCESS ANIMATION CONTAINER */}
      <div className="text-center space-y-5 mb-10">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
          <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-black tracking-tight">Your Wooden Toy Crate is Confirmed!</h1>
          <p className="text-sm text-brand-text-secondary font-light max-w-md mx-auto leading-relaxed">
            The artisans in our workshop are selecting appropriate timber blocks and preparing to hand-apply organic linseed coatings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Confirmation Specifications & Tracker Timeline */}
        <div ref={printRef} className="md:col-span-7 bg-white border border-brand-border/60 p-6 sm:p-8 rounded-3xl shadow-xs space-y-8">
          
          {/* Order Details header */}
          <div className="border-b border-brand-border/40 pb-5 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Database Order Code</span>
              <strong className="text-xl font-heading font-black text-brand-primary font-mono">{orderDetails.orderNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount Settled</span>
              <strong className="text-lg font-heading font-black text-brand-secondary">${Number(orderDetails.totalAmount).toFixed(2)}</strong>
            </div>
          </div>

          {/* Timeline tracking progress */}
          <div className="space-y-4">
            <h3 className="font-extrabold uppercase text-[10px] tracking-wider text-brand-text-secondary flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-primary" />
              Workshop Pipeline Track
            </h3>

            {/* Premium Timeline indicator */}
            <div className="space-y-5 pl-2 pt-2">
              {[
                { title: 'Order Registered', desc: 'Secure database transaction resolved.', status: 'completed', time: 'Just Now' },
                { title: 'Confirmed & Wood Selection', desc: 'Timber blocks sourced from certified FSC spruce forests.', status: 'active', time: 'Pending Sourcing' },
                { title: 'Packed & Hand-Oiled', desc: 'Finished products carefully coated with organic linseed oil.', status: 'upcoming', time: 'Estimated tomorrow' },
                { title: 'Shipped & Dispatched', desc: 'Order leaves Jodhpur workshop in premium cardboard casing.', status: 'upcoming', time: 'Estimated 2 days' },
                { title: 'Out for Delivery', desc: 'Assigned to courier master near your local destination.', status: 'upcoming', time: 'Estimated 3 days' },
                { title: 'Delivered safely', desc: 'Handed to recipient for generations of sustainable play.', status: 'upcoming', time: 'Estimated 4 days' }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative pb-1">
                  {/* Vertical bar connection */}
                  {idx < 5 && (
                    <div className="absolute left-2.5 top-6 bottom-[-20px] w-0.5 bg-brand-border/60" />
                  )}

                  {/* Indicator bullet */}
                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border text-[10px] z-10 ${
                    step.status === 'completed'
                      ? 'bg-brand-success text-white border-transparent'
                      : step.status === 'active'
                        ? 'bg-brand-primary text-white border-transparent animate-pulse'
                        : 'bg-white text-gray-300 border-brand-border'
                  }`}>
                    {step.status === 'completed' ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-baseline gap-2">
                      <strong className={`font-bold ${step.status === 'upcoming' ? 'text-gray-400 font-medium' : 'text-brand-text-primary'}`}>
                        {step.title}
                      </strong>
                      <span className="text-[10px] text-gray-400 font-bold">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary font-light mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-brand-border/60 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-brand-border/40 pb-3">
              Delivery Estimation
            </h3>

            <div className="flex items-start gap-3 bg-brand-bg p-4 rounded-xl border border-brand-border text-xs">
              <Calendar className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Estimated Handover</span>
                <strong className="text-sm font-black text-brand-primary block">{orderDetails.estimatedDelivery}</strong>
                <p className="text-[10px] text-brand-text-secondary leading-relaxed font-light">
                  Includes transit guarantee. A delivery associate will trigger SMS before doorstep arrival.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleDownloadInvoice}
                className="w-full border border-brand-border text-brand-text-primary py-3.5 rounded-xl text-xs font-bold hover:bg-brand-bg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-brand-primary" />
                Download Invoice PDF
              </button>

              <button
                onClick={() => navigate('/account')}
                className="w-full bg-brand-secondary text-white py-3.5 rounded-xl text-xs font-bold hover:bg-brand-secondary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                Track in Account Dashboard
              </button>

              <Link
                to="/shop"
                className="block text-center w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold hover:bg-brand-primary/95 transition-all"
              >
                Continue Sourcing Toys
              </Link>
            </div>
          </div>

          <div className="bg-brand-primary/5 border border-brand-primary/10 p-5 rounded-2xl text-[11px] text-brand-text-secondary leading-normal space-y-2">
            <h4 className="font-extrabold text-brand-primary uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              FSC certified sustainable
            </h4>
            <p className="font-light">
              CraftKalash designs use maple logs grown on certified organic German fields. Our colors derive strictly from biological root extractions. Standard 100-Year structural guarantee is backed by manual friction sealants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
