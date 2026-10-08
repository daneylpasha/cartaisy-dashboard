'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { supportEmail } from '@/lib/marketing/offer';
import { inkFieldClass, inkPanelClass, inkPrimaryClass, inkTextLinkClass } from '@/lib/marketing/publicInk';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      analytics.contactFormSubmit();

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrorMessage('');
  };

  return (
    <div className="grid md:grid-cols-3 gap-12">
      {/* Contact Form */}
      <div className="md:col-span-2">
        {status === 'success' ? (
          <div
            ref={successRef}
            role="status"
            tabIndex={-1}
            className={`${inkPanelClass} p-8 text-center`}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden />
            <h2 className="text-2xl font-semibold text-[#f6f3ee] mb-2">Message Sent!</h2>
            <p className="text-[#c5c7c1] mb-6">
              Thank you for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className={`${inkTextLinkClass} mx-auto`}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {status === 'error' && (
              <div role="alert" className="flex items-center gap-3 rounded-[4px] border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" aria-hidden />
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#c5c7c1]">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                className={inkFieldClass}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#c5c7c1]">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                className={inkFieldClass}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-[#c5c7c1]">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={status === 'submitting'}
                className={inkFieldClass}
              >
                <option value="" className="bg-[#1c1e1a] text-[#f6f3ee]">Select a subject</option>
                <option value="General Inquiry" className="bg-[#1c1e1a] text-[#f6f3ee]">General question</option>
                <option value="Fit question" className="bg-[#1c1e1a] text-[#f6f3ee]">Question about fit</option>
                <option value="Walkthrough" className="bg-[#1c1e1a] text-[#f6f3ee]">Walkthrough</option>
                <option value="Technical Support" className="bg-[#1c1e1a] text-[#f6f3ee]">Technical support</option>
                <option value="Something else" className="bg-[#1c1e1a] text-[#f6f3ee]">Something else</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#c5c7c1]">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                rows={6}
                className={`${inkFieldClass} resize-none`}
                placeholder="How can we help you?"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`${inkPrimaryClass} w-full`}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Contact Info Sidebar */}
      <div className="space-y-8">
        <div className={`${inkPanelClass} p-6`}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] border border-[#666962] text-[#B6C4A1]">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#f6f3ee]">Email Us</h3>
          <p className="mb-3 text-[#c5c7c1]">
            For general inquiries and support
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className={inkTextLinkClass}
          >
            {supportEmail}
          </a>
        </div>

        <div className="text-sm text-[#c5c7c1]">
          <p className="mb-2">
            <strong className="text-[#f6f3ee]">Want a walkthrough?</strong>
          </p>
          <p>
            <a href="/schedule-demo" className={inkTextLinkClass}>
              Request a walkthrough →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
