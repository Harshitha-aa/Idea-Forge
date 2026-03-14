import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Shield, AlertTriangle, Activity, Search, FileText, Map as MapIcon, Users, Settings, LogOut, Bell, Menu, X, Zap, Database, Languages, Globe as GlobeIcon, Brain, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { id: 'dashboard', icon: Activity, label: t('dashboard'), roles: ['citizen', 'officer'] },
    { id: 'complaints', icon: FileText, label: t('complaints'), roles: ['citizen', 'officer'] },
    { id: 'evidence', icon: Database, label: t('evidence_locker'), roles: ['officer'] },
    { id: 'atm_scanner', icon: Zap, label: t('atm_scanner'), roles: ['officer'] },
    { id: 'analytics', icon: Shield, label: t('fraud_analytics'), roles: ['officer'] },
    { id: 'heatmap', icon: MapIcon, label: t('risk_heatmap'), roles: ['officer'] },
    { id: 'cyber_globe', icon: GlobeIcon, label: t('cyber_globe'), roles: ['officer'] },
    { id: 'prediction', icon: Brain, label: t('ai_prediction'), roles: ['officer'] },
    { id: 'network', icon: Share2, label: t('network_graph'), roles: ['officer'] },
    { id: 'intelligence', icon: Search, label: t('intelligence'), roles: ['officer'] },
    { id: 'criminals', icon: Users, label: t('criminal_db'), roles: ['officer'] },
    { id: 'officers', icon: Users, label: t('officer_management'), roles: ['officer'] },
    { id: 'translator', icon: Languages, label: t('translator'), roles: ['officer'] },
    { id: 'settings', icon: Settings, label: t('settings'), roles: ['citizen', 'officer'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'citizen'));

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen bg-cyber-dark/50 backdrop-blur-xl border-r border-white/10 flex flex-col sticky top-0 z-50"
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <Shield className="w-8 h-8 text-cyber-blue" />
            <span className="font-bold text-xl tracking-tighter neon-text">OMEGA</span>
          </motion.div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <item.icon className={cn("w-6 h-6", activeTab === item.id && "drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]")} />
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap">{item.label}</span>
            )}
            {activeTab === item.id && !isCollapsed && (
              <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-blue shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed && (
          <div className="mb-4 px-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">User Profile</p>
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-cyber-blue uppercase font-bold">{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-6 h-6" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
