import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Clock, 
  ChevronRight, 
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const params = statusFilter === 'All' ? {} : { status: statusFilter };
        const res = await api.getMyOrders(params);
        setOrders(res?.orders || []);
      } catch (err) {
        console.error('Failed to load order history:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-surface-muted text-brand-green flex items-center justify-center mx-auto border border-brand-green/20">
          <History className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-2xl text-brand-text">Sign In to View Orders</h2>
        <p className="text-xs sm:text-sm text-brand-muted">
          Your campus order history and digital tokens will appear here once you log in with your college roll number.
        </p>
        <Link
          to="/login?redirect=/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-green text-white font-semibold text-xs shadow-soft hover:bg-brand-green-dark transition-colors"
        >
          Sign In Now <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const filters = ['All', 'Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'];

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Collected': return 'success';
      case 'Ready': return 'orange';
      case 'Preparing': return 'brand';
      case 'Placed': return 'warning';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-text">
          My Order History
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
          Review past college canteen orders, receipts, and token records.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === f
                ? 'bg-brand-green text-white shadow-soft font-bold'
                : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-brand-border space-y-2.5">
          <UtensilsCrossed className="w-10 h-10 text-brand-muted mx-auto stroke-1" />
          <h3 className="font-display font-bold text-base text-brand-text">No orders found</h3>
          <p className="text-xs text-brand-muted">You have no orders matching the selected filter.</p>
          <Link
            to="/menu"
            className="inline-block mt-1 px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-semibold shadow-soft"
          >
            Order Food
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-brand-border p-5 shadow-card hover:border-brand-green/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display font-extrabold text-2xl text-brand-text">
                    {order.token}
                  </span>
                  <Badge variant={getStatusVariant(order.order_status)}>
                    {order.order_status}
                  </Badge>
                  <span className="text-xs text-brand-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-orange" />
                    Slot: {order.slot_time_snapshot}
                  </span>
                  <span className="text-xs text-brand-muted">
                    • {order.service_date}
                  </span>
                </div>

                <div className="text-xs text-brand-muted flex flex-wrap gap-1.5 pt-1">
                  {order.items?.map((it, idx) => (
                    <span key={idx} className="bg-stone-50 px-2 py-0.5 rounded-md border border-brand-border">
                      {it.item_name_snapshot} <span className="font-semibold text-brand-text">x{it.quantity}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Total</div>
                  <div className="font-display font-bold text-lg text-brand-green">
                    ₹{Number(order.total).toFixed(0)}
                  </div>
                </div>

                <Link
                  to={`/track?token=${encodeURIComponent(order.token)}&id=${order.id}`}
                  className="px-3.5 py-2 rounded-lg bg-stone-50 hover:bg-brand-surface-muted hover:text-brand-green text-brand-text font-semibold text-xs border border-brand-border flex items-center gap-1 transition-colors"
                >
                  Track Token <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
