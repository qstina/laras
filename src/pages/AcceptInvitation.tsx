import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  School,
  Loader2,
  AlertCircle,
  User,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  Building,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InviteDetails {
  email: string;
  school_name: string;
  school_code?: string;
  role: string;
  expires_at?: string;
}

function getPasswordChecks(pw: string) {
  return {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasNumber: /\d/.test(pw),
    hasSymbol: /[^A-Za-z0-9\s]/.test(pw),
  };
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() || '';

  // Page States
  const [isLoading, setIsLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSymbol;

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      if (!token) {
        if (active) {
          setFatalError('Token jemputan tidak ditemui dalam URL.');
          setIsLoading(false);
        }
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_invitation_details', {
        p_token: token,
      });

      if (!active) return;

      if (rpcError) {
        setFatalError('Gagal menghubungi pelayan. Sila semak sambungan internet dan cuba lagi.');
      } else if (data && data.valid) {
        setInviteDetails({
          email: data.email,
          school_name: data.school_name,
          school_code: data.school_code,
          role: data.role,
          expires_at: data.expires_at,
        });
      } else {
        setFatalError(data?.error || 'Jemputan tidak sah atau telah luput.');
      }
      setIsLoading(false);
    }

    verifyToken();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inviteDetails) return;

    setFormError(null);

    if (!isLoginMode) {
      if (!fullName.trim()) {
        setFormError('Sila masukkan nama penuh rasmi anda.');
        return;
      }
      if (!isPasswordStrong) {
        setFormError(
          'Kata laluan mestilah sekurang-kurangnya 8 aksara serta mengandungi huruf besar, huruf kecil, nombor dan simbol.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Pengesahan kata laluan tidak sepadan.');
        return;
      }
    } else if (!password) {
      setFormError('Sila masukkan kata laluan akaun anda.');
      return;
    }

    setIsProcessing(true);

    try {
      // If another user session is currently open in this browser, sign out first
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();
      if (
        existingSession?.user?.email &&
        existingSession.user.email.toLowerCase() !== inviteDetails.email.toLowerCase()
      ) {
        await supabase.auth.signOut();
      }

      if (isLoginMode) {
        // Existing account flow: sign in and accept invitation via RPC
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inviteDetails.email,
          password,
        });
        if (signInError) throw signInError;

        const { error: acceptError } = await supabase.rpc('accept_invitation', {
          p_token: token,
          p_full_name: fullName.trim() || inviteDetails.email.split('@')[0],
        });
        if (acceptError) throw acceptError;
      } else {
        // New teacher registration flow: create confirmed user + bind school server-side
        const { data, error: fnError } = await supabase.functions.invoke(
          'accept-invitation-signup',
          {
            body: {
              token,
              fullName: fullName.trim(),
              password,
            },
          }
        );

        if (fnError) {
          let errMsg = fnError.message || 'Pendaftaran gagal.';
          let errCode = '';
          try {
            const ctxBody = await (fnError as any).context?.json?.();
            if (ctxBody?.error) errMsg = ctxBody.error;
            if (ctxBody?.code) errCode = ctxBody.code;
          } catch {
            // ignore
          }
          if (errCode === 'USER_EXISTS') {
            setIsLoginMode(true);
            setConfirmPassword('');
          }
          throw new Error(errMsg);
        }

        if (data?.error) {
          if (data.code === 'USER_EXISTS') {
            setIsLoginMode(true);
            setConfirmPassword('');
          }
          throw new Error(data.error);
        }

        // Sign the newly created & school-linked teacher straight into LARAS
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inviteDetails.email,
          password,
        });
        if (signInError) throw signInError;
      }

      try {
        localStorage.setItem('laras_remember_me', 'true');
        sessionStorage.setItem('laras_tab_session_alive', '1');
      } catch {
        // ignore
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.toLowerCase().includes('invalid login credentials')) {
        setFormError('Kata laluan tidak sah untuk e-mel ini.');
      } else {
        setFormError(
          rawMsg || 'Ralat berlaku semasa memproses jemputan. Sila hubungi pentadbir sekolah anda.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink font-sans">
        <Loader2 size={32} className="animate-spin text-ink" />
        <p className="text-xs font-medium text-slate-500">Mengesahkan pautan jemputan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center mb-4">
            <School size={22} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight mb-1.5">
            Jemputan Menyertai LARAS
          </h1>

          {inviteDetails && (
            <div className="mt-2 w-full p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-left flex items-start gap-2.5">
              <Building size={16} className="text-ink shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sekolah Dijemput
                </p>
                <p className="text-xs font-bold text-ink truncate">{inviteDetails.school_name}</p>
                {inviteDetails.school_code && (
                  <p className="text-[11px] text-slate-500">Kod: {inviteDetails.school_code}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {fatalError ? (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-rose/10 border border-rose/20 rounded-lg flex flex-col items-center gap-2 text-rose">
              <AlertCircle size={24} className="text-rose mb-1" />
              <p className="text-xs font-semibold leading-relaxed">{fatalError}</p>
            </div>
            <Link
              to="/login"
              className="inline-block text-xs font-semibold text-ink hover:underline hover:opacity-80"
            >
              Kembali ke Log Masuk Utama
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && (
              <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-start gap-2.5 text-rose text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                E-mel Dijemput (Dikunci)
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nama Penuh Rasmi
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Cikgu Nurul Aina binti Zulkifli"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isLoginMode ? 'Kata Laluan Akaun' : 'Cipta Kata Laluan'}
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isProcessing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isLoginMode ? 'Masukkan kata laluan sedia ada' : 'Min. 8 aksara kukuh'
                  }
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!isLoginMode && (
                <div className="pt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1 ${
                      passwordChecks.minLength ? 'text-forest font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordChecks.minLength ? <Check size={12} /> : <X size={12} />}
                    Min. 8 aksara
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      passwordChecks.hasUpper ? 'text-forest font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordChecks.hasUpper ? <Check size={12} /> : <X size={12} />}
                    Huruf besar
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      passwordChecks.hasLower ? 'text-forest font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordChecks.hasLower ? <Check size={12} /> : <X size={12} />}
                    Huruf kecil
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      passwordChecks.hasNumber ? 'text-forest font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordChecks.hasNumber ? <Check size={12} /> : <X size={12} />}
                    Nombor
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      passwordChecks.hasSymbol ? 'text-forest font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordChecks.hasSymbol ? <Check size={12} /> : <X size={12} />}
                    Simbol
                  </span>
                </div>
              )}
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sahkan Kata Laluan
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isProcessing}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Taip semula kata laluan"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 mt-2 h-10.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyertai Sekolah...</span>
                </>
              ) : (
                <>
                  <span>{isLoginMode ? 'Log Masuk & Sertai' : 'Daftar & Sertai Sekolah'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode((prev) => !prev);
                  setFormError(null);
                  setConfirmPassword('');
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-ink transition-colors"
              >
                {isLoginMode
                  ? 'Belum ada akaun? Daftar profil baru.'
                  : 'Sudah ada akaun dengan e-mel ini? Log masuk di sini.'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}