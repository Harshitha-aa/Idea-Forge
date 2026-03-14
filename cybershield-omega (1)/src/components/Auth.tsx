import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'citizen' as 'citizen' | 'officer'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          setAuth(data.user, data.token);
        } else {
          setIsLogin(true);
          setError('Account created. Please login.');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-blue/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-pink/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/30 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
            <Shield className="w-8 h-8 text-cyber-blue" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Join the Force'}
        </h2>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {isLogin ? 'Access the CyberShield Omega intelligence network' : 'Register for the national cybercrime portal'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full cyber-input pl-11"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'citizen' })}
                  className={cn(
                    "py-2 rounded-lg border transition-all text-sm font-medium",
                    formData.role === 'citizen' ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue" : "border-white/10 text-slate-400"
                  )}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'officer' })}
                  className={cn(
                    "py-2 rounded-lg border transition-all text-sm font-medium",
                    formData.role === 'officer' ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue" : "border-white/10 text-slate-400"
                  )}
                >
                  Officer
                </button>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full cyber-input pl-11"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full cyber-input pl-11"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full cyber-button py-3 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Login to Network' : 'Create Account'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-cyber-blue text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
