"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Zap,
  MapPin,
  ClipboardList,
  HelpCircle,
  ChevronDown,
  Bot,
  User,
  Loader2,
  Sparkles,
  Home,
  Search,
} from "lucide-react";
import { API_BASE } from "@/services/api";

const QUICK_ACTIONS = [
  { icon: MapPin, label: "File a complaint", action: "I want to file a civic complaint" },
  { icon: ClipboardList, label: "Check complaint status", action: "How do I check my complaint status?" },
  { icon: HelpCircle, label: "How does AI help?", action: "How does AI help with civic complaints?" },
  { icon: Sparkles, label: "Platform features", action: "What can Civic Connect do?" },
];

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm **CivicAI**, your smart city assistant. I can help you file complaints, check statuses, and navigate the platform. How can I help? 👋",
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const API_ENDPOINT = `${API_BASE}/ai/chat`;

export default function CivicAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowQuickActions(false);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role as string,
        content: m.content,
      }));

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      const reply: Message = {
        role: "assistant" as const,
        content: data.response || "I'm not sure about that. Could you rephrase?",
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.8, originX: 1, originY: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8, originX: 1, originY: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
              className="fixed bottom-20 right-4 z-[60] w-[90vw] max-w-[420px] h-[650px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bot className="w-5 h-5 text-white" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                  </div>
                  <span className="font-semibold text-white text-sm">CivicAI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMessages([WELCOME_MESSAGE]);
                      setShowQuickActions(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
                    title="New conversation"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                        }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {renderMarkdown(msg.content)}
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        <span className="text-xs text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />

                {showQuickActions && messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-2 mt-4"
                  >
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.action)}
                        className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        <action.icon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900"
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        animate={!isOpen ? { y: [0, -6, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-[60] p-4 rounded-full shadow-2xl transition-all ${isOpen
            ? "bg-gray-700 dark:bg-gray-600"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30"
          } text-white`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>
    </>
  );
}

function renderMarkdown(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  );
}
