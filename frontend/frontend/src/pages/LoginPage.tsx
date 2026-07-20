import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginFormData } from '../lib/schemas';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, name, type = 'text', placeholder = '', icon: Icon }: any) => {
    const fieldError = form.formState.errors[name];
    return (
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
        </label>
        <input
          {...form.register(name)}
          type={type}
          placeholder={placeholder}
          className={cn(
            'px-4 py-2.5 rounded-lg border bg-gray-50/50 outline-none transition-all duration-200',
            'focus:bg-white focus:ring-2 focus:ring-ceylon-gold/50 focus:border-ceylon-gold',
            fieldError ? 'border-red-400 bg-red-50/50' : 'border-gray-300'
          )}
        />
        {fieldError && <span className="text-red-500 text-xs font-medium">{fieldError.message as string}</span>}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh] animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8 glass-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ceylon-charcoal mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your CeylonCart account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputField label="Email Address" name="email" type="email" placeholder="you@example.com" icon={Mail} />
          <InputField label="Password" name="password" type="password" placeholder="••••••••" icon={Lock} />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full py-3 bg-ceylon-charcoal text-white font-medium rounded-lg hover:bg-ceylon-slate transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-ceylon-gold font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
