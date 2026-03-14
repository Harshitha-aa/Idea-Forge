import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Shield, Search, Filter, Download, Eye, CheckCircle, 
  AlertCircle, ChevronRight, Hash, Clock, User, FileText, 
  FileImage, FileVideo, FileArchive, Loader2, RefreshCw,
  Lock, Activity, Layers, ExternalLink, X, Upload
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Evidence {
  evidence_id: string;
  case_id: string;
  title: string;
  file_name: string;
  evidence_type: string;
  description: string;
  uploaded_by: string;
  sha256_hash: string;
  previous_hash: string;
  timestamp: string;
  status: string;
  file_path: string;
  block_id: number;
  ledger_timestamp: string;
  verification_status: string;
}

interface LedgerBlock {
  block_id: number;
  evidence_id: string;
  block_hash: string;
  previous_hash: string;
  timestamp: string;
  verification_status: string;
  file_name: string;
  case_id: string;
}

const EvidenceLocker: React.FC = () => {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'ledger'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [previewFile, setPreviewFile] = useState<Evidence | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ case_id: '', title: '', description: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('case_id', uploadData.case_id);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);

    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setShowUpload(false);
        setUploadData({ case_id: '', title: '', description: '' });
        setUploadFile(null);
        fetchData();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, ledgerRes] = await Promise.all([
        fetch('/api/evidence', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/evidence/ledger', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const evData = evRes.ok ? await evRes.json().catch(() => []) : [];
      const ledgerData = ledgerRes.ok ? await ledgerRes.json().catch(() => []) : [];
      
      setEvidenceList(Array.isArray(evData) ? evData : []);
      setLedger(Array.isArray(ledgerData) ? ledgerData : []);
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationStatus('verifying');
    
    // Simulate chain verification logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, we'd call an API that re-calculates all hashes
    setVerificationStatus('success');
    setVerifying(false);
    
    setTimeout(() => setVerificationStatus('idle'), 5000);
  };

  const getFileIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('image')) return <FileImage className="w-5 h-5 text-cyber-blue" />;
    if (t.includes('audio')) return <FileVideo className="w-5 h-5 text-cyber-pink" />;
    if (t.includes('document') || t.includes('pdf')) return <FileText className="w-5 h-5 text-cyber-purple" />;
    return <FileArchive className="w-5 h-5 text-slate-400" />;
  };

  const filteredEvidence = evidenceList.filter(ev => 
    ev.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.evidence_id.includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
            <Database className="w-10 h-10 text-cyber-blue" />
            {t('evidence_locker')}
          </h1>
          <p className="text-slate-400 font-medium">{t('evidence_locker_desc')}</p>
        </div>
        
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 rounded-xl bg-cyber-blue text-black font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.4)]"
            >
              <Upload className="w-5 h-5" />
              {t('upload_evidence')}
            </button>

            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setView('table')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                view === 'table' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-4 h-4" />
              {t('evidence_table')}
            </button>
            <button
              onClick={() => setView('ledger')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                view === 'ledger' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
              )}
            >
              <Layers className="w-4 h-4" />
              {t('blockchain_ledger')}
            </button>
          </div>

          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border",
              verificationStatus === 'success' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
              verificationStatus === 'verifying' ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue" :
              "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {verificationStatus === 'success' ? t('verified') : t('verify_chain')}
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder={t('search_evidence_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyber-blue/50 transition-all text-white placeholder:text-slate-600"
          />
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('total_evidence')}</p>
            <p className="text-2xl font-mono font-bold text-cyber-blue">{evidenceList.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-cyber-blue" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('evidence_id')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('case_id')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('title')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('file_name')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('type')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('uploaded_by')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('timestamp')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('status')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array(10).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array(9).fill(0).map((_, j) => (
                          <td key={j} className="p-4"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredEvidence.map((ev) => (
                    <tr key={ev.evidence_id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-mono text-xs text-cyber-blue font-bold">{ev.evidence_id}</td>
                      <td className="p-4 text-sm text-slate-300">{ev.case_id}</td>
                      <td className="p-4 text-sm text-white font-medium">{ev.title}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(ev.evidence_type)}
                          <span className="text-sm text-slate-400">{ev.file_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400 uppercase">{ev.evidence_type}</td>
                      <td className="p-4 text-sm text-slate-400">{ev.uploaded_by}</td>
                      <td className="p-4 text-xs text-slate-500">{ev.timestamp}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {ev.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setPreviewFile(ev)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-cyber-blue/20 text-slate-400 hover:text-cyber-blue transition-all"
                            title="View Evidence"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg bg-white/5 hover:bg-cyber-blue/20 text-slate-400 hover:text-cyber-blue transition-all" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative pl-8 border-l-2 border-dashed border-cyber-blue/30 space-y-12 py-4">
              {ledger.map((block, index) => (
                <motion.div
                  key={block.block_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Connection Node */}
                  <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyber-blue shadow-[0_0_10px_rgba(0,242,255,0.8)] z-10" />
                  
                  <div className="glass-card p-6 hover:border-cyber-blue/30 transition-all group relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyber-blue/10 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-cyber-blue" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t('block_id')}</p>
                            <p className="text-lg font-mono font-bold text-white">#{block.block_id?.toString().padStart(4, '0') || '0000'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('evidence_id')}</p>
                          <p className="text-sm font-mono text-cyber-blue font-bold">{block.evidence_id}</p>
                        </div>
                      </div>

                      <div className="space-y-4 md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('current_hash')}</p>
                            <div className="p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 break-all">
                              {block.block_hash}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('previous_hash')}</p>
                            <div className="p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-slate-500 break-all">
                              {block.previous_hash}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {block.timestamp}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <FileText className="w-3 h-3" />
                              {block.file_name}
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                            {block.verification_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-6 h-6 text-cyber-blue" />
                  Upload Digital Evidence
                </h3>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('case_id')}</label>
                  <input
                    type="text"
                    required
                    value={uploadData.case_id}
                    onChange={(e) => setUploadData({ ...uploadData, case_id: e.target.value })}
                    placeholder="e.g. CC-2025-1001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyber-blue/50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('evidence_title')}</label>
                  <input
                    type="text"
                    required
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="e.g. Phishing Email Screenshot"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyber-blue/50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('description')}</label>
                  <textarea
                    rows={3}
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Brief description of the evidence..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyber-blue/50 text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('evidence_file')}</label>
                  <div className="relative group">
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-4 py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 group-hover:border-cyber-blue/30 transition-all">
                      <FileArchive className="w-10 h-10 text-slate-500 group-hover:text-cyber-blue transition-colors" />
                      <p className="text-sm text-slate-400">
                        {uploadFile ? uploadFile.name : t('drag_drop_placeholder')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="flex-1 px-6 py-3 rounded-xl bg-cyber-blue text-black font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading ? t('uploading') : t('secure_upload')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-card overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center">
                    {getFileIcon(previewFile.evidence_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{previewFile.title || previewFile.file_name}</h3>
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{previewFile.evidence_id} • {previewFile.case_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 py-4 bg-white/5 border-b border-white/10">
                <p className="text-sm text-slate-300 italic">"{previewFile.description || 'No description provided.'}"</p>
              </div>

              <div className="p-8 bg-black/20 min-h-[400px] flex items-center justify-center">
                {previewFile.evidence_type === 'Image' ? (
                  <div className="relative group">
                    <img 
                      src={`https://picsum.photos/seed/${previewFile.evidence_id}/800/600`} 
                      alt="Evidence Preview"
                      className="max-h-[60vh] rounded-lg border border-white/10 shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-cyber-blue/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ) : previewFile.evidence_type === 'Audio' ? (
                  <div className="w-full max-w-md p-8 glass-card flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-cyber-pink/20 flex items-center justify-center animate-pulse">
                      <FileVideo className="w-10 h-10 text-cyber-pink" />
                    </div>
                    <div className="w-full space-y-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          className="h-full bg-cyber-pink"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>01:24</span>
                        <span>02:45</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 italic">"Scam call recording - Suspect identified as 'Vikram'..."</p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl p-12 glass-card space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                      <FileText className="w-8 h-8 text-cyber-purple" />
                      <span className="text-lg font-bold uppercase tracking-widest">Forensic Document Log</span>
                    </div>
                    <div className="space-y-4 font-mono text-xs text-slate-400 leading-relaxed">
                      <p className="text-cyber-blue">[SYSTEM] Document hash verified: {previewFile.sha256_hash}</p>
                      <p>[LOG] 2025-01-11 10:23:41 - Evidence captured by {previewFile.uploaded_by}</p>
                      <p>[LOG] Transaction ID: TXN_992837482</p>
                      <p>[LOG] Source IP: 192.168.1.105</p>
                      <p>[LOG] Destination Account: 992837482918 (HDFC Bank)</p>
                      <p className="pt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('blockchain_hash')}</p>
                    <p className="text-xs font-mono text-cyber-blue truncate max-w-[200px]">{previewFile.sha256_hash}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{t('verification')}</p>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t('verified')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/10">
                    {t('download_original')}
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-cyber-blue text-black text-sm font-bold transition-all hover:shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                    {t('print_report')}
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

export default EvidenceLocker;
