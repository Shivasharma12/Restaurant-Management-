'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, Banknote, Wallet, MapPin, User, Phone, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}

const guestSchema = z.object({
  guestName: z.string().min(2, 'Name required'),
  guestPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
  paymentMethod: z.enum(['RAZORPAY', 'COD']),
});

type GuestForm = z.infer<typeof guestSchema>;

const GST_RATE = 0.18;
const DELIVERY_FEE = 40;
const PACKAGING_FEE = 15;

interface CheckoutPageProps {
  restaurantSlug: string;
  tableNumber?: string;
}

export function CheckoutPage({ restaurantSlug, tableNumber }: CheckoutPageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, couponCode, couponDiscount, clearCart, subtotal, total } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'RAZORPAY' | 'COD' | 'WALLET'>('RAZORPAY');

  const subtotalAmount = subtotal();
  const gst = subtotalAmount * GST_RATE;
  const grandTotal = total();

  const { register, handleSubmit, formState: { errors } } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { paymentMethod: 'RAZORPAY' },
  });

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderId: string, razorpayOrderId: string, amount: number, customerName: string, customerPhone: string) => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      return;
    }

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'QR Restaurant',
      description: `Order #${orderId.slice(-8).toUpperCase()}`,
      order_id: razorpayOrderId,
      handler: async (response) => {
        try {
          await api.post('/orders/verify-payment', {
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          clearCart();
          toast.success('Payment successful! 🎉');
          router.push(`/r/${restaurantSlug}/order/${orderId}`);
        } catch {
          toast.error('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: customerName,
        email: user?.email ?? '',
        contact: customerPhone,
      },
      theme: { color: '#E85D04' },
    };

    new window.Razorpay(options).open();
  };

  const onGuestSubmit = async (formData: GuestForm) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/orders/guest', {
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        tableNumber,
        paymentMethod: formData.paymentMethod,
        couponCode: couponCode ?? undefined,
        restaurantSlug,
        cartItems: items.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          addOns: item.addOns,
        })),
      });

      const { order } = response.data.data as {
        order: { id: string; total: number; razorpayOrderId: string | null };
      };

      if (formData.paymentMethod === 'RAZORPAY' && order.razorpayOrderId) {
        await handleRazorpayPayment(order.id, order.razorpayOrderId, order.total, formData.guestName, formData.guestPhone);
      } else {
        clearCart();
        toast.success('Order placed successfully! 🎉');
        router.push(`/r/${restaurantSlug}/order/${order.id}`);
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onUserOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const response = await api.post('/orders', {
        tableNumber,
        paymentMethod: selectedPayment,
        couponCode: couponCode ?? undefined,
        restaurantSlug,
        useWallet: selectedPayment === 'WALLET',
      });

      const { order } = response.data.data as {
        order: { id: string; total: number; razorpayOrderId: string | null };
      };

      if (selectedPayment === 'RAZORPAY' && order.razorpayOrderId) {
        await handleRazorpayPayment(order.id, order.razorpayOrderId, order.total, user!.name, user!.phone ?? '');
      } else {
        clearCart();
        toast.success('Order placed! 🎉');
        router.push(`/r/${restaurantSlug}/order/${order.id}`);
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Checkout</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-3">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                <span>₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₹{subtotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (18%)</span><span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery + Packaging</span><span>₹{DELIVERY_FEE + PACKAGING_FEE}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({couponCode})</span><span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-2">
              <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-display font-semibold mb-3">Payment Method</h2>
          <div className="space-y-2">
            {[
              { value: 'RAZORPAY', label: 'Pay Online', sublabel: 'UPI, Cards, Net Banking', icon: <CreditCard className="w-5 h-5" /> },
              { value: 'COD', label: 'Cash on Delivery', sublabel: 'Pay when order arrives', icon: <Banknote className="w-5 h-5" /> },
              ...(user ? [{ value: 'WALLET', label: 'Wallet', sublabel: `Balance: ₹${user.walletBalance}`, icon: <Wallet className="w-5 h-5" /> }] : []),
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedPayment(method.value as 'RAZORPAY' | 'COD' | 'WALLET')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedPayment === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedPayment === method.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {method.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.sublabel}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPayment === method.value ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Guest or user form */}
        {user ? (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-display font-semibold mb-3">Your Details</h2>
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {tableNumber && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Table {tableNumber}</span>
              </div>
            )}
            <button
              onClick={onUserOrder}
              disabled={loading || items.length === 0}
              className="w-full mt-4 py-4 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(0)}`}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onGuestSubmit)} className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <h2 className="font-display font-semibold">Your Details</h2>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('guestName')}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('guestPhone')}
                  placeholder="9876543210"
                  type="tel"
                  maxLength={10}
                  className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.guestPhone && <p className="text-red-500 text-xs mt-1">{errors.guestPhone.message}</p>}
            </div>

            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium underline">
                Log in
              </Link>{' '}
              for loyalty points & order history.
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full py-4 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(0)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
