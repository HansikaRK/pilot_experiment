import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '../lib/schemas';
import { cn } from '../lib/utils';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register, loginWithDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalTab);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize tab state when modal opens
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMessage(null);
  }, [authModalTab, isAuthModalOpen]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(data);
      loginForm.reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await register({ name: data.name, email: data.email, password: data.password });
      registerForm.reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: 'user' | 'admin') => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithDemo(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-ceylon-gold/20 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background decoration */}
        <div className="bg-gradient-to-r from-ceylon-green via-emerald-800 to-ceylon-gold/90 p-6 text-white text-center relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-2 border border-white/20">
            <Sparkles className="h-6 w-6 text-ceylon-gold" />
          </div>
          <h2 className="text-2xl font-bold font-serif">Welcome to CeylonCart</h2>
          <p className="text-xs text-white/80 mt-1">Sign in to your account or register to order authentic Sri Lankan goods</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 text-center',
              activeTab === 'login'
                ? 'border-ceylon-gold text-ceylon-green bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 text-center',
              activeTab === 'register'
                ? 'border-ceylon-gold text-ceylon-green bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Register
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="user@ceyloncart.com"
                    {...loginForm.register('email')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-[11px] text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-[11px] text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-ceylon-green hover:bg-emerald-900 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Kasun Perera"
                    {...registerForm.register('name')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="mt-1 text-[11px] text-red-600">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="yourname@example.com"
                    {...registerForm.register('email')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-[11px] text-red-600">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    {...registerForm.register('password')}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-[11px] text-red-600">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    {...registerForm.register('confirmPassword')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceylon-gold focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-ceylon-green hover:bg-emerald-900 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </button>
            </form>
          )}

          {/* Quick Demo Login Box */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-center mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ceylon-gold flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> 1-Click Demo Accounts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoClick('user')}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-ceylon-cream/80 hover:bg-ceylon-cream border border-ceylon-gold/30 rounded-lg transition-all text-left flex flex-col justify-center cursor-pointer"
              >
                <span className="font-semibold text-ceylon-green flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> Demo User
                </span>
                <span className="text-[10px] text-gray-500">Kasun Perera</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-ceylon-cream/80 hover:bg-ceylon-cream border border-ceylon-gold/30 rounded-lg transition-all text-left flex flex-col justify-center cursor-pointer"
              >
                <span className="font-semibold text-ceylon-maroon flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Demo Admin
                </span>
                <span className="text-[10px] text-gray-500">Amara Fernando</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
