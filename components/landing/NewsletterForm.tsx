'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface NewsletterFormProps {
  variant?: 'inline' | 'stacked';
  className?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function NewsletterForm({
  variant = 'inline',
  className = ''
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
      analytics.newsletterSignup();

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 text-green-400 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  // Inline variant (for footer)
  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={className}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={status === 'submitting'}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-[4px] transition-colors whitespace-nowrap"
          >
            {status === 'submitting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </button>
        </div>
        {status === 'error' && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </form>
    );
  }

  // Stacked variant (for dedicated page)
  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={status === 'submitting'}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-[4px] transition-colors"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe to Newsletter'
          )}
        </button>
      </div>
      {status === 'error' && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
