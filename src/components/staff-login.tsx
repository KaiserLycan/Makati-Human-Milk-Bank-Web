'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveProfile } from '../utils/storage';

export interface StaffLoginProps {
  onLoginSuccess?: (employeeEmail: string) => void;
}

export default function StaffLogin({ onLoginSuccess }: StaffLoginProps) {
  const router = useRouter();
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!employeeEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = 'https://makati-human-milk-bank-api.onrender.com';
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: employeeEmail, password }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Invalid Employee Email or Password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (result.data) {
        saveProfile({
          id: result.data.user_id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role,
        });
      }

      setSuccess('Login successful! Redirecting to staff portal...');

      if (onLoginSuccess) {
        onLoginSuccess(employeeEmail);
      }

      setTimeout(() => {
        setIsLoading(false);
        router.push('/work/dashboard');
      }, 1500);

    } catch (err: any) {
      setError('Network error: Failed to connect to the server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-neutral-900 flex flex-col justify-between overflow-x-hidden">
      {/* Background Teal Curved Shape */}
      <div
        className="absolute top-[-218px] left-[-374px] w-[921px] h-[850px] pointer-events-none select-none opacity-95 z-0 hidden md:block"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg_ellipse.svg"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">

          {/* Left Column: Hero Image (hidden on mobile, shown on desktop) */}
          <div className="lg:col-span-6 relative w-full h-[350px] sm:h-[450px] lg:h-[680px] rounded-[20px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.06)] hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/select_hero.png"
              alt="Makati Human Milk Bank Staff Portal"
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-neutral-950/5 pointer-events-none" />
          </div>

          {/* Right Column: Login Card Form */}
          <div className="lg:col-span-6 flex flex-col gap-8 w-full max-w-lg mx-auto">
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold text-neutral-950 tracking-tight leading-[1.1]">
                Makati Human Milk Bank
              </h1>
              <p className="text-neutral-600 font-sans text-sm sm:text-base leading-relaxed">
                This page is for the Staff of Makati Human Milk Bank. If you’re not a staff, please leave the site immediately.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 font-sans text-sm animate-in fade-in duration-200" data-testid="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 font-sans text-sm animate-in fade-in duration-200" data-testid="success-message">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Employee Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="employeeEmail" className="text-neutral-800 font-sans text-sm font-bold">
                  Employee Email
                </label>
                <input
                  type="email"
                  id="employeeEmail"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="staff@mhmb.gov"
                  className="border border-neutral-400 bg-white h-[55px] px-5 rounded-[20px] font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all"
                  data-testid="employee-email-input"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-neutral-800 font-sans text-sm font-bold">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border border-neutral-400 bg-white h-[55px] pl-5 pr-14 rounded-[20px] font-sans text-base w-full focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-brand-teal hover:bg-brand-teal-dark text-white font-sans font-bold text-base h-[55px] rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,175,185,0.2)] hover:shadow-[0_4px_18px_rgba(0,175,185,0.35)] disabled:bg-neutral-300 disabled:shadow-none"
                data-testid="signin-btn"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-neutral-500 font-sans text-sm">
                Contact an admin if you forgot your password.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full bg-white border-t border-neutral-100 py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="font-sans text-sm text-neutral-500">
            Copyright &copy;2026; Designed by Why We Clash
          </p>
        </div>
      </footer>
    </div>
  );
}
