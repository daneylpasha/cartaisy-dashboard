'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="grid md:grid-cols-3 gap-12">
      {/* Contact Form */}
      <div className="md:col-span-2">
        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Message Sent!</h2>
            <p className="text-gray-400 mb-6">
              Thank you for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', subject: '', message: '' });
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="" className="bg-slate-900">Select a subject</option>
                <option value="general" className="bg-slate-900">General Inquiry</option>
                <option value="support" className="bg-slate-900">Technical Support</option>
                <option value="billing" className="bg-slate-900">Billing Question</option>
                <option value="partnership" className="bg-slate-900">Partnership</option>
                <option value="feedback" className="bg-slate-900">Feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </form>
        )}
      </div>

      {/* Contact Info Sidebar */}
      <div className="space-y-8">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
          <p className="text-gray-400 mb-3">
            For general inquiries and support
          </p>
          <a
            href="mailto:support@cartaisy.com"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            support@cartaisy.com
          </a>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
          <p className="text-gray-400">
            We typically respond within 24 hours during business days.
          </p>
        </div>

        <div className="text-gray-400 text-sm">
          <p className="mb-2">
            <strong className="text-white">Looking for documentation?</strong>
          </p>
          <p>
            Check out our help center for guides, tutorials, and FAQs.
          </p>
        </div>
      </div>
    </div>
  );
}
