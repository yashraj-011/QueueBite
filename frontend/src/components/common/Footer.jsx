import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-border/80 pt-12 pb-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-brand-border/70">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-xl tracking-tight text-brand-text">
                Queue<span className="text-brand-green">Bite</span>
              </span>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed">
              Skip the Queue. Savor the Break. The college canteen pre-order and slot pickup management platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-xs text-brand-text uppercase tracking-wider mb-3">
              Student Hub
            </h4>
            <ul className="space-y-2 text-xs text-brand-muted">
              <li><Link to="/menu" className="hover:text-brand-green transition-colors">Daily Canteen Menu</Link></li>
              <li><Link to="/cart" className="hover:text-brand-green transition-colors">My Food Cart</Link></li>
              <li><Link to="/track" className="hover:text-brand-green transition-colors">Live Token Tracker</Link></li>
              <li><Link to="/history" className="hover:text-brand-green transition-colors">Order Receipts</Link></li>
            </ul>
          </div>

          {/* Staff & Admin */}
          <div>
            <h4 className="font-display font-bold text-xs text-brand-text uppercase tracking-wider mb-3">
              Operations
            </h4>
            <ul className="space-y-2 text-xs text-brand-muted">
              <li><Link to="/staff" className="hover:text-brand-green transition-colors">Kitchen Dispatch Board</Link></li>
              <li><Link to="/admin" className="hover:text-brand-green transition-colors">Admin Operations & Analytics</Link></li>
              <li><Link to="/login" className="hover:text-brand-green transition-colors">Staff / Admin Login</Link></li>
            </ul>
          </div>

          {/* Value Badges */}
          <div>
            <h4 className="font-display font-bold text-xs text-brand-text uppercase tracking-wider mb-3">
              Campus Highlights
            </h4>
            <div className="space-y-2 text-xs text-brand-muted">
              <div className="flex items-center gap-2 text-brand-text font-medium">
                <Zap className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                10-min reserved pickup slots
              </div>
              <div className="flex items-center gap-2 text-brand-text font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                Real-time UPI & cash verification
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-muted gap-3">
          <p>© {new Date().getFullYear()} QueueBite System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with React, Node.js & Supabase PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
}
