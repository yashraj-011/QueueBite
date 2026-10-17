import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  PackageCheck, 
  AlertCircle, 
  Ban, 
  RefreshCw,
  QrCode,
  Utensils
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';

export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialId = searchParams.get('id') || '';

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async (searchToken, orderId) => {
    setErrorMsg('');
    setLoading(true);
    try {
      let data = null;
      if (orderId) {
        data = await api.getOrderById(orderId);
      } else if (searchToken) {
        data = await api.getOrderByToken(searchToken);
      }
      setOrder(data);
    } catch (err) {
      setErrorMsg(err.message || 'No matching order found.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId || initialToken) {
      fetchOrder(initialToken, initialId);
    } else {
      api.getMyOrders({ limit: 1 }).then(res => {
        if (res?.orders?.length > 0) {
          setOrder(res.orders[0]);
          setTokenInput(res.orders[0].token);
        }
      }).catch(() => {});
    }
  }, [initialToken, initialId]);

  // Polling every 5s for active orders
  useEffect(() => {
    if (!order) return;
    if (order.order_status === 'Collected' || order.order_status === 'Cancelled' || order.order_status === 'Missed') return;

    const interval = setInterval(async () => {
      try {
        const refreshed = await api.getOrderById(order.id);
        if (refreshed) setOrder(refreshed);
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.id, order?.order_status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    fetchOrder(tokenInput.trim(), null);
    setSearchParams({ token: tokenInput.trim() });
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      const res = await api.cancelOrder(order.id, 'Student cancelled via tracker');
      setOrder(res);
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { key: 'Placed', label: 'Order Placed', icon: Clock, desc: 'Logged & queued' },
    { key: 'Preparing', label: 'Kitchen Preparing', icon: ChefHat, desc: 'Cooking fresh' },
    { key: 'Ready', label: 'Ready for Pickup', icon: PackageCheck, desc: 'At counter' },
    { key: 'Collected', label: 'Collected', icon: CheckCircle2, desc: 'Meal received' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Placed': return 0;
      case 'Preparing': return 1;
      case 'Ready': return 2;
      case 'Collected': return 3;
      default: return -1;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.order_status) : -1;
  const isCancelled = order?.order_status === 'Cancelled';
  const isMissed = order?.order_status === 'Missed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-text">
          Live Order & Token Tracker
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
          Enter your daily token number to check real-time kitchen preparation status.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-sm mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. #001 or 001"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-brand-border text-brand-text font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors shadow-soft"
          >
            Track
          </button>
        </form>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-xl border border-brand-border space-y-2">
          <RefreshCw className="w-6 h-6 text-brand-green animate-spin mx-auto" />
          <p className="text-xs font-semibold text-brand-text">Locating order record...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {order && !loading && (
        <div className="space-y-6">
          {/* Main Digital Ticket Display Card */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-6">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/70">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-surface-muted text-brand-green flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                    Service Date: {order.service_date}
                  </div>
                  <div className="font-display font-bold text-sm text-brand-text">
                    Order ID: {order.id.slice(0, 8)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={order.payment_status === 'Paid' ? 'success' : 'warning'}>
                  {order.payment_status} ({order.payment_method})
                </Badge>
                {order.order_status === 'Placed' && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Token Highlight Grid */}
            <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3 text-center md:text-left">
                <div className="text-xs uppercase font-extrabold tracking-widest text-brand-green">
                  Your Pickup Token
                </div>
                <div className="font-display font-extrabold text-5xl sm:text-6xl text-brand-text tracking-tight">
                  {order.token}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-brand-muted pt-1">
                  <div className="flex items-center gap-1.5 font-semibold text-brand-text">
                    <Clock className="w-3.5 h-3.5 text-brand-orange" />
                    Slot: {order.slot_time_snapshot}
                  </div>
                  <div className="text-stone-300">•</div>
                  <div>Student: <span className="font-semibold text-brand-text">{order.student_name_snapshot}</span></div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 bg-stone-50 rounded-xl border border-brand-border">
                <QRCodeSVG
                  value={JSON.stringify({ order_id: order.id, token: order.token })}
                  size={120}
                  bgColor="#F9F8F5"
                  fgColor="#202722"
                  level="M"
                />
                <span className="text-[10px] text-brand-muted mt-2 font-semibold flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Flash at Kitchen Dispatch
                </span>
              </div>
            </div>

            {/* Status Stepper Progression */}
            {isCancelled ? (
              <div className="p-3.5 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center gap-3">
                <Ban className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold text-xs">This Order was Cancelled</div>
                  <div className="text-[11px]">Reason: {order.cancel_reason || 'Cancelled'}</div>
                </div>
              </div>
            ) : isMissed ? (
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Collection Window Expired (Missed)</div>
                  <div className="text-[11px]">The pickup window elapsed. Please contact the canteen counter.</div>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-brand-border/70">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {steps.map((st, idx) => {
                    const Icon = st.icon;
                    const isCompleted = currentStepIdx > idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={st.key} className="space-y-1.5 text-center sm:text-left">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all mx-auto sm:mx-0 ${
                          isCompleted
                            ? 'bg-brand-green text-white'
                            : isCurrent
                            ? 'bg-brand-orange text-white ring-2 ring-brand-orange/30'
                            : 'bg-stone-100 text-stone-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-display font-bold text-xs ${
                            isCurrent ? 'text-brand-orange' : isCompleted ? 'text-brand-green' : 'text-brand-muted'
                          }`}>
                            {st.label}
                          </div>
                          <div className="text-[10px] text-brand-muted hidden sm:block">
                            {st.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ordered Food Items Receipt Details */}
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-3">
            <h3 className="font-display font-bold text-sm text-brand-text">
              Ordered Items Summary
            </h3>
            <div className="divide-y divide-brand-border/60">
              {order.items?.map((it, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-brand-text">{it.item_name_snapshot}</span>
                    <span className="text-brand-muted ml-2">x{it.quantity}</span>
                  </div>
                  <div className="font-display font-bold text-brand-text">
                    ₹{Number(it.line_total).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-brand-border/70 flex justify-between items-baseline">
              <span className="font-display font-bold text-xs text-brand-text">Total</span>
              <span className="font-display font-black text-lg text-brand-green">
                ₹{Number(order.total).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
