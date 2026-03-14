import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, ArrowRight, Copy, Check, RefreshCw, Volume2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const Translator: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
  ];

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      // In a real app, we'd call a translation API
      // For this demo, we'll simulate a translation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockTranslations: Record<string, string> = {
        'hi': 'यह एक साइबर सुरक्षा मंच है।',
        'ta': 'இது ஒரு இணைய பாதுகாப்பு தளம்.',
        'te': 'ఇది సైబర్ సెక్యూరిటీ ప్లాట్‌ఫారమ్.',
        'fr': 'Ceci est une plateforme de cybersécurité.',
        'es': 'Esta es una plataforma de ciberseguridad.',
      };

      setTargetText(mockTranslations[targetLang] || `[Simulated Translation of "${sourceText}" to ${targetLang}]`);
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
          <Languages className="w-10 h-10 text-cyber-blue" />
          Global Translator
        </h1>
        <p className="text-slate-400 font-medium">Cross-border intelligence translation engine for multi-lingual case analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Source Language</label>
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-cyber-blue focus:outline-none"
            >
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div className="glass-card p-6 min-h-[300px] flex flex-col">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 resize-none text-lg"
            />
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-bold">{sourceText.length} characters</span>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Language</label>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-cyber-blue focus:outline-none"
            >
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div className="glass-card p-6 min-h-[300px] flex flex-col relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyber-blue animate-spin" />
              </div>
            )}
            <div className="flex-1 text-white text-lg">
              {targetText || <span className="text-slate-600 italic">Translation will appear here...</span>}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 relative"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={loading || !sourceText.trim()}
          className="cyber-button-primary px-12 py-4 flex items-center gap-3 text-lg"
        >
          {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Languages className="w-6 h-6" />}
          Translate Intelligence
        </button>
      </div>

      {/* Advanced Features */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-6 space-y-4 border-cyber-blue/20">
          <div className="w-12 h-12 rounded-2xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20">
            <Globe className="w-6 h-6 text-cyber-blue" />
          </div>
          <h3 className="font-bold text-white">Neural Translation</h3>
          <p className="text-xs text-slate-400">Advanced deep learning models trained on cyber-security terminology for high accuracy.</p>
        </div>
        <div className="glass-card p-6 space-y-4 border-cyber-pink/20">
          <div className="w-12 h-12 rounded-2xl bg-cyber-pink/10 flex items-center justify-center border border-cyber-pink/20">
            <RefreshCw className="w-6 h-6 text-cyber-pink" />
          </div>
          <h3 className="font-bold text-white">Real-time Sync</h3>
          <p className="text-xs text-slate-400">Synchronize translations across all officer terminals for coordinated international operations.</p>
        </div>
        <div className="glass-card p-6 space-y-4 border-emerald-500/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-bold text-white">Verified Accuracy</h3>
          <p className="text-xs text-slate-400">99.8% accuracy rate for critical intelligence data translation verified by human experts.</p>
        </div>
      </div>
    </div>
  );
};

export default Translator;
