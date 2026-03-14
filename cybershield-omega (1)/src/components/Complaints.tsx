import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Search, Filter, Download, Trash2, ExternalLink, AlertTriangle, CheckCircle, Clock, Database, Upload, Loader2, Shield, X, Activity, Lock, Eye, Edit2, Info, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Complaints: React.FC = () => {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<any | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<any | null>(null);
  const [deletingComplaintId, setDeletingComplaintId] = useState<number | null>(null);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceMetadata, setEvidenceMetadata] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    location: 'All'
  });

  const [formData, setFormData] = useState({
    victim_name: '',
    phone: '',
    email: '',
    fraud_type: 'Phishing',
    amount: '',
    location: '',
    bank_name: '',
    transaction_id: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    evidence_url: ''
  });

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/evidence', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLedgerData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const verifyEvidence = async (evidenceId: string) => {
    setVerifyingId(evidenceId);
    try {
      const res = await fetch('/api/evidence/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ id: evidenceId })
      });
      const data = await res.json();
      setVerificationResult({ id: evidenceId, ...data });
      if (data.isValid) {
        addNotification('Evidence integrity verified successfully', 'success');
      } else {
        addNotification('Evidence integrity check FAILED!', 'error');
      }
    } catch (err) {
      console.error(err);
      addNotification('Verification service unavailable', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    fetchComplaints();
    if (user?.role === 'officer') fetchLedger();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchComplaints();
        addNotification('Intelligence report submitted successfully', 'success');
        setFormData({
          victim_name: '',
          phone: '',
          email: '',
          fraud_type: 'Phishing',
          amount: '',
          location: '',
          bank_name: '',
          transaction_id: '',
          description: '',
          incident_date: new Date().toISOString().split('T')[0],
          evidence_url: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvidenceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !evidenceFile) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', evidenceFile);
    data.append('complaint_id', selectedComplaintId?.toString() || '');
    data.append('metadata', evidenceMetadata);

    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      if (res.ok) {
        setShowEvidenceModal(false);
        setEvidenceFile(null);
        setEvidenceMetadata('');
        addNotification('Evidence sealed in blockchain locker', 'success');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      addNotification('Failed to upload evidence', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchComplaints();
        setDeletingComplaintId(null);
        addNotification('Complaint record deleted', 'info');
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to delete complaint', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    try {
      const res = await fetch(`/api/complaints/${editingComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editingComplaint.status,
          risk_score: editingComplaint.risk_score,
          description: editingComplaint.description
        })
      });
      if (res.ok) {
        setEditingComplaint(null);
        fetchComplaints();
        addNotification('Complaint updated successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to update complaint', 'error');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredComplaints);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    XLSX.writeFile(wb, "CyberShield_Complaints.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("CyberShield Omega - Complaint Report", 14, 15);
    const tableColumn = ["ID", "Victim", "Type", "Amount", "Location", "Status", "Date"];
    const tableRows = filteredComplaints.map(c => [
      c.id,
      c.victim_name,
      c.fraud_type,
      c.amount,
      c.location,
      c.status,
      new Date(c.created_at).toLocaleDateString()
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("CyberShield_Complaints.pdf");
  };

  const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(c => {
    const matchesSearch = 
      (c.victim_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.fraud_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = filters.type === 'All' || c.fraud_type === filters.type;
    const matchesStatus = filters.status === 'All' || c.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'investigating': return <Activity className="w-4 h-4 text-cyber-blue" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  const fraudTypes = ['All', 'Phishing', 'ATM Fraud', 'Identity Theft', 'Vishing', 'Lottery Scam', 'Job Fraud'];
  const statuses = ['All', 'pending', 'investigating', 'resolved'];

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter neon-text uppercase italic">{t('complaints')}</h1>
          <p className="text-slate-400 mt-1 font-medium">{t('manage_complaints')}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={exportToExcel} className="cyber-button flex items-center gap-2 bg-white/5 border-white/10 text-slate-200">
            <Download className="w-4 h-4" /> {t('export_excel')}
          </button>
          <button onClick={exportToPDF} className="cyber-button flex items-center gap-2 bg-white/5 border-white/10 text-slate-200">
            <FileText className="w-4 h-4" /> {t('download_pdf')}
          </button>
          {user?.role === 'officer' && (
            <button onClick={() => setShowLedger(true)} className="cyber-button flex items-center gap-2 bg-cyber-blue/10 border-cyber-blue/20 text-cyber-blue">
              <Database className="w-4 h-4" /> {t('view_ledger')}
            </button>
          )}
          {user?.role === 'citizen' && (
            <button onClick={() => setShowForm(true)} className="cyber-button flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('add_complaint')}
            </button>
          )}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            className="w-full cyber-input pl-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="cyber-input"
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          {fraudTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          className="cyber-input"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Complaints Table */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Complaint ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('victim')} / {t('type')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('amount')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('location')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('status')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('risk_score')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-4 font-mono text-[10px] text-cyber-blue font-bold">{c.complaint_id || `#C-${c.id?.toString().padStart(5, '0') || '00000'}`}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">{c.victim_name}</div>
                    <div className="text-[10px] font-bold text-cyber-blue uppercase tracking-tighter">{c.fraud_type}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-cyber-pink">{formatCurrency(c.amount)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">{c.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(c.status)}
                      <span className="text-[10px] font-black uppercase tracking-widest">{c.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${c.risk_score}%` }}
                          className={cn(
                            "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                            c.risk_score > 70 ? "bg-red-500" : c.risk_score > 40 ? "bg-yellow-500" : "bg-green-500"
                          )}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{c.risk_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {user?.role === 'officer' && (
                        <button 
                          onClick={() => {
                            setSelectedComplaintId(c.id);
                            setShowEvidenceModal(true);
                          }}
                          className="p-2 hover:bg-cyber-blue/20 rounded-lg text-cyber-blue transition-colors"
                          title="Upload Blockchain Evidence"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setViewingComplaint(c)}
                        className="p-2 hover:bg-cyber-blue/20 rounded-lg text-cyber-blue transition-colors"
                        title="View Intelligence Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user?.role === 'officer' && (
                        <button 
                          onClick={() => setEditingComplaint(c)}
                          className="p-2 hover:bg-cyber-blue/20 rounded-lg text-cyber-blue transition-colors"
                          title="Edit Intelligence Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setDeletingComplaintId(c.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                        title="Delete Intelligence Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="font-medium">No intelligence records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals remain same but with better styling */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card p-10 max-h-[90vh] overflow-y-auto border-cyber-blue/20"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter neon-text">File New Intelligence Report</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Victim Information Section */}
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyber-blue mb-4 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Victim Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                          <input
                            type="text"
                            required
                            placeholder="Enter victim's name"
                            className="w-full cyber-input pl-10"
                            value={formData.victim_name}
                            onChange={e => setFormData({ ...formData, victim_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                          <input
                            type="email"
                            required
                            placeholder="victim@example.com"
                            className="w-full cyber-input pl-10"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                          <input
                            type="tel"
                            required
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full cyber-input pl-10"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident Location</label>
                        <div className="relative">
                          <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                          <input
                            type="text"
                            required
                            placeholder="City, State"
                            className="w-full cyber-input pl-10"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Details Section */}
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyber-pink mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Incident Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fraud Category</label>
                        <select
                          className="w-full cyber-input"
                          value={formData.fraud_type}
                          onChange={e => setFormData({ ...formData, fraud_type: e.target.value })}
                        >
                          {fraudTypes.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident Date</label>
                        <input
                          type="date"
                          required
                          className="w-full cyber-input"
                          value={formData.incident_date}
                          onChange={e => setFormData({ ...formData, incident_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount Lost (INR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-cyber-pink font-bold">₹</span>
                          <input
                            type="number"
                            required
                            placeholder="0.00"
                            className="w-full cyber-input pl-8"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          className="w-full cyber-input"
                          value={formData.bank_name}
                          onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction ID / Reference Number</label>
                    <input
                      type="text"
                      placeholder="TXN123456789"
                      className="w-full cyber-input"
                      value={formData.transaction_id}
                      onChange={e => setFormData({ ...formData, transaction_id: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evidence URL (Optional)</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        className="w-full cyber-input pl-10"
                        value={formData.evidence_url}
                        onChange={e => setFormData({ ...formData, evidence_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detailed Description / Modus Operandi</label>
                    <textarea
                      rows={4}
                      placeholder="Describe how the fraud occurred..."
                      className="w-full cyber-input resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full cyber-button py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    <Shield className="w-5 h-5" />
                    Submit Official Intelligence Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl glass-card p-10 border-cyber-blue/20 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyber-blue/10 rounded-xl">
                    <FileText className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter neon-text">Intelligence Dossier</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Record ID: {viewingComplaint.complaint_id || `#C-${viewingComplaint.id?.toString().padStart(5, '0') || '00000'}`}</p>
                  </div>
                </div>
                <button onClick={() => setViewingComplaint(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Victim Identity</label>
                  <p className="text-lg font-bold text-slate-200">{viewingComplaint.victim_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <p className="text-lg font-bold text-slate-200">{viewingComplaint.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact</label>
                  <p className="text-lg font-bold text-slate-200">{viewingComplaint.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident Date</label>
                  <p className="text-lg font-bold text-slate-200">{viewingComplaint.incident_date ? formatDate(viewingComplaint.incident_date) : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fraud Vector</label>
                  <p className="text-lg font-bold text-cyber-blue">{viewingComplaint.fraud_type}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Financial Impact</label>
                  <p className="text-lg font-black text-cyber-pink">{formatCurrency(viewingComplaint.amount)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</label>
                  <p className="text-lg font-bold text-slate-200">{viewingComplaint.location}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(viewingComplaint.status)}
                    <span className="text-sm font-black uppercase tracking-widest">{viewingComplaint.status}</span>
                  </div>
                </div>
              </div>

              {viewingComplaint.evidence_url && (
                <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Attached Evidence Link</label>
                  <a href={viewingComplaint.evidence_url} target="_blank" rel="noopener noreferrer" className="text-cyber-blue hover:underline flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    {viewingComplaint.evidence_url}
                  </a>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Case Narrative</label>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{viewingComplaint.description}"</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 rounded-2xl bg-cyber-blue/5 border border-cyber-blue/20">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-cyber-blue" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyber-blue/60">Risk Assessment</p>
                    <p className="text-xl font-black text-cyber-blue">{viewingComplaint.risk_score}% Threat Level</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logged On</p>
                  <p className="text-sm font-bold text-slate-400">{formatDate(viewingComplaint.created_at)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {editingComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg glass-card p-10 border-cyber-blue/30"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Edit2 className="w-8 h-8 text-cyber-blue" />
                  Update Intelligence
                </h2>
                <button onClick={() => setEditingComplaint(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Complaint ID</p>
                  <p className="text-sm font-mono font-bold text-cyber-blue">{editingComplaint.complaint_id || `#C-${editingComplaint.id}`}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Investigation Status</label>
                  <select
                    className="w-full cyber-input"
                    value={editingComplaint.status}
                    onChange={e => setEditingComplaint({ ...editingComplaint, status: e.target.value })}
                  >
                    {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Score ({editingComplaint.risk_score}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                    value={editingComplaint.risk_score}
                    onChange={e => setEditingComplaint({ ...editingComplaint, risk_score: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Internal Case Notes</label>
                  <textarea
                    className="w-full cyber-input resize-none"
                    rows={4}
                    value={editingComplaint.description}
                    onChange={e => setEditingComplaint({ ...editingComplaint, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="w-full cyber-button py-4 text-sm font-black uppercase tracking-widest">
                  Commit Intelligence Update
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingComplaintId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm glass-card p-10 border-red-500/20 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Purge Intelligence?</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">This action will permanently remove this record from the central intelligence repository. This cannot be undone.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingComplaintId(null)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deletingComplaintId)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Purge Record
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEvidenceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-card p-10 border-cyber-blue/30"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Database className="w-8 h-8 text-cyber-blue" />
                  Evidence Locker
                </h2>
                <button onClick={() => setShowEvidenceModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEvidenceUpload} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evidence File</label>
                  <div className="relative">
                    <input
                      type="file"
                      required
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="evidence-upload"
                    />
                    <label 
                      htmlFor="evidence-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl hover:border-cyber-blue/50 hover:bg-cyber-blue/5 transition-all cursor-pointer group"
                    >
                      {evidenceFile ? (
                        <div className="flex flex-col items-center gap-2 text-cyber-blue">
                          <FileText className="w-10 h-10" />
                          <span className="text-xs font-bold">{evidenceFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-500 group-hover:text-cyber-blue transition-colors mb-3" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Evidence File</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Metadata / Notes</label>
                  <textarea
                    className="w-full cyber-input resize-none"
                    rows={3}
                    placeholder="Enter evidence details..."
                    value={evidenceMetadata}
                    onChange={(e) => setEvidenceMetadata(e.target.value)}
                  />
                </div>

                <div className="p-5 rounded-2xl bg-cyber-blue/5 border border-cyber-blue/20 text-[10px] text-cyber-blue/80 font-medium leading-relaxed">
                  <div className="font-black mb-2 flex items-center gap-2 uppercase tracking-widest">
                    <Shield className="w-4 h-4" />
                    BLOCKCHAIN PROTOCOL ACTIVE
                  </div>
                  This file will be hashed using SHA-256 and linked to the previous block in the immutable evidence ledger.
                </div>

                <button 
                  type="submit" 
                  disabled={uploading || !evidenceFile}
                  className="w-full cyber-button py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Lock className="w-5 h-5" />
                      Seal in Blockchain Locker
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Blockchain Ledger Modal */}
        {showLedger && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-5xl glass-card p-10 border-cyber-blue/20 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyber-blue/10 rounded-xl">
                    <Database className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter neon-text">Immutable Evidence Ledger</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cryptographic Chain of Custody Protocol v4.2</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={fetchLedger} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {ledgerData.map((block, index) => (
                  <div key={block.id} className="relative pl-8 border-l border-cyber-blue/20 pb-4 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-cyber-blue rounded-full shadow-[0_0_10px_rgba(0,186,255,0.5)]" />
                    
                    <div className="glass-card p-6 border-white/5 hover:border-cyber-blue/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded uppercase tracking-widest">Block #{block.id}</span>
                            <span className="text-xs font-bold text-slate-200">{block.file_name}</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500">Linked to Complaint: #C-{block.complaint_id?.toString().padStart(5, '0') || '00000'} ({block.victim_name})</p>
                        </div>
                        <button 
                          onClick={() => verifyEvidence(block.evidence_id)}
                          disabled={verifyingId === block.evidence_id}
                          className={cn(
                            "cyber-button py-2 px-4 text-[10px] flex items-center gap-2",
                            verificationResult?.id === block.evidence_id && verificationResult.isValid ? "bg-green-500/20 border-green-500/50 text-green-400" : ""
                          )}
                        >
                          {verifyingId === block.evidence_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                          {verificationResult?.id === block.evidence_id ? (verificationResult.isValid ? 'VERIFIED' : 'FAILED') : 'VERIFY INTEGRITY'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Current Block Hash</label>
                          <p className="text-[9px] font-mono text-cyber-blue break-all bg-black/40 p-2 rounded border border-white/5">{block.block_hash}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Previous Block Hash</label>
                          <p className="text-[9px] font-mono text-slate-500 break-all bg-black/20 p-2 rounded border border-white/5">{block.previous_hash}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3 h-3" />
                          Sealed by: {block.officer_name}
                        </div>
                        <div>
                          Timestamp: {formatDate(block.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ledgerData.length === 0 && (
                  <div className="text-center py-20 text-slate-500">
                    <Database className="w-12 h-12 mx-auto opacity-10 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No evidence blocks recorded in ledger</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Complaints;
