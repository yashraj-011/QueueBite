import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FoodScene() {
  return (
    <div className="relative w-full aspect-4/3 sm:aspect-16/11 lg:aspect-4/3 rounded-2xl overflow-hidden border border-brand-border bg-stone-100 shadow-card group">
      {/* Editorial Food Image */}
      <img
        src="/images/hero_editorial.jpg"
        alt="Artisanal canteen breakfast with grilled sandwich, samosas and cold coffee"
        className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
        loading="eager"
      />

      {/* Subtle Bottom Ambient Gradient for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Top Floating Badge - Freshly Prepared */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brand-border shadow-soft flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
        <span className="text-xs font-bold text-brand-text">Prepared Fresh to Order</span>
      </motion.div>

      {/* Bottom Floating Badge - Quick Pickup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-brand-border shadow-soft flex items-center gap-2.5"
      >
        <div className="w-7 h-7 rounded-md bg-brand-surface-muted text-brand-green flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-brand-muted uppercase font-bold tracking-wider leading-none">
            Break Windows
          </div>
          <div className="text-xs font-bold text-brand-text leading-tight mt-0.5">
            10-Minute Reserved Slots
          </div>
        </div>
      </motion.div>
    </div>
  );
}
