import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Shield, AlertTriangle, User, ExternalLink, Activity, Database, X, Info, ShieldAlert, Locate } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Criminal {
  id: number;
  name: string;
  criminal_id: string;
  fraud_types: string;
  risk_score: number;
  history: string;
  associates: string;
  photo_url: string;
  warrant_status?: string;
  last_location?: { latitude: number, longitude: number };
}

const CriminalDatabase: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriminal, setSelectedCriminal] = useState<Criminal | null>(null);

  useEffect(() => {
    const fetchCriminals = async () => {
      try {
        const res = await fetch('/api/criminals', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCriminals(data);
      } catch (err) {
        console.error('Failed to fetch criminals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCriminals();
  }, [token]);

  const filteredCriminals = (Array.isArray(criminals) ? criminals : []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.criminal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fraud_types?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateWarrant = async (criminalId: string) => {
    try {
      const res = await fetch(`/api/criminals/${criminalId}/warrant`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCriminals(prev => prev.map(c => c.criminal_id === criminalId ? { ...c, warrant_status: 'ISSUED' } : c));
        if (selectedCriminal?.criminal_id === criminalId) {
          setSelectedCriminal(prev => prev ? { ...prev, warrant_status: 'ISSUED' } : null);
        }
        alert('Warrant issued successfully and logged in blockchain.');
      } else {
        alert('Failed to issue warrant: ' + data.error);
      }
    } catch (err) {
      console.error('Warrant error:', err);
    }
  };

  const handleTrackLocation = async (criminalId: string) => {
    try {
      const res = await fetch(`/api/criminals/${criminalId}/location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCriminals(prev => prev.map(c => c.criminal_id === criminalId ? { ...c, last_location: data } : c));
      if (selectedCriminal?.criminal_id === criminalId) {
        setSelectedCriminal(prev => prev ? { ...prev, last_location: data } : null);
      }
      alert(`Current Location: Lat ${data.latitude.toFixed(4)}, Lng ${data.longitude.toFixed(4)}\nStatus: Active Tracking...`);
    } catch (err) {
      console.error('Tracking error:', err);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text">{t('criminal_db')}</h1>
          <p className="text-slate-400 mt-1">Intelligence database of known cybercrime offenders and syndicates</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder={t('search_criminals')}
              className="cyber-input pl-11 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Filter className="w-5 h-5 text-cyber-blue" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCriminals.map((criminal, i) => (
            <motion.div
              key={criminal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCriminal(criminal)}
              className="glass-card overflow-hidden group cursor-pointer hover:border-cyber-blue/30 transition-all"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={criminal.photo_url} 
                  alt={criminal.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                    criminal.risk_score > 80 ? "bg-red-500/20 border-red-500/50 text-red-400" :
                    criminal.risk_score > 50 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                    "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  )}>
                    Risk: {criminal.risk_score}%
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyber-blue transition-colors">{criminal.name}</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{criminal.criminal_id}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {criminal.fraud_types.split(',').map((type, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-cyber-blue/10 text-cyber-blue text-[10px] font-bold uppercase">
                      {type.trim()}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {criminal.warrant_status === 'ISSUED' ? (
                        <span className="text-red-500 font-black">WARRANT ISSUED</span>
                      ) : (
                        t('active_investigation')
                      )}
                    </span>
                    {criminal.last_location && (
                      <span className="text-[8px] text-cyber-blue font-mono">
                        LOC: {criminal.last_location.latitude.toFixed(2)}, {criminal.last_location.longitude.toFixed(2)}
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyber-blue transition-colors" />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateWarrant(criminal.criminal_id);
                      }}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {t('warrant')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackLocation(criminal.criminal_id);
                      }}
                      className="flex-1 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue border border-cyber-blue/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Locate className="w-3 h-3" />
                      {t('track')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Criminal Detail Modal */}
      <AnimatePresence>
        {selectedCriminal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCriminal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-card overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedCriminal(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full md:w-1/3 aspect-square md:aspect-auto relative">
                <img 
                  src={selectedCriminal.photo_url} 
                  alt={selectedCriminal.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark md:bg-gradient-to-r md:from-transparent md:to-cyber-dark/50" />
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                <header>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black uppercase tracking-widest">
                      High Risk Profile
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">
                      {selectedCriminal.criminal_id}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-white">{selectedCriminal.name}</h2>
                  <p className="text-cyber-blue font-bold mt-1">{selectedCriminal.fraud_types}</p>
                </header>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyber-blue to-cyber-pink" 
                          style={{ width: `${selectedCriminal.risk_score}%` }}
                        />
                      </div>
                      <span className="text-xl font-black text-white">{selectedCriminal.risk_score}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Activity className="w-4 h-4" />
                      <span className="font-bold">
                        {selectedCriminal.warrant_status === 'ISSUED' ? 'WARRANT ISSUED' : 'Under Surveillance'}
                      </span>
                    </div>
                    {selectedCriminal.last_location && (
                      <p className="text-[10px] text-cyber-blue font-mono mt-1">
                        Last Known: {selectedCriminal.last_location.latitude.toFixed(4)}, {selectedCriminal.last_location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cyber-blue">
                    <Info className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">{t('crime_history')}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                    {selectedCriminal.history}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cyber-pink">
                    <User className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">{t('known_associates')}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                    {selectedCriminal.associates}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 flex gap-4">
                  <button 
                    onClick={() => handleGenerateWarrant(selectedCriminal.criminal_id)}
                    className="cyber-button flex-1"
                  >
                    {t('issue_warrant')}
                  </button>
                  <button 
                    onClick={() => handleTrackLocation(selectedCriminal.criminal_id)}
                    className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    {t('track_location')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CriminalDatabase;
