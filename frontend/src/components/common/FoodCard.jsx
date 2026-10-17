import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function FoodCard({ item }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find(i => i.id === item.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isSoldOut = !item.is_available || (item.stock !== null && item.stock <= 0);

  return (
    <div
      className={`bg-white rounded-xl border border-brand-border overflow-hidden shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group ${
        isSoldOut ? 'opacity-70' : ''
      }`}
    >
      {/* Food Image Container */}
      <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback Graphic */}
        <div 
          className="w-full h-full flex flex-col items-center justify-center bg-brand-surface-muted text-brand-muted text-2xl font-bold"
          style={{ display: item.image_url ? 'none' : 'flex' }}
        >
          <span>🍽️</span>
        </div>

        {/* Dietary Tag (Veg / Non-veg dot) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded-[4px] flex items-center justify-center bg-white/95 backdrop-blur-sm border ${
            item.dietary_classification === 'veg' ? 'border-emerald-700' : 'border-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              item.dietary_classification === 'veg' ? 'bg-emerald-700' : 'bg-red-700'
            }`} />
          </span>

          {item.tags && item.tags.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-brand-orange text-white text-[10px] font-bold tracking-wide shadow-2xs">
              {item.tags[0]}
            </span>
          )}
        </div>

        {/* Preparation Time Tag */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-300" />
          {item.preparation_minutes}m
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-display font-bold text-sm text-brand-text group-hover:text-brand-green transition-colors leading-snug line-clamp-1">
            {item.name}
          </h3>

          <p className="text-[12px] text-brand-muted line-clamp-2 leading-relaxed mt-1 font-normal">
            {item.description || 'Prepared fresh upon order at the college canteen.'}
          </p>
        </div>

        {/* Pricing & Cart Action */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-border/70">
          <div>
            <div className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Price</div>
            <div className="font-display font-extrabold text-base text-brand-text">
              ₹{Number(item.price).toFixed(0)}
            </div>
          </div>

          {isSoldOut ? (
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 font-semibold text-xs border border-stone-200">
              Sold Out
            </span>
          ) : inCartQty > 0 ? (
            <div className="flex items-center bg-brand-surface-muted border border-brand-green/30 rounded-lg p-0.5">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="w-6 h-6 rounded-md bg-white text-brand-green hover:bg-brand-green hover:text-white flex items-center justify-center font-bold transition-colors shadow-2xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-display font-bold text-xs text-brand-green">
                {inCartQty}
              </span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                className="w-6 h-6 rounded-md bg-white text-brand-green hover:bg-brand-green hover:text-white flex items-center justify-center font-bold transition-colors shadow-2xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(item, 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors shadow-soft"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
