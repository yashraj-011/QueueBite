import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  IdCard, 
  ShieldCheck, 
  History, 
  LogOut,
  ChefHat,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div className="bg-white rounded-xl border border-brand-border p-6 sm:p-7 shadow-card space-y-5">
        <div className="flex items-center gap-3.5 pb-5 border-b border-brand-border/70">
          <div className="w-12 h-12 rounded-xl bg-brand-surface-muted text-brand-green font-display font-extrabold text-xl flex items-center justify-center border border-brand-green/20">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-brand-text">
              {user.name}
            </h1>
            <div className="text-xs text-brand-muted capitalize">
              Role: <span className="font-semibold text-brand-green">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 border border-brand-border">
            <div className="flex items-center gap-3">
              <IdCard className="w-4 h-4 text-brand-muted" />
              <div>
                <div className="text-[10px] text-brand-muted uppercase font-bold">College Roll ID</div>
                <div className="font-semibold text-xs sm:text-sm text-brand-text">{user.college_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 border border-brand-border">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-muted" />
              <div>
                <div className="text-[10px] text-brand-muted uppercase font-bold">Mobile Phone</div>
                <div className="font-semibold text-xs sm:text-sm text-brand-text">{user.phone || 'Not registered'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 border border-brand-border">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <div>
                <div className="text-[10px] text-brand-muted uppercase font-bold">Account Status</div>
                <div className="font-semibold text-xs sm:text-sm text-brand-green">Verified Campus Member</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between gap-3">
          {/* Role-appropriate action */}
          {user.role === 'student' && (
            <Link
              to="/history"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-brand-text font-semibold text-xs transition-colors border border-brand-border"
            >
              <History className="w-3.5 h-3.5" /> Order History
            </Link>
          )}
          {user.role === 'staff' && (
            <Link
              to="/staff"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-surface-muted hover:bg-brand-green hover:text-white text-brand-green font-semibold text-xs transition-colors border border-brand-green/20"
            >
              <ChefHat className="w-3.5 h-3.5" /> Kitchen Board
            </Link>
          )}
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-surface-muted hover:bg-brand-green hover:text-white text-brand-green font-semibold text-xs transition-colors border border-brand-green/20"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors border border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
