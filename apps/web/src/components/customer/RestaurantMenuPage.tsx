'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Filter, ShoppingCart, Clock, MapPin, Star, Heart, Bot, X, ChevronUp, QrCode } from 'lucide-react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { MenuItemCard } from './MenuItemCard';
import { CartDrawer } from './CartDrawer';
import { AIChatbot } from './AIChatbot';
import { AIRecommendations } from './AIRecommendations';
import { toast } from 'sonner';
import Link from 'next/link';
import { getDetailedStatus, formatTime12h } from '@/utils/operatingHours';

interface RestaurantMenuPageProps {
  slug: string;
  tableNumber?: string;
}

export function RestaurantMenuPage({ slug, tableNumber }: RestaurantMenuPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'VEGAN'>('ALL');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { items: cartItems, itemCount, setRestaurant } = useCartStore();
  const { user: rawUser, loginRestaurantSlug, logout } = useAuthStore();
  
  const activeUser = useMemo(() => {
    if (!rawUser) return null;
    if (rawUser.role !== 'CUSTOMER') return rawUser;
    if (loginRestaurantSlug === slug) return rawUser;
    return null;
  }, [rawUser, loginRestaurantSlug, slug]);

  const [showHours, setShowHours] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['menu', slug],
    queryFn: async () => {
      const response = await api.get(`/menu/${slug}`);
      return response.data.data as {
        restaurant: {
          id: string;
          name: string;
          slug: string;
          logo: string | null;
          banner: string | null;
          description: string | null;
          cuisineType: string | null;
          isOpen: boolean;
          operatingHours: Record<string, { open: string; close: string; closed: boolean }> | null;
          minOrderValue: number;
          themeColor: string | null;
        };
        categories: Array<{
          id: string;
          name: string;
          items: Array<{
            id: string;
            name: string;
            description: string | null;
            price: number;
            image: string | null;
            isVeg: boolean;
            isVegan: boolean;
            isAvailable: boolean;
            badges: string[];
            variants: Array<{ id: string; name: string; price: number }>;
            addOns: Array<{ id: string; name: string; price: number }>;
          }>;
        }>;
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const statusInfo = useMemo(() => {
    if (!data?.restaurant) return { status: 'CLOSED' as const, badgeText: 'Closed', detailText: 'Closed' };
    return getDetailedStatus(data.restaurant.operatingHours as any, data.restaurant.isOpen);
  }, [data]);

  useEffect(() => {
    if (data?.restaurant) {
      setRestaurant(slug, data.restaurant.id);
    }
  }, [data, slug, setRestaurant]);

  useEffect(() => {
    if (tableNumber) {
      toast.info(`Ordering for Table ${tableNumber}`);
    }
  }, [tableNumber]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return data.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const matchesSearch =
            !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesFilter =
            activeFilter === 'ALL' ||
            (activeFilter === 'VEG' && item.isVeg && !item.isVegan) ||
            (activeFilter === 'NON_VEG' && !item.isVeg) ||
            (activeFilter === 'VEGAN' && item.isVegan);

          return matchesSearch && matchesFilter;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data, searchQuery, activeFilter]);

  const cartCount = itemCount();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-display font-bold mb-2">Restaurant Not Found</h2>
        <p className="text-muted-foreground">This restaurant may have moved or is temporarily unavailable.</p>
      </div>
    );
  }

  if (isLoading) {
    return <MenuSkeleton />;
  }

  const { restaurant, categories } = data!;
  const themeColor = restaurant.themeColor ?? '#E85D04';

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Floating Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <Link href="/" className="flex items-center gap-1.5 text-white drop-shadow-md hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight">QR Restaurant</span>
        </Link>
        <div className="flex items-center gap-3">
          {activeUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/90 font-semibold bg-white/10 px-2.5 py-1.5 rounded-lg backdrop-blur-md">
                Hi, {activeUser.name.split(' ')[0]}
              </span>
              {activeUser.role !== 'CUSTOMER' ? (
                <Link
                  href={activeUser.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/owner/dashboard'}
                  className="text-xs bg-primary hover:bg-primary/95 border border-primary/20 px-3 py-1.5 rounded-lg text-white font-semibold shadow-sm transition-all"
                >
                  Dashboard
                </Link>
              ) : null}
              <button
                onClick={() => {
                  logout();
                  toast.success('Logged out successfully');
                }}
                className="text-xs bg-red-500/80 hover:bg-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-white font-semibold shadow-sm transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href={`/login?restaurant=${slug}`}
                className="text-xs bg-primary hover:bg-primary/95 border border-primary/20 px-3 py-1.5 rounded-lg text-white font-semibold shadow-sm transition-all"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-semibold shadow-sm transition-all"
              >
                Partner Login
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {restaurant.banner ? (
          <Image
            src={restaurant.banner}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${themeColor}, #F48C06)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      </div>

      {/* Restaurant Header */}
      <div className="relative -mt-16 px-4 md:px-8">
        <div className="flex items-end gap-4 mb-4">
          {restaurant.logo ? (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 border-background shadow-xl flex-shrink-0">
              <Image src={restaurant.logo} alt={restaurant.name} width={96} height={96} className="object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background shadow-xl flex-shrink-0 flex items-center justify-center text-3xl"
              style={{ backgroundColor: themeColor }}>
              🍽️
            </div>
          )}
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap relative">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
              
              {/* Interactive Status Badge & Weekly Hours Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowHours(!showHours)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                    statusInfo.status === 'OPEN'
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20 dark:bg-green-500/20 dark:text-green-400'
                      : statusInfo.status === 'TEMPORARILY_CLOSED'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-500/20 dark:text-red-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    statusInfo.status === 'OPEN'
                      ? 'bg-green-500'
                      : statusInfo.status === 'TEMPORARILY_CLOSED'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`} />
                  <span>{statusInfo.badgeText}</span>
                  <span className="text-[10px] opacity-75 font-normal">({statusInfo.detailText})</span>
                  <Clock className="w-3 h-3 ml-0.5 opacity-60" />
                </button>

                {/* Dropdown Weekly Hours */}
                <AnimatePresence>
                  {showHours && restaurant.operatingHours && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowHours(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 z-50 w-72 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 text-card-foreground"
                      >
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" /> Weekly Hours
                          </h4>
                          <button onClick={() => setShowHours(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const dayHours = (restaurant.operatingHours as any)?.[day];
                            const isToday = new Date().getDay() === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
                            return (
                              <div
                                key={day}
                                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                                  isToday
                                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-sm'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                <span className="capitalize">{day}</span>
                                <span>
                                  {dayHours?.closed || !dayHours?.open
                                    ? 'Closed'
                                    : `${formatTime12h(dayHours.open)} - ${formatTime12h(dayHours.close)}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {restaurant.cuisineType && (
              <p className="text-muted-foreground text-sm mt-1">{restaurant.cuisineType}</p>
            )}
            {tableNumber && (
              <div className="flex items-center gap-1.5 text-sm font-medium mt-1" style={{ color: themeColor }}>
                <MapPin className="w-3.5 h-3.5" />
                Table {tableNumber}
              </div>
            )}
          </div>
        </div>

        {/* Minimum order info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 25–35 min</span>
          <span>Min order: ₹{restaurant.minOrderValue}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.5</span>
        </div>
      </div>

      {/* AI Recommendations (logged-in only) */}
      {activeUser && (
        <div className="px-4 md:px-8 mb-4">
          <AIRecommendations restaurantId={restaurant.id} themeColor={themeColor} />
        </div>
      )}

      {/* Search and Filters */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button className="p-2.5 bg-muted rounded-xl">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Veg/Non-veg filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['ALL', 'VEG', 'NON_VEG', 'VEGAN'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === filter
                  ? 'text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              style={activeFilter === filter ? { backgroundColor: themeColor } : {}}
            >
              {filter === 'ALL' ? 'All Items' : filter === 'VEG' ? '🟢 Veg' : filter === 'NON_VEG' ? '🔴 Non-Veg' : '🌿 Vegan'}
            </button>
          ))}

          <div className="w-px bg-border mx-1 flex-shrink-0" />

          {/* Category quick jump */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: themeColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories */}
      <div className="px-4 md:px-8 pt-4 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display font-semibold text-lg mb-2">No items found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} id={`cat-${category.id}`}>
              <h2 className="font-display text-xl font-bold mb-4">{category.name}</h2>
              <div className="grid gap-4">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    themeColor={themeColor}
                    restaurantId={restaurant.id}
                    restaurantSlug={slug}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-30"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${themeColor}, #F48C06)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {cartCount}
                </div>
                <span className="font-semibold">View Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-bold">₹{useCartStore.getState().total().toFixed(0)}</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurantSlug={slug}
        tableNumber={tableNumber}
        themeColor={themeColor}
      />

      {/* AI Chatbot */}
      <AnimatePresence>
        {chatOpen && (
          <AIChatbot
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            themeColor={themeColor}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Chat & Scroll to top buttons */}
      <div className="fixed bottom-24 right-4 z-20 flex flex-col gap-3">
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setChatOpen(true)}
          className="w-12 h-12 rounded-full text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: themeColor }}
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-48 skeleton" />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 skeleton rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="h-7 skeleton rounded-lg w-2/3" />
            <div className="h-4 skeleton rounded-lg w-1/2" />
          </div>
        </div>
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-10 skeleton rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
