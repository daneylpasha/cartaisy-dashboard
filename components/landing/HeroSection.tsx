"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Star,
  Play,
  Bell,
  TrendingUp,
  Layout,
  Grip,
  Zap,
} from "lucide-react";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  float,
  floatSlow,
  pulseGlow,
  buttonTap,
  textReveal,
} from "@/lib/animations";
import { analytics } from "@/lib/analytics";
import DemoVideoModal from "./DemoVideoModal";
import LottieAnimation from "@/components/ui/LottieAnimation";
import shoppingCartAnimation from "@/public/lottie/shopping cart.json";

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { scrollY } = useScroll();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Parallax values - disabled on mobile
  const heroY = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, isMobile ? 1 : 0]);
  // Lottie fades IN as hero fades OUT
  const lottieOpacity = useTransform(scrollY, [0, 300], [0, isMobile ? 0 : 1]);

  // Spring mouse position for smooth tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Mouse-based transforms for gradient orb
  const orbX = useTransform(smoothMouseX, [0, 1920], [-200, 200]);
  const orbY = useTransform(smoothMouseY, [0, 1080], [-200, 200]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative md:min-h-screen flex items-start md:items-center pt-20 md:pt-24 pb-8 md:pb-32 px-4 md:px-6 lg:px-8">
      {/* Dynamic Gradient Background - GPU accelerated */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none will-change-transform">
        {/* Animated gradient orbs - GPU accelerated for smooth performance */}
        <motion.div
          className="absolute w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] bg-purple-600/15 rounded-full blur-[80px] md:blur-[150px] transform-gpu"
          style={{
            x: orbX,
            y: orbY,
          }}
          variants={pulseGlow}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute top-1/3 right-0 w-[400px] h-[400px] md:w-[700px] md:h-[700px] bg-violet-600/10 rounded-full blur-[60px] md:blur-[120px] translate-x-1/2 transform-gpu"
          variants={floatSlow}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-fuchsia-600/8 rounded-full blur-[50px] md:blur-[100px] transform-gpu"
          variants={float}
          initial="initial"
          animate="animate"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]" />
      </div>

      <motion.div
        className="max-w-7xl mx-auto w-full relative z-10"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            className="text-center lg:text-left"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Animated Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] mb-8"
              variants={fadeInDown}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-slate-300">
                Now powering 500+ Shopify stores
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </motion.div>

            {/* Main Headline - Improved typography */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight mb-8 font-heading"
              variants={textReveal}
            >
              <span className="block bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
                Build Your
              </span>
              <motion.span
                className="block bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% auto" }}
              >
                Mobile Commerce
              </motion.span>
              <span className="block bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
                Empire
              </span>
            </motion.h1>

            {/* Subheadline - Better line height */}
            <motion.p
              className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
              variants={fadeInUp}
            >
              The complete dashboard to design, manage, and optimize your
              Shopify mobile app. Drag-and-drop components, real-time analytics,
              and instant updates.
            </motion.p>

            {/* CTA Buttons - Refined */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              variants={fadeInUp}
            >
              <Link href="/login" onClick={() => analytics.ctaClick('get_started')}>
                <motion.button
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden shadow-lg shadow-purple-500/20"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={buttonTap}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ backgroundSize: "200% auto" }}
                  />
                  <span className="relative z-10">Get Started Free</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.button
                onClick={() => {
                  analytics.ctaClick('watch_demo');
                  analytics.videoWatched('demo_video');
                  setIsVideoOpen(true);
                }}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white/90 backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={buttonTap}
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Trust Indicators - Enhanced */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-8 justify-center lg:justify-start"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-black bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-medium text-white shadow-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-400">500+ merchants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-400">4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual - Premium Dashboard Preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow effect behind mockup */}
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-violet-500/10 to-pink-500/20 blur-3xl rounded-3xl"
              variants={pulseGlow}
              initial="initial"
              animate="animate"
            />

            {/* Browser Chrome Frame */}
            <div className="relative">
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.4 }}
              >
                {/* Browser Top Bar */}
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-700/50 rounded-lg px-4 py-1.5 text-xs text-gray-400 text-center max-w-xs mx-auto">
                        dashboard.cartaisy.com
                      </div>
                    </div>
                  </div>
                </div>

                {/* Browser Content Area */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-x border-b border-white/5 p-6">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Layout className="w-4 h-4 text-white" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          My Store
                        </div>
                        <div className="text-xs text-slate-500">Pro Plan</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Bell className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/50 to-pink-500/50" />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        label: "Revenue",
                        value: "$12.4K",
                        change: "+12%",
                        color: "text-emerald-400",
                      },
                      {
                        label: "Orders",
                        value: "847",
                        change: "+8%",
                        color: "text-blue-400",
                      },
                      {
                        label: "Visitors",
                        value: "2.1K",
                        change: "+24%",
                        color: "text-purple-400",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                      >
                        <p className="text-xs text-slate-500 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p
                          className={`text-xs ${stat.color} flex items-center gap-1`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* App Builder Preview */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Layout className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">
                        App Builder
                      </span>
                      <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        "Hero Banner",
                        "Product Carousel",
                        "Collections Grid",
                      ].map((item, i) => (
                        <motion.div
                          key={item}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                        >
                          <Grip className="w-4 h-4 text-slate-600" />
                          <div
                            className={`w-2 h-2 rounded-full ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-blue-400" : "bg-purple-400"}`}
                          />
                          <span className="text-sm text-slate-300">{item}</span>
                          <div className="ml-auto">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${85 - i * 15}%` }}
                                transition={{
                                  delay: 0.4 + i * 0.1,
                                  duration: 0.5,
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Phone Mockup */}
              <motion.div
                className="absolute -right-6 -bottom-6 w-40 hidden lg:block"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="relative">
                  <div className="bg-gray-900 rounded-[2rem] p-1.5 shadow-2xl shadow-black/50 border-2 border-gray-800">
                    <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-[1.75rem] overflow-hidden aspect-[9/19] relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-gray-900 rounded-b-xl" />
                      {/* App content preview */}
                      <div className="p-3 pt-7">
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="bg-white/10 rounded-lg h-16 backdrop-blur-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -left-6 top-1/4 hidden lg:block"
              variants={float}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-3 flex flex-col items-center justify-center shadow-xl"
                whileHover={{ scale: 1.1, y: -4 }}
              >
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-0.5" />
                <span className="text-xs text-emerald-400 font-semibold">
                  +47%
                </span>
              </motion.div>
            </motion.div>


            <motion.div
              className="absolute -left-2 bottom-1/4 hidden lg:block"
              variants={float}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2 shadow-xl"
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm font-medium text-emerald-400">Live</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Centered Shopping Cart Lottie Animation - fades in as hero fades out */}
      <motion.div
        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 hidden md:block"
        style={{ opacity: lottieOpacity }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <LottieAnimation
            animationData={shoppingCartAnimation}
            className="w-48 h-48"
            loop={true}
          />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="text-xs text-slate-500">Scroll to explore</span>
        <motion.div
          className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
          animate={{
            borderColor: [
              "rgba(255,255,255,0.2)",
              "rgba(168,85,247,0.4)",
              "rgba(255,255,255,0.2)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 rounded-full bg-white/50"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* Demo Video Modal */}
      <DemoVideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </section>
  );
}
