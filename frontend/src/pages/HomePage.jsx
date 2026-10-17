import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Flame, 
  ChevronRight,
  UtensilsCrossed,
  CalendarCheck,
  Ticket
} from 'lucide-react';
import FoodScene from '../components/3d/FoodScene';
import FoodCard from '../components/common/FoodCard';
import { api } from '../services/api';

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const items = await api.getMenu();
        const featured = items.filter(i => i.tags && i.tags.includes('Bestseller')).slice(0, 4);
        setBestsellers(featured.length > 0 ? featured : items.slice(0, 4));
      } catch (err) {
        console.error('Failed to load menu items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="space-y-20 lg:space-y-28">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 pb-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Editorial Value Proposition */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface-muted text-brand-green text-xs font-bold tracking-wide border border-brand-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                College Canteen Pre-Ordering
              </div>

              {/* Headline */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-5xl tracking-tight text-brand-text leading-[1.12]">
                Your Break. Your Food. <br className="hidden sm:inline" />
                <span className="text-brand-green">Your Time.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base text-brand-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Order your campus favorites ahead of time, choose your pickup slot, and collect your meal without waiting in line.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 group shadow-soft"
                >
                  Order Food Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/track"
                  className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white hover:bg-stone-50 border border-brand-border text-brand-text font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4 text-brand-muted" />
                  Track Live Token
                </Link>
              </div>

              {/* Restrained Benefit Metrics Row */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-brand-border/80 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="font-display font-bold text-xl text-brand-text">10-Min</div>
                  <div className="text-xs text-brand-muted mt-0.5">Pickup windows</div>
                </div>
                <div className="border-l border-brand-border/80 pl-6">
                  <div className="font-display font-bold text-xl text-brand-green">Live</div>
                  <div className="text-xs text-brand-muted mt-0.5">Digital token pass</div>
                </div>
                <div className="border-l border-brand-border/80 pl-6">
                  <div className="font-display font-bold text-xl text-brand-text">Zero</div>
                  <div className="text-xs text-brand-muted mt-0.5">Counter queueing</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Editorial Food Presentation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <FoodScene />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (CLEAN 3-STEP EXPLANATION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <div className="text-xs uppercase font-extrabold tracking-widest text-brand-green">
            Order Flow
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
            Three Steps to Fresh Hot Food
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted">
            Simple, reliable dining tailored for college class intervals and lecture breaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl p-6 border border-brand-border shadow-card hover:border-brand-green/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-brand-surface-muted text-brand-green flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-display font-bold text-base text-brand-text mb-2">
              Browse the Menu
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Explore today's live canteen offerings, customize items, and verify real-time item availability.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl p-6 border border-brand-border shadow-card hover:border-brand-green/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-brand-surface-muted text-brand-green flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-display font-bold text-base text-brand-text mb-2">
              Choose a Pickup Slot
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Reserve an exact 10-minute window matching your timetable break. Capacity caps prevent kitchen rushes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl p-6 border border-brand-border shadow-card hover:border-brand-green/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-brand-surface-muted text-brand-green flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-display font-bold text-base text-brand-text mb-2">
              Collect with Your Token
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Receive your confirmed sequential digital token. Flash the QR screen at counter dispatch to collect.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CAMPUS BESTSELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-brand-border/60 pb-4">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-brand-green flex items-center gap-1.5 mb-1">
              Campus Specials
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-text">
              Popular Canteen Bites
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-1 font-semibold text-xs text-brand-green hover:text-brand-green-dark transition-colors"
          >
            Explore Full Menu <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-72 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* 4. REFINED CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-surface-muted rounded-2xl p-8 sm:p-12 border border-brand-green/20 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-brand-text leading-snug">
              Ready to make the most of your college break?
            </h3>
            <p className="text-brand-muted text-xs sm:text-sm leading-relaxed max-w-lg">
              Order your favorite meal in advance with reserved pickup windows, convenient online or counter payment, and real-time token tracking.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="px-6 py-2.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors shadow-soft"
              >
                Browse Canteen Menu
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg bg-white hover:bg-stone-50 text-brand-text border border-brand-border font-semibold text-xs transition-colors"
              >
                Student Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
