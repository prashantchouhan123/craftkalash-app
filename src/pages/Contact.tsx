import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MapPin, Phone, HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function Contact() {
  const { addToast } = useShop();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      addToast("Thank you! Your message has been received.", 'success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('[Contact Form Error]:', error);
      addToast(error.message || 'There was a problem sending your message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems: FaqItem[] = [
    {
      question: 'Are your toys safe for infants who chew on everything?',
      answer: 'Yes, absolutely. Our wood fibers are entirely sealed with non-toxic linseed oils and natural beeswax. We never use volatile organic chemicals, lead paints, or chemical lacquers. All dyes are plant-soluble and fully saliva-safe.'
    },
    {
      question: 'Where do you harvest and source your timbers?',
      answer: 'Our wood is sourced from FSC-certified sustainable forest cooperatives in the foothills of India and Central Europe. These forests grow under state-regulated replanting programs to ensure there is zero net-loss of green vegetation.'
    },
    {
      question: 'Do you offer replacements for lost or damaged parts?',
      answer: 'Since we wish for our toys to remain heirloom pieces for generations, we maintain small reserve batches of individual blocks, pegs, and wheels. If you lose a puzzle piece or modular car magnet, please contact us.'
    },
    {
      question: 'Do you ship globally and how is it packaged?',
      answer: 'We ship to conscious homes globally. To maintain our strict eco-standards, every shipment is packaged in recycled corrugated boxes with biodegradable starch packing peanuts and water-activated paper tape—100% plastic-free.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-36 pb-20 space-y-20">
      {/* Title */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs text-brand-accent uppercase tracking-widest font-black">Get In Touch</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-text-primary tracking-tight leading-tight">
          We’d Love to Hear From You
        </h1>
        <p className="text-base text-brand-text-secondary leading-relaxed font-light">
          Whether you’re looking to stock a boutique, inquire about custom heirloom commissions, or simply want to ask about our wood finish safety guidelines.
        </p>
      </div>

      {/* Grid: Contact Information & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Info details */}
        <div className="lg:col-span-5 space-y-8 bg-white border border-[#EBE5DB] p-8 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-brand-text-primary tracking-tight">
            CraftKalash Showrooms
          </h2>
          
          <p className="text-xs text-brand-text-secondary leading-relaxed font-normal">
            Drop by our physical slow-parenting play showrooms to experience the smooth tactile weight of maple and walnut first-hand.
          </p>

          <div className="space-y-6 text-sm text-brand-text-primary font-medium">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#FCFBF9] flex items-center justify-center text-brand-primary shrink-0 border border-[#EBE5DB]">
                <MapPin className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-text-primary">Workshop &amp; Registered Address</h4>
                <p className="text-[11px] text-brand-text-secondary font-medium mt-0.5 leading-relaxed">
                  C/O: Vinay Panchal, ward no 10 budnighat, Budni, Sehore, Madhya Pradesh - 466445
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#FCFBF9] flex items-center justify-center text-brand-primary shrink-0 border border-[#EBE5DB]">
                <Mail className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-text-primary">Artisanal Inquiries</h4>
                <p className="text-[11px] text-brand-text-secondary font-medium mt-0.5 leading-relaxed">
                  craftkalash.store@gmail.com
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#FCFBF9] flex items-center justify-center text-brand-primary shrink-0 border border-[#EBE5DB]">
                <Phone className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-text-primary">Phone Support</h4>
                <p className="text-[11px] text-brand-text-secondary font-medium mt-0.5 leading-relaxed">
                  +91 9303436134 (Mon - Sat, 10am - 6pm IST)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-white border border-[#EBE5DB] p-8 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-brand-text-primary tracking-tight mb-6">
            Send Us a Message
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number (optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="What can we help you with?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">
                Your Message *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Type your message or inquiry here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-[#FAF8F5]/50 border border-[#EBE5DB] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary/10 text-brand-text-primary font-semibold placeholder-gray-400 resize-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold tracking-wide hover:bg-brand-primary/95 shadow-md shadow-brand-primary/10 transition-all cursor-pointer active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending Message...' : 'Submit Message'}
            </button>
          </form>
        </div>
      </div>

      {/* Accordion FAQ section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs text-brand-accent uppercase tracking-widest font-black flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Curious Minds Ask
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqItems.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-brand-border/60 rounded-2xl overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 flex justify-between items-center text-left hover:bg-brand-bg/30 transition-colors"
                >
                  <span className="text-xs font-extrabold text-brand-text-primary">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-brand-primary transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pt-1 border-t border-brand-border/40 text-xs text-brand-text-secondary leading-relaxed font-light">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
