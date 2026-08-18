import { create } from 'zustand';
import { Socket } from 'socket.io-client';

export interface WaiterCall {
  id: string;
  tableNumber: string;
  calledAt: string;
  restaurantId?: string;
  type?: 'default' | 'payment' | 'addons';
  amount?: number;
  paymentMethod?: string;
  itemsSummary?: string;
}

interface WaiterState {
  waiterCalls: WaiterCall[];
  activeWaiterAlert: WaiterCall | null;
  socket: Socket | null;
  addWaiterCall: (call: Omit<WaiterCall, 'id'>) => void;
  removeWaiterCall: (id: string) => void;
  setActiveWaiterAlert: (alert: WaiterCall | null) => void;
  clearAll: () => void;
  setSocket: (socket: Socket | null) => void;
}

export const useWaiterStore = create<WaiterState>((set) => ({
  waiterCalls: [],
  activeWaiterAlert: null,
  socket: null,
  addWaiterCall: (payload) => {
    const newCall: WaiterCall = {
      ...payload,
      id: `${payload.tableNumber}-${Date.now()}`,
    };
    set((state) => ({
      waiterCalls: [newCall, ...state.waiterCalls],
      activeWaiterAlert: newCall,
    }));
  },
  removeWaiterCall: (id) =>
    set((state) => ({
      waiterCalls: state.waiterCalls.filter((c) => c.id !== id),
    })),
  setActiveWaiterAlert: (activeWaiterAlert) => set({ activeWaiterAlert }),
  clearAll: () => set({ waiterCalls: [], activeWaiterAlert: null }),
  setSocket: (socket) => set({ socket }),
}));
