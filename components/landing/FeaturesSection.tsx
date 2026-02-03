"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Smartphone,
  ShoppingBag,
  RefreshCw,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const features = [
  {
    icon: Palette,
    title: "Customizable Dashboard",
    description:
      "Design your mobile app's homescreen with drag-and-drop components. Carousels, banners, collections - all customizable.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "Native Mobile App",
    description:
      "Your customers get a beautiful React Native app branded with your logo and colors. iOS and Android ready.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: ShoppingBag,
    title: "Complete E-commerce",
    description:
      "Orders, wishlists, reviews, customer management - everything you need to run your online store.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: RefreshCw,
    title: "Shopify Integration",
    description:
      "Already on Shopify? Sync your products, orders, and inventory seamlessly with one click.",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Multi-tenant Architecture",
    description:
      "Invite your team, manage roles, and collaborate. Each store is completely isolated and secure.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track orders, customer behavior, and sales. Make data-driven decisions with powerful insights.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-6 lg:px-8 relative">
      {/* Background decoration - more subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header - Improved typography */}
        <motion.div
          className="text-center mb-20 space-y-6 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="inline-block text-sm font-medium text-purple-400 tracking-wide uppercase relative z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Features
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight relative z-10 font-heading">
            Everything You Need to Launch
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Your Mobile Store
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed relative z-10">
            A complete platform with all the tools you need to build, manage,
            and grow your mobile commerce business.
          </p>
        </motion.div>

        {/* Features Grid - Premium card design */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative"
            >
              {/* Gradient border effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />

              {/* Card */}
              <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-transparent group-hover:bg-slate-900">
                {/* Icon with gradient background */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3.5 mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                >
                  <feature.icon className="w-full h-full text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA - Refined */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-gray-400 mb-8 text-lg">
            Want to see these features in action?
          </p>
          <Link href="/schedule-demo">
            <motion.button
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-2">
                Schedule a Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
