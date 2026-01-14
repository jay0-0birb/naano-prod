'use client';

import { useState } from 'react';
import { signup } from '@/app/(auth)/actions';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'saas' | 'influencer'>('saas');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    formData.append('role', role);

    const result = await signup(formData);

    if (result?.error) {
        setError(result.error);
        setIsLoading(false);
    } else {
        setSuccess(true);
        setIsLoading(false);
    }
  }

  if (success) {
    return (
        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] mb-2">Check your email</h3>
            <p className="text-[#64748B] text-sm leading-relaxed max-w-xs mx-auto">
                A confirmation link has been sent to your email address. Click it to activate your account.
            </p>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
        </div>
      )}

      {/* Role Selection */}
      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-xl border border-gray-200">
        <button
            type="button"
            onClick={() => setRole('saas')}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                role === 'saas' 
                ? 'bg-[#0F172A] text-white shadow-sm' 
                : 'text-[#64748B] hover:text-[#111827] hover:bg-white'
            }`}
        >
            Brand
        </button>
        <button
            type="button"
            onClick={() => setRole('influencer')}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                role === 'influencer' 
                ? 'bg-[#0F172A] text-white shadow-sm' 
                : 'text-[#64748B] hover:text-[#111827] hover:bg-white'
            }`}
        >
            Creator
        </button>
      </div>

      <div className="space-y-4">
        <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 ml-1">Full name</label>
            <input 
                name="fullName" 
                type="text" 
                required 
                placeholder="John Doe"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
        </div>
        
        <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 ml-1">Email</label>
            <input 
                name="email" 
                type="email" 
                required 
                placeholder="john@company.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5 ml-1">Password</label>
            <input 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                minLength={8}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-11 mt-2 bg-[#0F172A] text-white rounded-xl text-sm font-medium hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
            <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
            </>
        ) : (
            "Create account"
        )}
      </button>
    </form>
  );
}
