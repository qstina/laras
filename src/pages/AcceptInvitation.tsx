import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { School, Loader2, AlertCircle, User, Lock, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Page States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{ email: string, school_name: string, role: string } | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError('Token jemputan tidak ditemui dalam URL.');
        setIsLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_invitation_details', { p_token: token });

      if (rpcError) {
        setError('Gagal menghubungi pelayan. Sila cuba lagi.');
      } else if (data && data.valid) {
        setInviteDetails({
          email: data.email,
          school_name: data.school_name,
          role: data.role
        });
      } else {
        setError(data?.error || 'Jemputan tidak sah atau telah luput.');
      }
      setIsLoading(false);
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inviteDetails) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      if (isLoginMode) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inviteDetails.email,
          password
        });
        if (signInError) throw signInError;
      } else {
        if (!fullName) throw new Error('Sila masukkan nama penuh anda.');
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: inviteDetails.email,
          password
        });
        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Pendaftaran gagal.');
      }

      const { error: acceptError } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_full_name: fullName || 'Ahli Staf'
      });

      if (acceptError) throw new Error(acceptError.message || 'Gagal memproses jemputan.');

      navigate('/');
      
    } catch (err: any) {
      let msg = 'Ralat berlaku semasa memproses jemputan. Sila hubungi pentadbir sekolah anda.';
      if (err.message?.includes('Invalid login credentials')) {
        msg = 'Kata laluan tidak sah.';
      }
      setError(msg);
      if (err.message?.includes('Sila log masuk')) {
         await supabase.auth.signOut();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink font-sans">
        <Loader2 size={32} className="animate-spin text-ink" />
        <p className="text-xs font-medium text-slate-500">Mengesahkan jemputan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="w-12 h-12 bg-white border border-slate-200 text-ink rounded-lg flex items-center justify-center mb-4">
            <School size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight mb-1.5">Jemputan Menyertai LARAS</h1>
          
          {inviteDetails && (
            <p className="text-xs text-slate-500 font-medium">
              Anda telah dijemput untuk menyertai ruang kerja <span className="font-semibold text-ink">{inviteDetails.school_name}</span>.
            </p>
          )}
        </div>

        {error ? (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-rose/10 border border-rose/20 rounded-lg flex flex-col items-center gap-2 text-rose">
              <AlertCircle size={24} className="text-rose mb-1" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
            <Link to="/login" className="inline-block text-xs font-semibold text-ink hover:underline hover:opacity-80">
              Kembali ke Log Masuk Utama
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mel Anda (Dikunci)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  disabled 
                  value={inviteDetails?.email || ''} 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Penuh</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Nama rasmi anda"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Laluan</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={isLoginMode ? "Masukkan kata laluan sedia ada" : "Cipta kata laluan baru (Min 6)"}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing} 
              className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 mt-2 h-10.5"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : (isLoginMode ? 'Log Masuk & Sertai' : 'Daftar & Sertai Sekolah')}
              {!isProcessing && <ArrowRight size={16} />}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setIsLoginMode(!isLoginMode)} 
                className="text-[11px] font-semibold text-slate-500 hover:text-ink transition-colors"
              >
                {isLoginMode ? "Belum ada akaun? Daftar profil baru." : "Sudah ada akaun? Log masuk di sini."}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}