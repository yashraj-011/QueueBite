import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  User, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'student';
  const redirectPath = searchParams.get('redirect') || '/';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset all form fields when switching tabs to prevent autofill bleed
  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setRollNo('');
    setName('');
    setPhone('');
    setUsername('');
    setPassword('');
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!rollNo.trim()) {
      setErrorMsg('Please enter your college roll number.');
      return;
    }
    try {
      setLoading(true);
      await login({
        role: 'student',
        rollNo: rollNo.trim(),
        name: name.trim() || `Student ${rollNo.trim()}`,
        phone: phone.trim()
      });
      navigate(redirectPath);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }
    try {
      setLoading(true);
      await login({
        role: activeTab,
        username: username.trim() || activeTab,
        password: password.trim()
      });
      if (activeTab === 'admin') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-brand-green text-white flex items-center justify-center mx-auto shadow-soft">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-text">
          Queue<span className="text-brand-green">Bite</span> Portal
        </h1>
        <p className="text-xs text-brand-muted">
          College canteen pre-ordering and dispatch management
        </p>
      </div>

      {/* Role Tabs */}
      <div className="bg-stone-100 p-1 rounded-xl flex border border-brand-border">
        <button
          onClick={() => switchTab('student')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'student'
              ? 'bg-white text-brand-text shadow-2xs font-bold'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Student
        </button>
        <button
          onClick={() => switchTab('staff')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-white text-brand-text shadow-2xs font-bold'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" /> Kitchen
        </button>
        <button
          onClick={() => switchTab('admin')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-white text-brand-text shadow-2xs font-bold'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Admin
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6 shadow-card space-y-4">
        {activeTab === 'student' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-3.5" autoComplete="off">
            <div>
              <label className="text-xs font-semibold text-brand-text block mb-1">
                College Roll / ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="student-roll"
                name="student-roll"
                autoComplete="off"
                placeholder="e.g. IT-101 or CS-204"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-semibold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-text block mb-1">
                Full Name <span className="text-brand-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="student-name"
                name="student-name"
                autoComplete="off"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-text block mb-1">
                Mobile Number <span className="text-brand-muted font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                id="student-phone"
                name="student-phone"
                autoComplete="off"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs shadow-soft transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Student'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffAdminSubmit} className="space-y-3.5" autoComplete="off">
            <div>
              <label className="text-xs font-semibold text-brand-text block mb-1">
                Username
              </label>
              <input
                type="text"
                id={`${activeTab}-username`}
                name={`${activeTab}-username`}
                autoComplete="off"
                placeholder={activeTab === 'admin' ? 'Enter admin username' : 'Enter staff username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-semibold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-text block mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id={`${activeTab}-password`}
                name={`${activeTab}-password`}
                autoComplete="new-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-brand-border text-xs sm:text-sm font-semibold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-green"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs shadow-soft transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : `Access ${activeTab === 'admin' ? 'Admin Dashboard' : 'Kitchen Board'}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
