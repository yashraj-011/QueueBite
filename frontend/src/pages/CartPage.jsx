import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, subtotal, totalCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [note, setNote] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSlots() {
      try {
        setLoadingSlots(true);
        const available = await api.getAvailableSlots();
        setSlots(available || []);
        if (available && available.length > 0) {
          setSelectedSlotId(available[0].id);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, []);

  const handleCheckout = async () => {
    setErrorMsg('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (!selectedSlotId) {
      setErrorMsg('Please select a pickup time window.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        pickupSlotId: selectedSlotId,
        paymentMethod,
        note,
        items: cart.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity
        }))
      };

      const result = await api.placeOrder(payload);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Clear cart and navigate to order tracker
      clearCart();
      navigate(`/track?token=${encodeURIComponent(result.token)}&id=${result.order_id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-surface-muted text-brand-green flex items-center justify-center mx-auto border border-brand-green/20">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-2xl text-brand-text">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
            You haven't added any canteen items yet. Explore today's freshly prepared specials.
          </p>
        </div>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-green text-white font-semibold text-xs shadow-soft hover:bg-brand-green-dark transition-colors"
        >
          Explore Canteen Menu <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-text">
          Review & Checkout
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted">
          Confirm your items, reserve your break pickup window, and generate your live digital token.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List & Notes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/70">
              <h2 className="font-display font-bold text-sm text-brand-text">
                Your Order Items ({totalCount})
              </h2>
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-brand-muted hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="divide-y divide-brand-border/60">
              {cart.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-brand-border">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="font-display font-bold text-xs sm:text-sm text-brand-text truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-brand-muted">
                        ₹{item.price.toFixed(0)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-50 border border-brand-border rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white text-brand-text hover:bg-stone-200 flex items-center justify-center transition-colors text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-brand-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-white text-brand-text hover:bg-stone-200 flex items-center justify-center transition-colors text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right w-14">
                      <span className="font-display font-bold text-xs sm:text-sm text-brand-text">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Instructions */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-2">
            <label className="font-display font-bold text-xs text-brand-text block">
              Special Kitchen Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, extra green chutney, no ice..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-stone-50 border border-brand-border text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>
        </div>

        {/* Right Column: Slot Selection & Checkout Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pickup Slot Selector */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-green" />
                <h3 className="font-display font-bold text-sm text-brand-text">
                  Choose Pickup Slot
                </h3>
              </div>
              <span className="text-[11px] font-medium text-brand-muted">
                10-min windows
              </span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs">
                No active pickup windows currently available.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {slots.map((s) => {
                  const isSelected = selectedSlotId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSlotId(s.id)}
                      className={`p-2.5 rounded-lg text-left border transition-all ${
                        isSelected
                          ? 'border-brand-green bg-brand-surface-muted ring-1 ring-brand-green'
                          : 'border-brand-border bg-white hover:border-brand-green/40'
                      }`}
                    >
                      <div className="font-display font-bold text-xs text-brand-text">
                        {s.start_time} - {s.end_time}
                      </div>
                      <div className="text-[10px] text-brand-muted mt-0.5 flex items-center justify-between">
                        <span>Cap: {s.max_orders}</span>
                        <span className="font-semibold text-brand-green">{s.remaining} left</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-3">
            <h3 className="font-display font-bold text-sm text-brand-text">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-brand-green bg-brand-surface-muted ring-1 ring-brand-green'
                    : 'border-brand-border hover:border-brand-green/30'
                }`}
              >
                <CreditCard className={`w-4 h-4 mb-1.5 ${paymentMethod === 'UPI' ? 'text-brand-green' : 'text-brand-muted'}`} />
                <div className="font-display font-bold text-xs text-brand-text">UPI / Online</div>
                <div className="text-[10px] text-brand-muted">Instant validation</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Counter')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  paymentMethod === 'Counter'
                    ? 'border-brand-green bg-brand-surface-muted ring-1 ring-brand-green'
                    : 'border-brand-border hover:border-brand-green/30'
                }`}
              >
                <Banknote className={`w-4 h-4 mb-1.5 ${paymentMethod === 'Counter' ? 'text-brand-green' : 'text-brand-muted'}`} />
                <div className="font-display font-bold text-xs text-brand-text">Pay at Counter</div>
                <div className="text-[10px] text-brand-muted">Cash on pickup</div>
              </button>
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-4">
            <div className="space-y-1.5 text-xs text-brand-muted pb-3 border-b border-brand-border/70">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-brand-text">₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Queue Skip Service</span>
                <span className="font-semibold text-brand-green">FREE (₹0)</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-display font-bold text-sm text-brand-text">Total Payable</span>
              <span className="font-display font-black text-xl text-brand-green">
                ₹{subtotal.toFixed(0)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs shadow-soft transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating Token...</span>
              ) : (
                <>
                  <span>Place Order & Generate Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-brand-muted">
              Guaranteed slot reservation. Atomic lock prevents counter stockouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
