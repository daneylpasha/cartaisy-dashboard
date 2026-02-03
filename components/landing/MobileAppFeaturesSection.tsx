'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Heart,
  MapPin,
  Star,
  Home,
  CreditCard,
  Search,
  Bell,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LottieAnimation = dynamic(() => import('@/components/ui/LottieAnimation'), {
  ssr: false,
});

const mobileFeatures = [
  {
    icon: UserPlus,
    title: 'Self-Signup',
    description: 'Customers can register and start shopping immediately.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Heart,
    title: 'Smart Wishlists',
    description: 'Multiple wishlists, save for later, and sharing.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: MapPin,
    title: 'Order Tracking',
    description: 'Real-time order status and delivery tracking.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Star,
    title: 'Product Reviews',
    description: 'Verified purchase reviews and ratings.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Home,
    title: 'Multiple Addresses',
    description: 'Save addresses for quick checkout.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: CreditCard,
    title: 'Secure Checkout',
    description: 'PCI-compliant payment processing.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Search,
    title: 'Search & Filters',
    description: 'Advanced search and smart recommendations.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Order updates and promotional alerts.',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
];

export default function MobileAppFeaturesSection() {
  const [ecommerceAnimation, setEcommerceAnimation] = useState<object | null>(null);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      import('@/public/lottie/E-commerce.json').then((mod) => {
        setEcommerceAnimation(mod.default);
      });
    }
  }, []);

  return (
    <section id="mobile-app" className="py-24 md:py-32 px-6 lg:px-8 relative overflow-hidden">
      {/* Background elements - more subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-purple-900/5" />
      <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] md:w-[500px] md:h-[500px] bg-purple-500 rounded-full blur-[40px] md:blur-[120px] opacity-[0.07] transform-gpu" />
      <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] md:w-[500px] md:h-[500px] bg-pink-500 rounded-full blur-[40px] md:blur-[120px] opacity-[0.07] transform-gpu" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header - Improved typography */}
        <motion.div
          className="text-center mb-20 space-y-6 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* E-commerce Lottie - decorative behind header */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            {ecommerceAnimation && (
              <LottieAnimation
                animationData={ecommerceAnimation}
                className="w-80 h-80"
                loop={true}
              />
            )}
          </motion.div>

          <motion.span
            className="inline-block text-sm font-medium text-purple-400 tracking-wide uppercase relative z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Mobile App
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight font-heading relative z-10">
            A Shopping Experience
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Your Customers Will Love
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed relative z-10">
            Give your customers a beautiful, feature-rich mobile shopping app that keeps them coming back.
          </p>
        </motion.div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          {/* Left Features */}
          <div className="space-y-6 lg:order-1">
            {mobileFeatures.slice(0, 4).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group"
              >
                <div className="relative">
                  {/* Hover glow */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`} />

                  {/* Card */}
                  <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 group-hover:border-transparent group-hover:bg-slate-900 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-full h-full text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Center Phone Mockup - Premium Design */}
          <motion.div
            className="lg:order-2 flex justify-center py-8 lg:py-0"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {/* Phone glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl scale-150 opacity-50" />

              {/* Phone Frame */}
              <div className="relative">
                <div className="relative w-64 lg:w-72 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-purple-500/20 border-4 border-gray-700/50">
                  {/* Screen */}
                  <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-[2.5rem] overflow-hidden relative aspect-[9/19]">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                    {/* App Content */}
                    <div className="pt-8 px-4 space-y-4 relative">
                      {/* App Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-3 w-20 bg-white/20 rounded mb-1" />
                          <div className="h-2 w-14 bg-white/10 rounded" />
                        </div>
                        <div className="w-8 h-8 bg-white/10 rounded-full" />
                      </div>

                      {/* Search Bar */}
                      <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <Search className="w-4 h-4 text-slate-500" />
                        <div className="h-2 w-24 bg-white/10 rounded" />
                      </div>

                      {/* Product Cards */}
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                          >
                            <div className="aspect-[4/3] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-2" />
                            <div className="space-y-1.5">
                              <div className="h-2.5 bg-white/20 rounded w-3/4" />
                              <div className="h-2 bg-white/10 rounded w-1/2" />
                              <div className="flex items-center justify-between mt-2">
                                <div className="h-3 bg-purple-500/40 rounded w-16" />
                                <Heart className="w-4 h-4 text-slate-500" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 p-3">
                      <div className="flex items-center justify-around">
                        {[Home, Search, ShoppingBag, Heart].map((Icon, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl ${i === 0 ? 'bg-purple-500/20' : ''}`}
                          >
                            <Icon className={`w-5 h-5 ${i === 0 ? 'text-purple-400' : 'text-slate-500'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Icons */}
                <motion.div
                  className="absolute -top-4 -left-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-3 shadow-xl shadow-purple-500/30"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Heart className="w-full h-full text-white" />
                </motion.div>

                <motion.div
                  className="absolute top-1/3 -right-8 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-3 shadow-xl shadow-blue-500/30"
                  animate={{
                    y: [0, 15, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.1,
                  }}
                >
                  <ShoppingBag className="w-full h-full text-white" />
                </motion.div>

                <motion.div
                  className="absolute bottom-1/4 -left-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-3 shadow-xl shadow-amber-500/30"
                  animate={{
                    y: [0, -12, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                >
                  <Star className="w-full h-full text-white" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-2.5 shadow-xl shadow-emerald-500/30"
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -3, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                >
                  <Bell className="w-full h-full text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Features */}
          <div className="space-y-6 lg:order-3">
            {mobileFeatures.slice(4, 8).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group"
              >
                <div className="relative">
                  {/* Hover glow */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`} />

                  {/* Card */}
                  <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 group-hover:border-transparent group-hover:bg-slate-900 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-full h-full text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Section - Premium Design */}
        <motion.div
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {[
            { label: 'App Downloads', value: '100K+', gradient: 'from-purple-500 to-pink-500' },
            { label: 'Customer Reviews', value: '4.8/5', gradient: 'from-amber-500 to-orange-500' },
            { label: 'Order Completion', value: '94%', gradient: 'from-emerald-500 to-teal-500' },
            { label: 'Return Rate', value: '<2%', gradient: 'from-blue-500 to-cyan-500' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              {/* Hover glow */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`} />

              {/* Card */}
              <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 text-center group-hover:border-transparent group-hover:bg-slate-900 transition-all duration-300">
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/schedule-demo">
            <motion.button
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-2">
                Launch Your Mobile App
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
