import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, AlertTriangle, MapPin, Filter, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RiskHeatmap: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [atms, setAtms] = useState<any[]>([]);
  const [crimes, setCrimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'all' | 'atms' | 'crimes'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [atmsRes, crimesRes] = await Promise.all([
        fetch('/api/atms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/crime-locations', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const [atmsData, crimesData] = await Promise.all([
        atmsRes.json(),
        crimesRes.json()
      ]);

      setAtms(Array.isArray(atmsData) ? atmsData : []);
      setCrimes(Array.isArray(crimesData) ? crimesData : []);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setAtms([]);
      setCrimes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getRiskColor = (risk: number) => {
    if (risk > 80) return '#ef4444'; // Red
    if (risk > 50) return '#f59e0b'; // Orange
    return '#10b981'; // Emerald
  };

  const filteredAtms = (Array.isArray(atms) ? atms : []).filter(atm => 
    (filter === 'all' || atm.alert_level?.toLowerCase() === filter.toLowerCase()) &&
    (view === 'all' || view === 'atms')
  );

  const filteredCrimes = (Array.isArray(crimes) ? crimes : []).filter(crime => 
    (filter === 'all' || crime.risk_level?.toLowerCase() === filter.toLowerCase()) &&
    (view === 'all' || view === 'crimes')
  );

  return (
    <div className="p-8 space-y-8 h-full flex flex-col min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic">{t('heatmap')}</h1>
          <p className="text-slate-400 mt-1">Geospatial intelligence of cybercrime clusters and high-risk ATM nodes</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low</span>
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5 text-cyber-blue", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-[600px] glass-card overflow-hidden relative border-cyber-blue/20">
        {loading ? (
          <div className="absolute inset-0 z-[2000] bg-cyber-dark/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-cyber-blue animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full min-h-[600px]">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={5} 
              style={{ height: '600px', width: '100%', background: '#0a0b1e' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filteredAtms.map((atm) => (
                <React.Fragment key={`atm-group-${atm.id}`}>
                  <Circle
                    center={[atm.latitude, atm.longitude]}
                    radius={atm.risk_score * 500}
                    pathOptions={{
                      fillColor: getRiskColor(atm.risk_score),
                      color: getRiskColor(atm.risk_score),
                      weight: 1,
                      fillOpacity: 0.3,
                      className: 'animate-pulse'
                    }}
                  >
                    <Popup className="cyber-popup">
                      <div className="p-3 bg-cyber-dark text-slate-200 rounded-lg border border-white/10 min-w-[200px]">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-cyber-blue">{atm.location}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            atm.risk_score > 80 ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          )}>
                            ATM NODE
                          </span>
                        </div>
                        <div className="space-y-1 text-[10px] mb-3">
                          <p className="text-slate-400">Risk Score: <span className="text-white font-bold">{atm.risk_score}%</span></p>
                          <p className="text-slate-400">Alert: <span className="text-white uppercase">{atm.alert_level}</span></p>
                          <p className="text-slate-400">Last Incident: <span className="text-white">{new Date(atm.last_incident).toLocaleDateString()}</span></p>
                        </div>
                        <button 
                          onClick={() => {
                            alert(`Countermeasures deployed to ${atm.location}. Local law enforcement notified.`);
                          }}
                          className="w-full py-2 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-[8px] font-black uppercase tracking-widest hover:bg-cyber-blue hover:text-black transition-all"
                        >
                          Deploy Countermeasures
                        </button>
                      </div>
                    </Popup>
                  </Circle>
                  {atm.risk_score > 85 && (
                    <Circle
                      center={[atm.latitude, atm.longitude]}
                      radius={atm.risk_score * 1200}
                      pathOptions={{
                        fillColor: '#ef4444',
                        color: '#ef4444',
                        weight: 1,
                        fillOpacity: 0.1,
                        dashArray: '5, 10',
                        className: 'animate-[spin_10s_linear_infinite]'
                      }}
                    />
                  )}
                </React.Fragment>
              ))}

              {filteredCrimes.map((crime) => (
                <Marker
                  key={`crime-${crime.id}`}
                  position={[crime.latitude, crime.longitude]}
                >
                  <Popup className="cyber-popup">
                    <div className="p-3 bg-cyber-dark text-slate-200 rounded-lg border border-white/10 min-w-[200px]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-red-400">{crime.crime_type}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                          crime.risk_score > 80 ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        )}>
                          CRIME CLUSTER
                        </span>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <p className="text-slate-400">Location: <span className="text-white">{crime.location_name}</span></p>
                        <p className="text-slate-400">Risk Level: <span className="text-white uppercase">{crime.risk_level}</span></p>
                        <p className="text-slate-400">Incidents: <span className="text-white">{crime.incident_count}</span></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute top-6 right-6 z-[1000] space-y-4">
          <div className="glass-card p-4 w-64 border-white/10 bg-cyber-dark/80 backdrop-blur-md">
            <h4 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-cyber-blue" />
              {t('intelligence_view')}
            </h4>
            <div className="flex gap-2 mb-4">
              {['All', 'ATMs', 'Crimes'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v.toLowerCase() as any)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border",
                    view === v.toLowerCase() ? "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue" : "bg-white/5 border-white/10 text-slate-400"
                  )}
                >
                  {t(v.toLowerCase())}
                </button>
              ))}
            </div>

            <h4 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Filter className="w-4 h-4 text-cyber-blue" />
              {t('risk_threshold')}
            </h4>
            <div className="space-y-2">
              {['All', 'High', 'Medium', 'Low'].map((t_key) => (
                <button
                  key={t_key}
                  onClick={() => setFilter(t_key.toLowerCase())}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    filter === t_key.toLowerCase() ? "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20" : "hover:bg-white/5 text-slate-400"
                  )}
                >
                  {t(t_key.toLowerCase())} Alerts
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 w-64 border-red-500/20 bg-red-500/5 backdrop-blur-md">
            <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-red-400 uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4" />
              Critical Hotspot
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Predictive AI indicates 88% probability of a coordinated SIM-swap attack in Mumbai South within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;
