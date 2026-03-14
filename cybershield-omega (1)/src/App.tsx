import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Complaints from './components/Complaints';
import RiskHeatmap from './components/RiskHeatmap';
import ATMRiskScanner from './components/ATMRiskScanner';
import EvidenceLocker from './components/EvidenceLocker';
import AIAssistant from './components/AIAssistant';
import Header from './components/Header';
import Auth from './components/Auth';
import { cn } from '@/lib/utils';

import FraudAnalytics from './components/FraudAnalytics';
import CriminalDatabase from './components/CriminalDatabase';
import Settings from './components/Settings';
import Intelligence from './components/Intelligence';
import Translator from './components/Translator';
import GlobalCyberGlobe from './components/GlobalCyberGlobe';
import CrimePrediction from './components/CrimePrediction';
import NetworkGraph from './components/NetworkGraph';
import OfficerManagement from './components/OfficerManagement';

const App: React.FC = () => {
  const { user, token } = useAuthStore();
  const { theme, addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Fake Real-time Notifications Generator
  useEffect(() => {
    if (!token) return;

    const alertMessages = [
      { msg: "New phishing complaint detected in Chennai", type: "warning" },
      { msg: "ATM risk prediction triggered in Mumbai North", type: "error" },
      { msg: "Fraud network discovered in Delhi NCR", type: "info" },
      { msg: "Evidence integrity verified for Case #8821", type: "success" },
      { msg: "AI Fraud Insight: UPI scams trending in Chennai", type: "warning" },
      { msg: "New criminal profile added to database", type: "info" },
      { msg: "Suspicious login attempt blocked from unknown IP", type: "error" },
    ];

    const interval = setInterval(() => {
      const randomAlert = alertMessages[Math.floor(Math.random() * alertMessages.length)];
      addNotification(randomAlert.msg, randomAlert.type as any);
    }, 30000); // Every 30 seconds as requested

    return () => clearInterval(interval);
  }, [token, addNotification]);

  if (!token) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'complaints': return <Complaints />;
      case 'evidence': return <EvidenceLocker />;
      case 'atm_scanner': return <ATMRiskScanner />;
      case 'analytics': return <FraudAnalytics />;
      case 'heatmap': return <RiskHeatmap />;
      case 'intelligence': return <Intelligence />;
      case 'translator': return <Translator />;
      case 'criminals': return <CriminalDatabase />;
      case 'cyber_globe': return <GlobalCyberGlobe />;
      case 'prediction': return <CrimePrediction />;
      case 'network': return <NetworkGraph />;
      case 'officers': return <OfficerManagement />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={cn("flex min-h-screen transition-colors duration-300", theme === 'light' ? 'light' : '')}>
      <div className="futuristic-bg" />
      <div className="cyber-grid" />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <main className="flex-1 min-w-0 flex flex-col relative z-10">
        <Header />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

export default App;
