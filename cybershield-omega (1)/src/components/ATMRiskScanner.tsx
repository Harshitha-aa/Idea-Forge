import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Shield, AlertTriangle, MapPin, Activity, Database, RefreshCw, Info, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ATM {
  id: number;
  location: string;
  risk_score: number;
  last_incident: string;
  alert_level: string;
  latitude: number;
  longitude: number;
}

const ATMRiskScanner: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [atms, setAtms] = useState<ATM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchATMs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/atms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAtms(data);
    } catch (err) {
      console.error('Failed to fetch ATMs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchATMs();
  }, [token]);

  const filteredATMs = atms.filter(atm => {
    const matchesSearch = atm.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || atm.alert_level === filter;
    return matchesSearch && matchesFilter;
  });

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'Medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
      case 'Low': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text">{t('atm_scanner')}</h1>
          <p className="text-slate-400 mt-1">Real-time risk assessment and predictive monitoring of ATM networks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ATM location..."
              className="cyber-input pl-11 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchATMs}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5 text-cyber-blue", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        {['All', 'High', 'Medium', 'Low'].map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              filter === l ? "bg-cyber-blue text-cyber-dark" : "text-slate-400 hover:bg-white/5"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredATMs.map((atm, i) => (
            <motion.div
              key={atm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-6 space-y-4 hover:border-cyber-blue/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyber-blue/30 transition-all">
                  <MapPin className="w-6 h-6 text-cyber-blue" />
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  getAlertColor(atm.alert_level)
                )}>
                  {atm.alert_level} Alert
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white truncate">{atm.location}</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  ID: ATM-{atm.id?.toString().padStart(5, '0') || '00000'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Risk Probability</span>
                  <span>{atm.risk_score}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      atm.risk_score > 70 ? "bg-red-500" : atm.risk_score > 40 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${atm.risk_score}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Incident</p>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(atm.last_incident).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Online
                  </p>
                </div>
              </div>

              <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-cyber-blue hover:text-cyber-dark hover:border-cyber-blue transition-all">
                View Risk Profile
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ATMRiskScanner;
