import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Bot, User, X, Minimize2, Maximize2, Loader2, Shield, Mic, MicOff, Volume2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const AIAssistant: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: t('ai_greeting') }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      const botResponse = data.message || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to intelligence core. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "glass-card flex flex-col shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden transition-all duration-300",
              isMinimized ? "h-16 w-64" : "h-[500px] w-[400px]"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-cyber-blue/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-blue/20 flex items-center justify-center border border-cyber-blue/30">
                  <Bot className="w-5 h-5 text-cyber-blue" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyber-blue tracking-tight">CyberShield AI</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t('neural_core_active')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === 'bot' ? "bg-cyber-blue/10 text-cyber-blue" : "bg-white/5 text-slate-400"
                      )}>
                        {msg.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'bot' ? "bg-white/5 border border-white/5 text-slate-200 rounded-tl-none" : "bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue rounded-tr-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyber-blue/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-cyber-blue animate-spin" />
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-cyber-blue/40 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-cyber-blue/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-cyber-blue/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={t('ask_ai_placeholder')}
                        className="w-full bg-cyber-dark border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-cyber-blue/50 transition-all"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                      />
                      <button 
                        onClick={handleSend}
                        className="absolute right-2 top-2 p-2 bg-cyber-blue text-cyber-dark rounded-lg hover:bg-cyber-blue/80 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={toggleListening}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        isListening 
                          ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-2xl bg-cyber-blue flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.4)] group relative"
        >
          <div className="absolute inset-0 rounded-2xl bg-cyber-blue animate-ping opacity-20" />
          <MessageSquare className="w-8 h-8 text-cyber-dark" />
        </motion.button>
      )}
    </div>
  );
};

export default AIAssistant;
