'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  restaurantId: string;
  restaurantName: string;
  themeColor: string;
  onClose: () => void;
}

export function AIChatbot({ restaurantId, restaurantName, themeColor, onClose }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI assistant for ${restaurantName}. 🍽️ I can help you with menu questions, suggest dishes, or help you find something that fits your taste or budget. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const sessionId = useRef(
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        restaurantId,
        message: userMessage,
        sessionId: sessionId.current,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply as string }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What's your best seller?",
    "What's vegan here?",
    "Under ₹200?",
    "Spicy dishes?",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 z-40 flex flex-col"
      style={{ maxHeight: '70vh' }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border"
          style={{ background: `linear-gradient(135deg, ${themeColor}, #F48C06)` }}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">AI Assistant</p>
            <p className="text-white/70 text-xs">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ minHeight: '200px', maxHeight: '50vh' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {msg.role === 'assistant' ? (
                  <Bot className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-none'
                  : 'bg-muted text-foreground rounded-tl-none'
              }`}
              style={msg.role === 'user' ? { backgroundColor: themeColor } : {}}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-3.5 py-2.5">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t border-border">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Ask about the menu..."
            className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
