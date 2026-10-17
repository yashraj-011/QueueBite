import React, { useEffect, useRef, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Edit, 
  Power, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  BarChart2,
  Upload,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'menu', 'slots'
  const [analytics, setAnalytics] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canteenOpen, setCanteenOpen] = useState(true);

  // Form states for menu item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Snacks');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('50');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemPrep, setItemPrep] = useState('5');
  const [itemDiet, setItemDiet] = useState('veg');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [anData, mnData, slData, stData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getMenu(),
        api.getSlots(),
        api.getSlotSettings()
      ]);
      setAnalytics(anData);
      setMenuItems(mnData || []);
      setSlots(slData || []);
      setCanteenOpen(Boolean(stData?.canteen_open));
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleCanteenOpen = async () => {
    try {
      const nextState = !canteenOpen;
      await api.setCanteenStatus(nextState);
      setCanteenOpen(nextState);
    } catch (err) {
      alert(err.message || 'Failed to update canteen status');
    }
  };

  const handleToggleItemAvailability = async (id, currentVal) => {
    try {
      await api.updateItemAvailability(id, !currentVal);
      setMenuItems(prev => prev.map(it => it.id === id ? { ...it, is_available: !currentVal } : it));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(it => it.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleSlotBlock = async (id, isBlocked) => {
    try {
      await api.toggleSlotBlock(id, !isBlocked);
      setSlots(prev => prev.map(s => s.id === id ? { ...s, is_blocked: !isBlocked } : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSlotCapacity = async (id, newCap) => {
    const val = parseInt(newCap, 10);
    if (isNaN(val) || val < 1) return;
    try {
      await api.updateSlotCapacity(id, val);
      setSlots(prev => prev.map(s => s.id === id ? { ...s, max_orders: val } : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Snacks');
    setItemPrice('');
    setItemStock('40');
    setItemDesc('');
    setItemImage('');
    setItemPrep('5');
    setItemDiet('veg');
    setImagePreview('');
    setImageError('');
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemPrice(String(item.price));
    setItemStock(item.stock !== null ? String(item.stock) : '');
    setItemDesc(item.description || '');
    setItemImage(item.image_url || '');
    setItemPrep(String(item.preparation_minutes || 5));
    setItemDiet(item.dietary_classification || 'veg');
    setImagePreview(item.image_url || '');
    setImageError('');
    setShowItemModal(true);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageError('');
    setImageUploading(true);
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    try {
      const result = await api.uploadMenuImage(file);
      setItemImage(result.url);        // store final Supabase CDN URL
      setImagePreview(result.url);     // swap local blob for permanent URL
    } catch (err) {
      setImageError(err.message || 'Upload failed');
      setImagePreview('');
      setItemImage('');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: itemName,
        category: itemCategory,
        price: parseFloat(itemPrice),
        stock: itemStock !== '' ? parseInt(itemStock, 10) : null,
        description: itemDesc,
        image_url: itemImage,
        preparation_minutes: parseInt(itemPrep, 10),
        dietary_classification: itemDiet,
        is_available: true
      };

      if (editingItem) {
        const updated = await api.updateMenuItem(editingItem.id, payload);
        setMenuItems(prev => prev.map(it => it.id === editingItem.id ? updated : it));
      } else {
        const created = await api.createMenuItem(payload);
        setMenuItems(prev => [...prev, created]);
      }
      setShowItemModal(false);
    } catch (err) {
      alert(err.message || 'Failed to save item');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Canteen Master Toggle */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-green" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">
              Operations Center
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-brand-text">
            Canteen Operations & Analytics
          </h1>
          <p className="text-xs text-brand-muted">
            Real-time throughput metrics, menu management, and slot queue controls
          </p>
        </div>

        {/* Master Canteen Switch */}
        <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-lg border border-brand-border">
          <div className="text-right">
            <div className="font-display font-bold text-xs text-brand-text">
              Store Status: {canteenOpen ? (
                <span className="text-brand-green">OPEN</span>
              ) : (
                <span className="text-red-600">CLOSED</span>
              )}
            </div>
            <div className="text-[10px] text-brand-muted">
              {canteenOpen ? 'Accepting orders' : 'Orders paused'}
            </div>
          </div>

          <button
            onClick={handleToggleCanteenOpen}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              canteenOpen
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                : 'bg-brand-green text-white hover:bg-brand-green-dark'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {canteenOpen ? 'Pause Orders' : 'Open Canteen'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-brand-border pb-2 overflow-x-auto">
        {[
          { key: 'analytics', label: 'Overview Analytics', icon: BarChart2 },
          { key: 'menu', label: 'Menu Catalog Manager', icon: UtensilsCrossed },
          { key: 'slots', label: 'Slot Capacity & Controls', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-green text-white shadow-soft font-bold'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS OVERVIEW */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-card">
              <div className="flex items-center justify-between text-brand-muted mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales Today</span>
                <DollarSign className="w-4 h-4 text-brand-green" />
              </div>
              <div className="font-display font-extrabold text-2xl text-brand-text">
                ₹{Number(analytics.today_sales).toFixed(0)}
              </div>
              <div className="text-[11px] text-brand-green font-medium mt-1">Paid orders revenue</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-card">
              <div className="flex items-center justify-between text-brand-muted mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Today's Orders</span>
                <ShoppingBag className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="font-display font-extrabold text-2xl text-brand-text">
                {analytics.today_orders_count}
              </div>
              <div className="text-[11px] text-brand-muted font-medium mt-1">All service slots</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-card">
              <div className="flex items-center justify-between text-brand-muted mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Kitchen Active</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-display font-extrabold text-2xl text-brand-text">
                {(analytics.status_breakdown?.placed || 0) + (analytics.status_breakdown?.preparing || 0)}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                {analytics.status_breakdown?.placed || 0} placed, {analytics.status_breakdown?.preparing || 0} cooking
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-card">
              <div className="flex items-center justify-between text-brand-muted mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ready at Counter</span>
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
              </div>
              <div className="font-display font-extrabold text-2xl text-brand-text">
                {analytics.status_breakdown?.ready || 0}
              </div>
              <div className="text-[11px] text-brand-green font-medium mt-1">Awaiting student pickup</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Hourly Order Trend Chart */}
            <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-xl border border-brand-border shadow-card space-y-3">
              <div>
                <h3 className="font-display font-bold text-sm text-brand-text">
                  Hourly Order Flow
                </h3>
                <p className="text-xs text-brand-muted">Distribution across morning and afternoon lecture intervals</p>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourly_trends}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#24864B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#24864B" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E7E0" />
                    <XAxis dataKey="hour" stroke="#727870" fontSize={11} />
                    <YAxis stroke="#727870" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#24864B" strokeWidth={2.5} fillOpacity={1} fill="url(#orderGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Items Ranking */}
            <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-xl border border-brand-border shadow-card space-y-3">
              <h3 className="font-display font-bold text-sm text-brand-text">
                Top Selling Items
              </h3>
              <div className="space-y-2">
                {analytics.popular_items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-brand-border">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-brand-surface-muted text-brand-green font-display font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-brand-text truncate max-w-[130px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-display font-bold text-xs text-brand-green">
                      {item.count} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU CATALOG MANAGER */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-xl border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
            <div>
              <h3 className="font-display font-bold text-base text-brand-text">
                Menu Catalog Manager ({menuItems.length})
              </h3>
              <p className="text-xs text-brand-muted">Modify prices, manage available stock levels, or toggle visibility</p>
            </div>

            <button
              onClick={openAddItemModal}
              className="px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-soft"
            >
              <Plus className="w-3.5 h-3.5" /> Add Menu Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                  <th className="pb-2.5">Item</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Price</th>
                  <th className="pb-2.5">Stock</th>
                  <th className="pb-2.5">Availability</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-2.5 font-semibold text-brand-text flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-md bg-stone-100 overflow-hidden shrink-0 border border-brand-border">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">🍽️</div>
                        )}
                      </div>
                      <div>
                        <div>{item.name}</div>
                        <div className="text-[10px] text-brand-muted font-normal capitalize">{item.dietary_classification}</div>
                      </div>
                    </td>
                    <td className="py-2.5 text-brand-muted">{item.category}</td>
                    <td className="py-2.5 font-display font-bold text-brand-text">₹{Number(item.price).toFixed(0)}</td>
                    <td className="py-2.5 font-medium">
                      {item.stock !== null ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-700'}`}>
                          {item.stock}
                        </span>
                      ) : (
                        <span className="text-brand-muted">Unlimited</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleToggleItemAvailability(item.id, item.is_available)}
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-2.5 text-right space-x-1">
                      <button
                        onClick={() => openEditItemModal(item)}
                        className="p-1 text-brand-muted hover:text-brand-text rounded hover:bg-stone-100"
                        title="Edit Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SLOTS & CAPACITY CONTROLS */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-xl border border-brand-border shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
            <div>
              <h3 className="font-display font-bold text-base text-brand-text">
                Pickup Windows & Capacity Limits
              </h3>
              <p className="text-xs text-brand-muted">Throttle order volume per 10-minute slot to prevent kitchen bottlenecks</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const today = new Date().toISOString().slice(0, 10);
                  await api.bulkBlockSlots(today);
                  loadAllData();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
              >
                Block All Today
              </button>
              <button
                onClick={async () => {
                  const today = new Date().toISOString().slice(0, 10);
                  await api.bulkUnblockSlots(today);
                  loadAllData();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-green bg-brand-surface-muted hover:bg-brand-green hover:text-white border border-brand-green/30 transition-colors"
              >
                Unblock All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((s) => (
              <div
                key={s.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  s.is_blocked
                    ? 'bg-stone-100/60 border-stone-200 opacity-60'
                    : 'bg-white border-brand-border shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-display font-bold text-xs sm:text-sm text-brand-text">
                      {s.start_time} - {s.end_time}
                    </div>
                    <div className="text-[10px] text-brand-muted">Date: {s.slot_date}</div>
                  </div>
                  <button
                    onClick={() => handleToggleSlotBlock(s.id, s.is_blocked)}
                    className={`p-1.5 rounded-md border transition-colors ${
                      s.is_blocked
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-brand-text'
                    }`}
                    title={s.is_blocked ? 'Unblock Slot' : 'Block Slot'}
                  >
                    {s.is_blocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-brand-border/60">
                  <div className="text-brand-muted text-[11px]">
                    Booked: <span className="font-bold text-brand-text">{s.booked_count}</span> / {s.max_orders}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-brand-muted">Cap:</span>
                    <input
                      type="number"
                      min={s.booked_count || 1}
                      defaultValue={s.max_orders}
                      onBlur={(e) => handleUpdateSlotCapacity(s.id, e.target.value)}
                      className="w-11 px-1 py-0.5 text-center bg-stone-50 border border-brand-border rounded font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MENU ITEM */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-brand-border shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="font-display font-extrabold text-xl text-brand-text">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-brand-text mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Paneer Kathi Roll"
                  className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-text mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-medium"
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Quick Bites">Quick Bites</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Meals">Meals</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-text mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-text mb-1">Daily Stock</label>
                  <input
                    type="number"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    placeholder="Leave blank if unlimited"
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-brand-text mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={itemPrep}
                    onChange={(e) => setItemPrep(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Image Upload Zone */}
              <div>
                <label className="block text-brand-text mb-1">Item Photo</label>

                {/* Preview */}
                {imagePreview ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-brand-border mb-2 group">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    {imageUploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-[11px] text-brand-green font-semibold">Uploading…</span>
                      </div>
                    )}
                    {!imageUploading && (
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setItemImage(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-stone-600 hover:text-red-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-brand-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-brand-muted hover:border-brand-green hover:text-brand-green transition-colors cursor-pointer bg-stone-50 hover:bg-brand-surface-muted mb-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[11px] font-semibold">Click to upload image</span>
                    <span className="text-[10px]">JPG, PNG, WebP — max 5 MB</span>
                  </button>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />

                {imageError && (
                  <p className="text-[11px] text-red-600 mt-1">{imageError}</p>
                )}

                {/* Fallback: manual URL entry */}
                <div className="mt-1.5">
                  <input
                    type="url"
                    value={itemImage}
                    onChange={(e) => { setItemImage(e.target.value); setImagePreview(e.target.value); }}
                    placeholder="Or paste an image URL…"
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-brand-border text-[11px] font-medium text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-text mb-1">Description</label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Appetizing description..."
                  className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-3.5 py-2 rounded-lg text-brand-muted hover:text-brand-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold shadow-soft"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
