'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Package, Bike, Star, RotateCcw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

const ORDER_STEPS = [
  { key: 'PENDING', icon: <Clock className="w-5 h-5" />, label: 'Order Placed' },
  { key: 'CONFIRMED', icon: <CheckCircle2 className="w-5 h-5" />, label: 'Confirmed' },
  { key: 'PREPARING', icon: <ChefHat className="w-5 h-5" />, label: 'Preparing' },
  { key: 'READY', icon: <Package className="w-5 h-5" />, label: 'Ready' },
  { key: 'ON_THE_WAY', icon: <Bike className="w-5 h-5" />, label: 'On the Way' },
  { key: 'DELIVERED', icon: <Star className="w-5 h-5" />, label: 'Delivered' },
] as const;

const STATUS_INDEX = (status: string) =>
  ORDER_STEPS.findIndex((s) => s.key === status);

interface Order {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  guestName: string | null;
  tableNumber: string | null;
  createdAt: string;
  restaurant: { name: string; logo: string | null; themeColor: string | null; phone: string | null };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: { name: string; image: string | null };
    variant: { name: string } | null;
  }>;
}

interface OrderTrackingPageProps {
  orderId: string;
  restaurantSlug: string;
}

export function OrderTrackingPage({ orderId, restaurantSlug }: OrderTrackingPageProps) {
  const [currentStatus, setCurrentStatus] = useState<string>('PENDING');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      const ord = response.data.data.order as Order;
      setCurrentStatus(ord.status);
      return ord;
    },
  });

  // Socket.io real-time tracking
  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:4000', {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.emit('join-order', orderId);

    socket.on('order-status-update', (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        setCurrentStatus(data.status);
        toast.info(`Order status: ${data.status.replace(/_/g, ' ')}`, {
          icon: '🍽️',
        });
        if (data.status === 'DELIVERED') {
          setShowRating(true);
        }
      }
    });

    return () => { socket.disconnect(); };
  }, [orderId]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="h-8 skeleton rounded-lg w-48" />
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const themeColor = order.restaurant.themeColor ?? '#E85D04';
  const stepIndex = STATUS_INDEX(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  const isDelivered = currentStatus === 'DELIVERED';

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Restaurant Header */}
      <div className="px-4 py-6" style={{ background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)` }}>
        <div className="max-w-lg mx-auto">
          <p className="text-muted-foreground text-sm mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
          <h1 className="font-display text-2xl font-bold">{order.restaurant.name}</h1>
          {order.tableNumber && (
            <p className="text-sm text-muted-foreground mt-1">Table {order.tableNumber}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-5">
        {/* Status tracker */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-semibold mb-5">
            {isCancelled ? '❌ Order Cancelled' : isDelivered ? '✅ Delivered!' : '🍽️ Tracking Your Order'}
          </h2>

          {!isCancelled && (
            <div className="space-y-4">
              {ORDER_STEPS.map((step, idx) => {
                const isCompleted = idx <= stepIndex;
                const isActive = idx === stepIndex;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted
                        ? 'text-white shadow-lg'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    style={isCompleted ? { backgroundColor: themeColor } : {}}>
                      {step.icon}
                    </div>

                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? 'text-foreground' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {isActive && !isDelivered && (
                        <motion.p
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-xs"
                          style={{ color: themeColor }}
                        >
                          In progress...
                        </motion.p>
                      )}
                    </div>

                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: themeColor }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-3">Your Order</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.menuItem.name}
                  {item.variant && <span className="text-muted-foreground"> ({item.variant.name})</span>}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                <span>₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total Paid</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        {(showRating || isDelivered) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <h2 className="font-display font-semibold mb-3">Rate Your Experience</h2>
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: themeColor }}
                onClick={() => toast.success('Thanks for your feedback!')}
              >
                Submit Rating
              </button>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/r/${restaurantSlug}`} className="flex-1 py-3 rounded-xl border border-border text-center text-sm font-semibold hover:bg-muted transition-colors">
            Back to Menu
          </Link>
          {isDelivered && (
            <button
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <RotateCcw className="w-4 h-4" />
              Reorder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
