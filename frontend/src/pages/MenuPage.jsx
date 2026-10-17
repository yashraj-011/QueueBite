import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UtensilsCrossed, 
  ShoppingBag, 
  ArrowRight, 
  Leaf, 
  X 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FoodCard from '../components/common/FoodCard';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // all, veg, vegan
  const [loading, setLoading] = useState(true);

  const { totalCount, subtotal } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [menuData, catData] = await Promise.all([
          api.getMenu(),
          api.getCategories()
        ]);
        setItems(menuData || []);
        if (catData && catData.length > 0) {
          setCategories(['All', ...catData]);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (dietaryFilter !== 'all' && item.dietary_classification !== dietaryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTags = item.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-28">
      {/* Header Banner - Editorial & Restrained */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-card space-y-5">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-surface-muted text-brand-green text-xs font-bold border border-brand-green/20">
            Fresh Everyday
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-text">
            Canteen Menu & Daily Specials
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Prepared fresh to order. Select items, add to your cart, and reserve a dedicated pickup window.
          </p>
        </div>

        {/* Search & Dietary Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search samosa, sandwich, masala dosa, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-stone-50 border border-brand-border text-brand-text font-medium text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dietary Toggle */}
          <div className="flex bg-stone-50 rounded-lg p-1 border border-brand-border shrink-0">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dietaryFilter === 'all'
                  ? 'bg-white text-brand-text shadow-2xs font-bold'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                dietaryFilter === 'veg'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-600" /> Veg
            </button>
            <button
              onClick={() => setDietaryFilter('vegan')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dietaryFilter === 'vegan'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              Vegan
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-green text-white font-bold shadow-soft'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-green/30'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid of Food Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-68 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-brand-border space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-brand-muted mx-auto stroke-1" />
          <h3 className="font-display font-bold text-base text-brand-text">No items matched your filters</h3>
          <p className="text-xs text-brand-muted">Try clearing the search term or category filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setDietaryFilter('all');
            }}
            className="px-4 py-1.5 rounded-lg bg-brand-surface-muted text-brand-green text-xs font-semibold hover:bg-brand-green hover:text-white transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {totalCount > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-5 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none"
          >
            <div className="max-w-lg mx-auto bg-brand-text text-white rounded-xl p-3 shadow-elevated flex items-center justify-between border border-white/10 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-green text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-bold text-xs sm:text-sm">
                    {totalCount} {totalCount === 1 ? 'item' : 'items'} in cart
                  </div>
                  <div className="text-[11px] text-stone-300">
                    Subtotal: <span className="font-bold text-white">₹{subtotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/cart"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors shadow-soft"
              >
                Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
