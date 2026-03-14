import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon, Globe, Search, User } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, notifications, markAsRead } = useUIStore();
  const { user } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 glass-card border-none rounded-none border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('search')}
            className="cyber-input pl-10 w-64 h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* System Clock */}
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-sm font-mono neon-text">
            {time.toLocaleTimeString('en-GB', { hour12: false })} IST
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden lg:block" />

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-cyber-blue"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguages(!showLanguages)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-cyber-blue"
            >
              <Globe className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showLanguages && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 glass-card p-2 z-50"
                >
                  <div className="grid grid-cols-1 gap-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLanguages(false);
                        }}
                        className={cn(
                          "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          i18n.language === lang.code ? "bg-cyber-blue/20 text-cyber-blue" : "hover:bg-white/5 text-slate-300"
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-cyber-blue relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 glass-card p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">{t('notifications')}</h3>
                    <span className="text-[10px] bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-4">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer",
                            n.read ? "bg-white/5 border-transparent" : "bg-cyber-blue/5 border-cyber-blue/20 shadow-[0_0_10px_rgba(0,242,255,0.05)]"
                          )}
                        >
                          <p className="text-xs text-slate-200 mb-1">{n.message}</p>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
              <span className="text-[10px] text-cyber-blue uppercase tracking-widest font-bold">
                {user?.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyber-blue/20 border border-cyber-blue/50 flex items-center justify-center">
              <User className="w-6 h-6 text-cyber-blue" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
