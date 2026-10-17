import React, { useEffect, useState } from 'react';
import { 
  ChefHat, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  PackageCheck,
  Flame
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';

const toLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function StaffPage() {
  const today = toLocalDateStr();
  const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenSearch, setTokenSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filterDate, setFilterDate] = useState(today);
  const [initialized, setInitialized] = useState(false);

  const loadOrders = async (date) => {
    const d = date ?? filterDate;
    try {
      const res = await api.getAllOrders({ date: d, limit: 100 });
      setOrders(res?.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // On first mount: find the earliest date with active orders and jump to it
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch without date filter to discover active order dates
        const res = await api.getAllOrders({ limit: 50 });
        const allOrders = res?.orders || [];
        const activeDates = allOrders
          .filter(o => o.order_status !== 'Collected' && o.order_status !== 'Cancelled' && o.order_status !== 'Missed')
          .map(o => o.service_date)
          .filter(Boolean);

        if (activeDates.length > 0) {
          const earliest = activeDates.sort()[0];
          setFilterDate(earliest);
          await loadOrders(earliest);
        } else {
          await loadOrders(today);
        }
      } catch {
        await loadOrders(today);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    loadOrders();
    const interval = setInterval(() => loadOrders(), 5000);
    return () => clearInterval(interval);
  }, [filterDate, initialized]);

  const handleStatusTransition = async (orderId, newStatus) => {
    try {
      setActionLoadingId(orderId);
      await api.updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPaymentPaid = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      await api.markOrderPaid(orderId);
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!tokenSearch.trim()) return true;
    const q = tokenSearch.trim().toLowerCase().replace('#', '');
    const t = o.token.toLowerCase().replace('#', '');
    return t.includes(q) || o.id.toLowerCase().includes(q) || o.student_name_snapshot?.toLowerCase().includes(q);
  });

  const placedOrders = filteredOrders.filter(o => o.order_status === 'Placed');
  const preparingOrders = filteredOrders.filter(o => o.order_status === 'Preparing');
  const readyOrders = filteredOrders.filter(o => o.order_status === 'Ready');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header - Restrained Operations Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-brand-border shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-surface-muted text-brand-green flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-brand-text">
              Kitchen Dispatch Board
            </h1>
            <p className="text-xs text-brand-muted">
              Live preparation queue. Advance orders and dispatch by digital token.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick date pickers */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterDate(today)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filterDate === today
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white border-brand-border text-brand-muted hover:text-brand-text hover:bg-stone-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterDate(tomorrow)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filterDate === tomorrow
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white border-brand-border text-brand-muted hover:text-brand-text hover:bg-stone-50'
              }`}
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-stone-50 border border-brand-border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-green"
              title="Filter by date"
            />
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token (e.g. #001)..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-stone-50 border border-brand-border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-green w-44"
            />
          </div>

          <button
            onClick={() => loadOrders()}
            className="p-2 rounded-lg border border-brand-border hover:bg-stone-50 transition-colors text-brand-muted hover:text-brand-text"
            title="Refresh Live Orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Column 1: Placed (New Orders) */}
        <div className="bg-stone-50/70 rounded-xl p-4 border border-brand-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-brand-text">
                Placed (New)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white text-stone-700 text-[11px] font-bold border border-brand-border">
              {placedOrders.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {placedOrders.length === 0 ? (
              <div className="text-center py-10 text-xs text-brand-muted bg-white rounded-lg border border-dashed border-brand-border">
                No orders waiting
              </div>
            ) : (
              placedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-lg p-3.5 border border-brand-border shadow-2xs space-y-2.5 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-display font-extrabold text-2xl text-brand-text">
                        {ord.token}
                      </span>
                      <div className="text-[11px] text-brand-muted">
                        {ord.student_name_snapshot} ({ord.college_id_snapshot})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {ord.slot_time_snapshot}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 p-2 rounded-md space-y-1 text-xs">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-brand-text">
                        <span>{it.item_name_snapshot}</span>
                        <span className="font-bold">x{it.quantity}</span>
                      </div>
                    ))}
                    {ord.note && (
                      <div className="pt-1 text-[11px] text-amber-800 font-medium italic border-t border-stone-200">
                        Note: "{ord.note}"
                      </div>
                    )}
                  </div>

                  {/* Payment Alert */}
                  {ord.payment_status === 'Pending' && (
                    <div className="flex items-center justify-between text-xs bg-red-50 p-1.5 rounded text-red-700">
                      <span>Unpaid: ₹{ord.total}</span>
                      <button
                        onClick={() => handleMarkPaymentPaid(ord.id)}
                        className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700"
                      >
                        Collect Cash
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleStatusTransition(ord.id, 'Preparing')}
                    disabled={actionLoadingId === ord.id}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Flame className="w-3.5 h-3.5" /> Start Cooking
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="bg-stone-50/70 rounded-xl p-4 border border-brand-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-brand-text">
                Preparing
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white text-stone-700 text-[11px] font-bold border border-brand-border">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-10 text-xs text-brand-muted bg-white rounded-lg border border-dashed border-brand-border">
                Nothing currently cooking
              </div>
            ) : (
              preparingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-lg p-3.5 border border-brand-border shadow-2xs space-y-2.5 hover:border-brand-orange transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-display font-extrabold text-2xl text-brand-text">
                        {ord.token}
                      </span>
                      <div className="text-[11px] text-brand-muted">
                        {ord.student_name_snapshot} ({ord.college_id_snapshot})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-orange bg-brand-orange-light px-2 py-0.5 rounded border border-brand-orange/30">
                      {ord.slot_time_snapshot}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 p-2 rounded-md space-y-1 text-xs">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-brand-text">
                        <span>{it.item_name_snapshot}</span>
                        <span className="font-bold">x{it.quantity}</span>
                      </div>
                    ))}
                    {ord.note && (
                      <div className="pt-1 text-[11px] text-brand-orange font-medium italic border-t border-stone-200">
                        Note: "{ord.note}"
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleStatusTransition(ord.id, 'Ready')}
                    disabled={actionLoadingId === ord.id}
                    className="w-full py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <PackageCheck className="w-3.5 h-3.5" /> Ready for Pickup
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready at Counter */}
        <div className="bg-stone-50/70 rounded-xl p-4 border border-brand-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-brand-text">
                Ready at Counter
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white text-stone-700 text-[11px] font-bold border border-brand-border">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-10 text-xs text-brand-muted bg-white rounded-lg border border-dashed border-brand-border">
                No orders waiting at counter
              </div>
            ) : (
              readyOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-lg p-3.5 border border-brand-border shadow-2xs space-y-2.5 hover:border-brand-green transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-display font-extrabold text-2xl text-brand-green">
                        {ord.token}
                      </span>
                      <div className="text-[11px] text-brand-muted">
                        {ord.student_name_snapshot} ({ord.college_id_snapshot})
                      </div>
                    </div>
                    <Badge variant={ord.payment_status === 'Paid' ? 'success' : 'warning'}>
                      {ord.payment_status}
                    </Badge>
                  </div>

                  {/* Payment Reconcile */}
                  {ord.payment_status === 'Pending' && (
                    <div className="flex items-center justify-between text-xs bg-red-50 p-1.5 rounded text-red-700">
                      <span>Collect: ₹{ord.total}</span>
                      <button
                        onClick={() => handleMarkPaymentPaid(ord.id)}
                        className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700"
                      >
                        Confirm Cash
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleStatusTransition(ord.id, 'Collected')}
                    disabled={actionLoadingId === ord.id}
                    className="w-full py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Collected
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
