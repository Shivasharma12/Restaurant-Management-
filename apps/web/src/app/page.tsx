'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, QrCode, Zap, BarChart3, Shield, Star, ChefHat, Clock, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl">QR Restaurant</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">
            Restaurant Login
          </Link>
          <Link href="/login" className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-all">
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-sm text-orange-400 mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>AI-Powered Restaurant Platform</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black mb-6 leading-tight">
              Scan. Order.{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Enjoy.
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The complete QR-based restaurant ordering platform. Customers scan, browse, order, and track — 
              all without downloading an app. You get real-time orders, AI insights, and powerful analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/r/upstates" className="btn-premium flex items-center gap-2 justify-center text-base">
                Try Live Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-semibold transition-all text-base">
                Restaurant Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm max-w-4xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                {/* QR Panel */}
                <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 rounded-xl p-4 flex flex-col items-center gap-3">
                  <QrCode className="w-12 h-12 text-orange-400" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Scan QR</p>
                    <p className="text-xs text-slate-400">Table 5</p>
                  </div>
                </div>

                {/* Menu panel */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold">Upstates</span>
                    <span className="ml-auto text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">● Open</span>
                  </div>
                  <div className="space-y-2">
                    {['Butter Chicken', 'Dal Makhani', 'Garlic Naan'].map((item, i) => (
                      <div key={item} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? 'border-red-500' : 'border-green-500'}`} />
                          <span className="text-xs">{item}</span>
                        </div>
                        <span className="text-xs text-orange-400 font-semibold">
                          ₹{[420, 280, 80][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order tracking bar */}
              <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Order Tracking</span>
                  </div>
                  <span className="text-xs text-slate-400">Est. 25 min</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {['Confirmed', 'Preparing', 'Ready', 'Delivered'].map((step, i) => (
                    <div key={step} className="flex items-center gap-1 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      {i < 3 && <div className={`flex-1 h-0.5 ${i < 1 ? 'bg-green-500' : 'bg-white/10'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Restaurants' },
            { value: '50K+', label: 'Orders/day' },
            { value: '4.9★', label: 'Avg Rating' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-3xl font-black gradient-text">{stat.value}</div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="gradient-text">run a modern restaurant</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From QR ordering to AI-powered insights — one platform handles everything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: 'QR Menu Ordering',
                description: 'Customers scan, browse, and order in under 30 seconds. No app install, no friction.',
                color: 'from-orange-500/20 to-amber-500/20',
                border: 'border-orange-500/20',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Real-Time Tracking',
                description: 'Live order status updates via WebSocket. Customers know exactly when food arrives.',
                color: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-500/20',
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'AI Analytics',
                description: 'Gemini-powered demand forecasting, peak hour heatmaps, and revenue predictions.',
                color: 'from-purple-500/20 to-pink-500/20',
                border: 'border-purple-500/20',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'Smart Recommendations',
                description: 'Groq AI suggests personalized menu items based on order history and preferences.',
                color: 'from-yellow-500/20 to-orange-500/20',
                border: 'border-yellow-500/20',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Secure Payments',
                description: 'Razorpay integration with UPI, cards, wallets, and Cash on Delivery support.',
                color: 'from-green-500/20 to-emerald-500/20',
                border: 'border-green-500/20',
              },
              {
                icon: <ChefHat className="w-6 h-6" />,
                title: 'Menu Management',
                description: 'Drag-and-drop categories, variants, add-ons, availability toggles, and bulk CSV upload.',
                color: 'from-red-500/20 to-rose-500/20',
                border: 'border-red-500/20',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br ${feature.color} border ${feature.border} rounded-2xl p-6 card-hover`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-3xl p-12">
            <h2 className="font-display text-4xl font-bold mb-4">
              Ready to transform your restaurant?
            </h2>
            <p className="text-slate-400 mb-8">
              Join 500+ restaurants already using QR Restaurant to deliver better dining experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-premium text-center">
                Get Started Free
              </Link>
              <Link href="/r/upstates" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-semibold transition-all">
                <QrCode className="w-4 h-4" />
                Try Demo Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <QrCode className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold">QR Restaurant</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 QR Restaurant SaaS. Built with ❤️ in India.</p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">For Restaurants</Link>
            <Link href="/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
