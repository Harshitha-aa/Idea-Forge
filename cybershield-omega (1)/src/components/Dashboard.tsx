import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, 
  Clock, MapPin, Bell, Zap, Globe, Radar, List, MessageSquare, Radio,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { formatCurrency, cn } from '@/lib/utils';
import CyberGlobe from './CyberGlobe';

const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<'24h' | '7d'>('24h');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const trendData = useMemo(() => {
    if (trendRange === '24h') {
      return [
        { name: '00:00', value: 420 }, { name: '04:00', value: 310 },
        { name: '08:00', value: 650 }, { name: '12:00', value: 890 },
        { name: '16:00', value: 540 }, { name: '20:00', value: 980 },
        { name: '23:59', value: 720 },
      ];
    }
    return [
      { name: 'Mon', value: 2400 }, { name: 'Tue', value: 1398 },
      { name: 'Wed', value: 9800 }, { name: 'Thu', value: 3908 },
      { name: 'Fri', value: 4800 }, { name: 'Sat', value: 3800 },
      { name: 'Sun', value: 4300 },
    ];
  }, [trendRange]);

  const hotspots = [
    { city: 'Mumbai', count: 1240, risk: 'High' },
    { city: 'Delhi', count: 980, risk: 'High' },
    { city: 'Chennai', count: 750, risk: 'Medium' },
    { city: 'Bangalore', count: 620, risk: 'Medium' },
    { city: 'Hyderabad', count: 430, risk: 'Low' },
  ];

  const insights = [
    { text: "Fraud increased by 12% in last 24 hours", type: "warning" },
    { text: "UPI scams trending in Chennai area", type: "error" },
    { text: "ATM withdrawal risk detected in Delhi NCR", type: "warning" },
    { text: "New phishing vector targeting HDFC customers", type: "error" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-16 h-16 border-4 border-cyber-blue/20 border-t-cyber-blue rounded-full animate-spin" />
      <p className="text-cyber-blue font-mono animate-pulse uppercase tracking-[0.2em]">Initializing Intelligence Core...</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic">
            <span className="text-slate-500">Cyber</span>
            <span className="neon-text">Shield</span>
            <span className="text-slate-500">.</span>
            <span className="text-cyber-pink">Omega</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {t('dashboard')} — National Cyber Intelligence Command Center
          </p>
        </motion.div>

          <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('system_status')}</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('operational')}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 mx-2" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('threat_level')}</span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{t('elevated')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: t('total_complaints'), value: stats?.total_complaints || 0, icon: Activity, color: 'text-cyber-blue', suffix: '' },
          { label: t('fraud_detected'), value: stats?.total_amount || 0, icon: Shield, color: 'text-cyber-pink', prefix: '₹', suffix: '' },
          { label: t('high_risk_alerts'), value: 142, icon: AlertTriangle, color: 'text-yellow-500', suffix: '' },
          { label: t('active_investigations'), value: 84, icon: Clock, color: 'text-green-500', suffix: '' },
          { label: t('prevention_rate'), value: 94.2, icon: CheckCircle, color: 'text-cyan-400', suffix: '%' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group hover:border-cyber-blue/30 transition-all relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-end">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-[10px] text-green-500 font-bold">+12%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black tracking-tight">
              <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cyber Globe & Radar */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 h-[500px] relative overflow-hidden">
            <div className="absolute top-8 left-8 z-10">
              <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                <Globe className="w-6 h-6 text-cyber-blue" />
                {t('global_threat_matrix')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t('real_time_visualization')}</p>
            </div>
            <div className="absolute inset-0">
              <CyberGlobe />
            </div>
            
            {/* Radar Overlay */}
            <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full border border-cyber-blue/20 bg-cyber-blue/5 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Radar className="w-8 h-8 text-cyber-blue/40" />
              </div>
              <div className="absolute inset-0 border-2 border-cyber-blue/20 rounded-full animate-ping opacity-20" />
              <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-cyber-blue/40 origin-left animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" style={{ transform: 'translate(40px, -30px)' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" style={{ transform: 'translate(-20px, 40px)' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Fraud Insight Panel */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                  <MessageSquare className="w-4 h-4 text-cyber-pink" />
                  {t('ai_fraud_insights')}
                </h3>
                <span className="text-[10px] font-mono text-slate-500">{t('live_analysis')}</span>
              </div>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className={cn(
                      "w-1 h-full rounded-full shrink-0",
                      insight.type === 'error' ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Hotspot Ranking */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                  <List className="w-4 h-4 text-cyber-blue" />
                  {t('fraud_hotspot_ranking')}
                </h3>
              </div>
              <div className="space-y-4">
                {hotspots.map((hotspot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500 w-4">{i + 1}</span>
                      <span className="text-sm font-bold">{hotspot.city}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-cyber-blue">{hotspot.count}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        hotspot.risk === 'High' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {hotspot.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          {/* Live Cybercrime Feed */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                {t('live_cybercrime_feed')}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 space-y-4 animate-[scroll_20s_linear_infinite]">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-cyber-blue uppercase">Alert #{1000 + i}</span>
                      <span className="text-[9px] text-slate-500 font-mono">2m ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Suspicious UPI transaction of ₹45,000 flagged in Mumbai North.
                    </p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyber-dark to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Threat Radar Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <Radar className="w-4 h-4 text-cyber-blue" />
                {t('cyber_threat_radar')}
              </h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#00f2ff" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase">{t('peak_load')}</p>
                <p className="text-sm font-black text-white">942 req/s</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase">{t('latency')}</p>
                <p className="text-sm font-black text-emerald-400">12ms</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase">{t('uptime')}</p>
                <p className="text-sm font-black text-white">99.99%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
