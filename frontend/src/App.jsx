import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import TrackPage from './pages/TrackPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import StaffPage from './pages/StaffPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

// Guard: staff/admin only
function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Guard: students only — staff/admin are redirected to their dashboard
function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'staff')  return <Navigate to="/staff"  replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Student-only routes */}
                <Route path="/cart"    element={<StudentRoute><CartPage /></StudentRoute>} />
                <Route path="/track"   element={<StudentRoute><TrackPage /></StudentRoute>} />
                <Route path="/history" element={<StudentRoute><HistoryPage /></StudentRoute>} />

                {/* Staff Protected Route */}
                <Route
                  path="/staff"
                  element={
                    <RoleRoute allowedRoles={['staff', 'admin']}>
                      <StaffPage />
                    </RoleRoute>
                  }
                />

                {/* Admin Protected Route */}
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </RoleRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
