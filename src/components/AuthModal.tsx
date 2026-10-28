import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  UserPlus,
  LogIn,
  Droplet,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { UserAccount, UserRole, RegionType } from '../types';
import { authService, ROLE_DETAILS } from '../utils/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [accountType, setAccountType] = useState<'resident' | 'technician'>('resident');

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('Green Valley Colony, Ward 4');
  const [waterSource, setWaterSource] = useState<RegionType>('urban');

  // Operation States (Rule 8: loading, success, error)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleQuickDemoSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    resetMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await authService.login(username, password);
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 500);
      } else {
        const role: UserRole = accountType === 'resident' ? 'resident' : 'technician';
        const user = await authService.register({
          username,
          password,
          name,
          role,
          facility: locality.trim() || 'Local Residential Area',
          defaultRegion: waterSource,
        });
        setSuccessMessage(`Account created! Logged in as ${user.name}.`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication request failed. Please check inputs and retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-cyan-50/70 to-transparent">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#1eaedb] flex items-center justify-center text-white shadow-sm text-lg">
              💧
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#1eaedb]">
                {accountType === 'resident' ? 'Resident Account' : 'Technician Portal'}
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {mode === 'login' ? 'Sign In to Your Account' : 'Create Home Account'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'login'
              ? 'Access your saved home water tests, filter reminders, and local water quality updates.'
              : 'Save your household water readings, track filter changes, and check drinking safety.'}
          </p>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                resetMessages();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-3.5">
          {/* Status feedback (Rule 8) */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration specific fields */}
          {mode === 'register' && (
            <>
              {/* Account type radio (Resident vs Technician) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('resident')}
                  className={`flex-1 p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    accountType === 'resident'
                      ? 'bg-cyan-50 border-[#1eaedb] text-cyan-800 ring-1 ring-[#1eaedb]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  🏡 Home / Resident
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('technician')}
                  className={`flex-1 p-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    accountType === 'technician'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  🔬 Field Technician
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {accountType === 'resident' ? 'Your Area / Locality' : 'Field Station / Plant'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Valley Colony, Ward 4"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Home Water Source</label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value as RegionType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1eaedb] cursor-pointer"
                >
                  <option value="urban">Kitchen Tap (Municipal Treated)</option>
                  <option value="groundwater">Borewell / Ground Well Water</option>
                  <option value="coastal">Coastal / Saline Area</option>
                  <option value="industrial">Industrial Catchment / Tanker</option>
                </select>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username / Mobile</label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                placeholder={mode === 'login' ? 'e.g. resident' : 'choose a username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#1eaedb] hover:bg-[#189bb5] disabled:opacity-70 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to My Home</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Resident Account</span>
              </>
            )}
          </button>

          {/* Quick Demo Accounts for fast testing */}
          {mode === 'login' && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1-Click Quick Demo Accounts:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('resident', 'waterhome')}
                  className="p-1.5 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-lg text-emerald-900 text-left border border-emerald-100 transition cursor-pointer"
                >
                  <span className="font-bold block truncate">🏡 Local Resident</span>
                  <span className="text-[10px] text-emerald-600">resident</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('priya', 'waterhome')}
                  className="p-1.5 bg-cyan-50/70 hover:bg-cyan-100/70 rounded-lg text-cyan-900 text-left border border-cyan-100 transition cursor-pointer"
                >
                  <span className="font-bold block truncate">🏠 Homeowner</span>
                  <span className="text-[10px] text-cyan-600">priya</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('sameer', 'smartwater2025')}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-left border border-slate-200 transition cursor-pointer"
                >
                  <span className="font-bold block truncate">🔬 Lab Tech</span>
                  <span className="text-[10px] text-slate-500">sameer</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
