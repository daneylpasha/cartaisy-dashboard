'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layout,
  Users,
  TrendingUp,
  Link as LinkIcon,
  Check,
  ArrowRight,
  Grip,
  Star,
  ShoppingCart,
  BarChart3,
  Settings
} from 'lucide-react';
import LottieAnimation from '@/components/ui/LottieAnimation';
import onlineShoppingAnimation from '@/public/lottie/Online Shopping.json';

const dashboardFeatures = [
  {
    icon: Layout,
    title: 'Homescreen Builder',
    description: 'Drag and drop components to design your mobile app\'s homepage. Add carousels, category grids, promo banners, and collection showcases. See changes in real-time.',
    components: [
      'Product Carousels',
      'Category Grids',
      'Promo Banners',
      'Collection Displays',
    ],
    gradient: 'from-purple-500 to-pink-500',
    mockupType: 'builder',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite team members, set roles, and collaborate seamlessly. Super admins can manage everything while regular admins handle day-to-day operations.',
    components: [
      'Role-based Access',
      'Invite System',
      'Activity Logging',
      'Permission Control'
    ],
    gradient: 'from-blue-500 to-cyan-500',
    mockupType: 'team',
  },
  {
    icon: TrendingUp,
    title: 'Customer Insights',
    description: 'View customer orders, manage reviews, and track engagement. Understand your audience with detailed analytics to grow your business.',
    components: [
      'Order Management',
      'Review Moderation',
      'Customer Profiles',
      'Engagement Metrics'
    ],
    gradient: 'from-violet-500 to-purple-500',
    mockupType: 'analytics',
  },
  {
    icon: LinkIcon,
    title: 'Shopify Sync',
    description: 'Connect your Shopify store in seconds. Products, inventory, and orders stay in sync automatically. No manual updates needed.',
    components: [
      'One-Click Connect',
      'Auto Product Sync',
      'Inventory Updates',
      'Order Integration'
    ],
    gradient: 'from-green-500 to-emerald-500',
    mockupType: 'sync',
  },
];

// Realistic mockup components
function BuilderMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Layout className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-white">App Builder</span>
        <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Live</span>
      </div>
      {['Hero Banner', 'Product Carousel', 'Collections'].map((item, i) => (
        <motion.div
          key={item}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.08 }}
        >
          <Grip className="w-4 h-4 text-slate-600" />
          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-blue-400' : 'bg-purple-400'}`} />
          <span className="text-sm text-slate-300">{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

function TeamMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white">Team Members</span>
      </div>
      {[
        { name: 'Sarah Chen', role: 'Super Admin', color: 'bg-purple-500' },
        { name: 'Mike Johnson', role: 'Admin', color: 'bg-blue-500' },
        { name: 'Emily Davis', role: 'Editor', color: 'bg-pink-500' },
      ].map((member, i) => (
        <motion.div
          key={member.name}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.08 }}
        >
          <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-medium`}>
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="text-sm text-white">{member.name}</div>
            <div className="text-xs text-slate-500">{member.role}</div>
          </div>
          <Settings className="w-4 h-4 text-slate-600" />
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-white">Analytics</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Orders', value: '1,247', change: '+12%' },
          { label: 'Revenue', value: '$48.2K', change: '+8%' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <div className="text-xs text-slate-500">{stat.label}</div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs text-emerald-400">{stat.change}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="text-sm text-slate-300">4.8 avg rating</span>
        <span className="text-xs text-slate-500">(847 reviews)</span>
      </div>
    </div>
  );
}

function SyncMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <LinkIcon className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-white">Shopify Connected</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Synced
        </span>
      </div>
      {[
        { label: 'Products', count: '1,247', icon: ShoppingCart },
        { label: 'Orders', count: '3,891', icon: TrendingUp },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.08 }}
        >
          <item.icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">{item.label}</span>
          <span className="ml-auto text-sm font-medium text-white">{item.count}</span>
        </motion.div>
      ))}
      <div className="text-xs text-slate-500 text-center">Last synced 2 minutes ago</div>
    </div>
  );
}

const mockupComponents: Record<string, React.ComponentType> = {
  builder: BuilderMockup,
  team: TeamMockup,
  analytics: AnalyticsMockup,
  sync: SyncMockup,
};

export default function DashboardFeaturesSection() {
  return (
    <section id="dashboard" className="py-24 md:py-32 px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient - more subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header - Improved typography */}
        <motion.div
          className="text-center mb-24 space-y-6 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* Online Shopping Lottie - decorative behind header */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <LottieAnimation
              animationData={onlineShoppingAnimation}
              className="w-80 h-80"
              loop={true}
            />
          </div>

          <motion.span
            className="inline-block text-sm font-medium text-purple-400 tracking-wide uppercase relative z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Dashboard
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight font-heading relative z-10">
            Powerful Dashboard for
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Store Management
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed relative z-10">
            Everything you need to build, customize, and manage your mobile commerce platform in one intuitive interface.
          </p>
        </motion.div>

        {/* Features List - Better spacing */}
        <div className="space-y-24 lg:space-y-32">
          {dashboardFeatures.map((feature, index) => {
            const MockupComponent = mockupComponents[feature.mockupType];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4 }}
              >
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  index % 2 === 1 ? '' : ''
                }`}>
                  {/* Content Side */}
                  <div className={`space-y-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    {/* Icon */}
                    <motion.div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 inline-flex shadow-lg`}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <feature.icon className="w-full h-full text-white" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight font-heading">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lg text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Component List - Improved */}
                    <div className="grid grid-cols-2 gap-4">
                      {feature.components.map((component, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + idx * 0.03 }}
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} p-1 shrink-0 flex items-center justify-center`}>
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-gray-300 text-sm">{component}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mockup Side - Premium Design */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <motion.div
                      className="relative group"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Glow effect */}
                      <div className={`absolute -inset-4 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

                      {/* Browser Frame */}
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        {/* Browser Chrome */}
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500/80" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                              <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="bg-gray-700/50 rounded-lg px-4 py-1.5 text-xs text-gray-400 text-center max-w-[200px] mx-auto">
                                dashboard.cartaisy.com
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Browser Content */}
                        <div className="bg-slate-900/95 backdrop-blur-xl border-x border-b border-white/5 p-6">
                          {MockupComponent && <MockupComponent />}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA - Refined */}
        <motion.div
          className="text-center mt-24 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xl text-gray-400">
            Ready to see how easy store management can be?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/schedule-demo">
              <motion.button
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Request Dashboard Tour
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <Link href="/docs">
              <motion.button
                className="px-8 py-4 backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl font-semibold text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                View Documentation
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
