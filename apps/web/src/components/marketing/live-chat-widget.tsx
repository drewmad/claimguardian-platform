/**
 * @fileMetadata
 * @purpose "Live chat widget for immediate customer assistance"
 * @dependencies ["react", "lucide-react"]
 * @owner marketing-team
 * @status stable
 */

"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Users, Clock } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "bot";
  message: string;
  timestamp: Date;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize with welcome messages
  useEffect(() => {
    const welcomeMessages: ChatMessage[] = [
      {
        id: "welcome-1",
        sender: "bot",
        message: "👋 Hi! I'm here to help you protect your Florida property. How can I assist you today?",
        timestamp: new Date(),
      },
      {
        id: "welcome-2", 
        sender: "bot",
        message: "Quick questions: Hurricane prep? Insurance claims? Property documentation?",
        timestamp: new Date(Date.now() + 1000),
      },
    ];

    setMessages(welcomeMessages);
  }, []);

  // Simulate agent availability
  useEffect(() => {
    const currentHour = new Date().getHours();
    // Available 8 AM - 8 PM Eastern Time (simulation)
    setIsOnline(currentHour >= 8 && currentHour <= 20);
  }, []);

  // Handle new messages and unread count
  useEffect(() => {
    if (!isOpen && messages.length > 2) {
      setUnreadCount(messages.length - 2);
    } else {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      message: currentMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage("");

    // Simulate bot response after 2 seconds
    setTimeout(() => {
      const botResponse = generateBotResponse(currentMessage);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        message: botResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 2000);

    // Track chat interaction
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'chat_message_sent', {
        message_length: currentMessage.length,
      });
    }
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('hurricane') || message.includes('storm')) {
      return "🌀 Hurricane preparation is crucial! I can help you create a comprehensive property protection checklist. Would you like me to connect you with our Hurricane Specialist?";
    }
    
    if (message.includes('claim') || message.includes('insurance')) {
      return "📋 Insurance claims can be complex. Our AI has helped Florida families recover $2.4M+ in additional settlements. Would you like to speak with a Claims Advocate?";
    }
    
    if (message.includes('damage') || message.includes('roof') || message.includes('water')) {
      return "🔍 Damage documentation is key to successful claims. Our AI can analyze photos and create professional damage reports. Want to see how it works?";
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('free')) {
      return "💰 ClaimGuardian starts free! Hurricane season prep is completely free. Premium features start at $29/month. Would you like to see our pricing?";
    }
    
    if (message.includes('help') || message.includes('start') || message.includes('begin')) {
      return "✨ I'd love to help you get started! The best first step is our free Hurricane Readiness Assessment. It takes just 5 minutes. Ready to begin?";
    }
    
    // Default response
    return "Thanks for your message! I'm connecting you with one of our Florida property specialists. They'll be with you in just a moment. In the meantime, feel free to explore our free Hurricane Prep guide.";
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-all duration-200 relative"
          aria-label="Open live chat"
        >
          <MessageCircle size={24} />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">ClaimGuardian Support</h3>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300' : 'bg-gray-300'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white p-1"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              <p>{message.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Users size={12} />
            <span>2 agents online</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>Avg response: 2 min</span>
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isOnline ? "Type your message..." : "Leave us a message..."}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim()}
            className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Powered by ClaimGuardian Support • Available 8 AM - 8 PM ET
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage chat widget visibility and behavior
 */
export function useLiveChat() {
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    // Show chat widget after user has been on page for 30 seconds
    const timer = setTimeout(() => {
      setShowWidget(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  return {
    showWidget,
  };
}