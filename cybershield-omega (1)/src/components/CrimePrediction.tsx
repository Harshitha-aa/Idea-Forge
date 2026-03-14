import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Shield, AlertTriangle, Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CrimePrediction: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crime-predictions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPredictions(data);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [token]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic flex items-center gap-3">
            <Brain className="w-10 h-10 text-cyber-blue" />
            {t('ai_crime_prediction_engine')}
          </h1>
          <p className="text-slate-400 mt-1">{t('predictive_analytics_desc')}</p>
        </div>
        
        <button 
          onClick={fetchPredictions}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn("w-5 h-5 text-cyber-blue", loading && "animate-spin")} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Probability Chart */}
        <div className="lg:col-span-2 glass-card p-8 border-cyber-blue/20 min-h-[400px]">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest">
            <BarChart3 className="w-5 h-5 text-cyber-blue" />
            {t('attack_probability_by_type')}
          </h3>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="type" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 242, 255, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0a0b1e', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {predictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.probability > 0.8 ? '#ef4444' : '#00f2ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots */}
        <div className="glass-card p-8 border-cyber-pink/20">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp className="w-5 h-5 text-cyber-pink" />
            {t('predicted_hotspots')}
          </h3>
          
          <div className="space-y-6">
            {predictions.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{p.location}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{p.type}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                    p.probability > 0.8 ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue"
                  )}>
                    {(p.probability * 100).toFixed(0)}% PROB
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Timeframe: <span className="text-white font-bold">{p.timeframe}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Shield className="w-4 h-4" />
            {t('preventive_strategy')}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('preventive_strategy_desc')}
            <span className="text-emerald-400 font-bold block mt-2">{t('recommended_action_strategy')}</span>
          </p>
        </div>
        
        <div className="glass-card p-6 border-cyber-blue/20 bg-cyber-blue/5">
          <h3 className="font-bold text-cyber-blue mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Brain className="w-4 h-4" />
            {t('model_confidence')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">{t('training_accuracy')}</span>
              <span className="text-cyber-blue">94.2%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyber-blue w-[94.2%]" />
            </div>
            <p className="text-[10px] text-slate-500 italic">
              {t('model_update_info')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrimePrediction;
