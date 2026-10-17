import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  History, 
  LogOut, 
  Menu as MenuIcon, 
  X,
  ChefHat,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role;
  const isStudent = !role || role === 'student';
  const isStaff   = role === 'staff';
  const isAdmin   = role === 'admin';

  // Student-only links
  const studentLinks = [
    { label: 'Menu',          path: '/menu',    icon: UtensilsCrossed },
    { label: 'Track Order',   path: '/track',   icon: Clock },
    { label: 'Order History', path: '/history', icon: History },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-brand-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-102">
            <UtensilsCrossed className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-tight text-brand-text leading-tight">
              Queue<span className="text-brand-green">Bite</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-muted leading-none">
              Campus Canteen
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Student links — only shown to guests and students */}
          {isStudent && studentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-normal transition-colors ${
                  isActive(link.path)
                    ? 'text-brand-green bg-brand-surface-muted font-bold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-black/[0.03]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive(link.path) ? 'text-brand-green' : 'text-brand-muted'}`} />
                {link.label}
              </Link>
            );
          })}

          {/* Staff — Kitchen Board only */}
          {isStaff && (
            <Link
              to="/staff"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/staff')
                  ? 'bg-brand-surface-muted text-brand-green font-bold'
                  : 'text-brand-muted hover:text-brand-text hover:bg-black/[0.03]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" /> Kitchen Board
            </Link>
          )}

          {/* Admin — Admin Portal only */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/admin')
                  ? 'bg-brand-surface-muted text-brand-green font-bold'
                  : 'text-brand-muted hover:text-brand-text hover:bg-black/[0.03]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin Portal
            </Link>
          )}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Cart — students only */}
          {isStudent && (
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-brand-border text-brand-text font-semibold text-xs hover:border-brand-green/50 transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-green" />
              <span>Cart</span>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-green text-white text-[10px] font-black">
                  {totalCount}
                </span>
              )}
            </Link>
          )}

          {/* User State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.03] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-surface-muted text-brand-green font-bold text-xs flex items-center justify-center border border-brand-green/20">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-brand-text leading-tight">{user.name}</div>
                  <div className="text-[10px] text-brand-muted capitalize">{role}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-brand-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-brand-text hover:text-brand-green transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login?tab=student"
                className="px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs transition-colors shadow-soft"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Show cart only for students on mobile */}
          {isStudent && (
            <Link
              to="/cart"
              className="relative p-2 rounded-lg bg-white border border-brand-border text-brand-text"
            >
              <ShoppingBag className="w-4 h-4 text-brand-green" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-black flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white border border-brand-border text-brand-text"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border px-4 pt-2 pb-5 space-y-1.5">
          {/* Student links */}
          {isStudent && studentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive(link.path) ? 'bg-brand-surface-muted text-brand-green' : 'text-brand-text hover:bg-black/[0.02]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          {/* Staff link */}
          {isStaff && (
            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold ${
                isActive('/staff') ? 'bg-brand-surface-muted text-brand-green' : 'text-brand-text hover:bg-black/[0.02]'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Kitchen Board
            </Link>
          )}

          {/* Admin link */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold ${
                isActive('/admin') ? 'bg-brand-surface-muted text-brand-green' : 'text-brand-text hover:bg-black/[0.02]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Admin Portal
            </Link>
          )}

          <div className="pt-3 border-t border-brand-border">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 text-xs text-brand-muted">
                  Signed in as <span className="font-bold text-brand-text">{user.name}</span>{' '}
                  <span className="capitalize">({role})</span>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-brand-text hover:bg-black/[0.02]"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 font-semibold text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg border border-brand-border font-semibold text-xs text-brand-text"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?tab=student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg bg-brand-green text-white font-semibold text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
