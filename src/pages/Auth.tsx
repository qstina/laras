import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, Loader2, AlertCircle, CheckCircle2, 
  EyeOff, Eye, Globe, User, MapPin, Building, Mail, ArrowLeft, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  message?: string | null;
  session?: any;
}

type AuthMode = 'login' | 'register' | 'reset' | 'onboarding';
type OnboardingType = 'join' | 'create';

function mapAuthErrorMessage(err: any, mode: AuthMode, onboardingType?: OnboardingType): string {
  const code = err?.code || '';
  const msg = (err?.message || '').toLowerCase();

  // 1. Preserve existing invalid-school-code validation message
  if (code === 'P0002' || msg.includes('invalid_school_code') || msg.includes('tidak dijumpai')) {
    return 'Kod sekolah tidak sah atau tidak berdaftar. Sila semak semula dengan pentadbir sekolah anda.';
  }

  // 2. Session / Google OAuth expiration
  if (code === '28000' || msg.includes('jwt') || msg.includes('session') || msg.includes('sesi')) {
    return 'Sesi pengesahan Google anda telah tamat. Sila log masuk semula dengan Google untuk meneruskan pendaftaran.';
  }

  // 3. Standard Auth errors
  if (msg.includes('invalid login credentials')) {
    return 'E-mel atau kata laluan tidak sah.';
  }
  if (msg.includes('email not confirmed') || msg.includes('sahkan e-mel')) {
    return 'Sila sahkan e-mel anda terlebih dahulu. Semak peti masuk atau folder spam anda.';
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'E-mel ini telah didaftarkan. Sila log masuk.';
  }
  if (msg.includes('password should be at least')) {
    return 'Kata laluan mestilah mengandungi sekurang-kurangnya 6 aksara.';
  }

  // 4. Input validation errors
  if (code === '22023' || msg.includes('validation_error') || msg.includes('wajib diisi')) {
    return 'Sila pastikan semua maklumat wajib diisi dengan format yang sah.';
  }

  // 5. Duplicate constraints
  if (code === '23505' || msg.includes('duplicate_school_code') || msg.includes('duplicate key')) {
    if (onboardingType === 'create' && (msg.includes('school') || msg.includes('code') || msg.includes('kod sekolah'))) {
      return 'Kod sekolah ini telah didaftarkan dalam sistem. Pilih "Sertai Sekolah Sedia Ada" untuk menyertai sekolah tersebut.';
    }
    return 'Akaun atau rekod keahlian ini telah wujud dalam sistem. Sila log masuk semula.';
  }

  // 6. RLS / Permission / PostgREST single-row errors
  if (code === '42501' || code === 'PGRST116' || msg.includes('row-level security') || msg.includes('permission denied')) {
    return 'Akses pangkalan data ditolak oleh polisi keselamatan (RLS). Sila hubungi pentadbir sistem.';
  }

  // 7. Role enum / check constraint / database integrity errors
  if (code === '22P02' || code === '23514' || code.startsWith('23') || code.startsWith('P0') || msg.includes('violates')) {
    return `Ralat integriti pangkalan data (${code || 'DB'}) semasa memautkan akaun sekolah. Tiada rekod separa disimpan—sila hubungi pentadbir atau cuba semula.`;
  }

  // 8. Missing RPC function
  if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
    return 'Fungsi pendaftaran pelayan tidak ditemui. Sila pastikan migrasi pangkalan data terkini telah dijalankan.';
  }

  // 9. Genuine network failure only
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'Sambungan rangkaian terganggu semasa menghubungi pelayan. Sila semak internet anda dan cuba lagi.';
  }

  if (mode === 'onboarding') {
    return `Pendaftaran sekolah gagal diselesaikan${code ? ` (Kod: ${code})` : ''}. Tiada akaun separa disimpan—sila cuba lagi.`;
  }

  return 'Berlaku ralat semasa proses. Sila semak semula butiran anda.';
}

export default function Auth({ message, session }: AuthProps) {
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [onboardingType, setOnboardingType] = useState<OnboardingType>('join');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [error, setError] = useState<string | null>(message || null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration & Onboarding States
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolState, setSchoolState] = useState('Sarawak');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkRegistrationStatus() {
      if (session?.user && !isProcessing) {
        setIsCheckingProfile(true);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('school_id, role, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileError) {
          console.error('[LARAS Auth] Profile check failed:', {
            code: profileError.code,
            message: profileError.message,
            hint: profileError.hint,
          });
          setError(mapAuthErrorMessage(profileError, 'onboarding'));
          setAuthMode('onboarding');
          setIsCheckingProfile(false);
          return;
        }

        if (profile?.school_id && profile?.role) {
          navigate('/', { replace: true });
        } else {
          const googleName =
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            '';
          if (googleName) {
            setFullName((prev) => prev || googleName);
          }

          setAuthMode('onboarding');
          setIsCheckingProfile(false);
        }
      }
    }

    checkRegistrationStatus();

    return () => { mounted = false; };
  }, [session, isProcessing, navigate]);

  const validateOnboardingForm = (type: OnboardingType): string | null => {
    if (!fullName.trim()) return 'Sila masukkan nama penuh anda.';
    if (!schoolCode.trim()) {
      return 'Kod sekolah tidak sah atau tidak berdaftar. Sila semak semula dengan pentadbir sekolah anda.';
    }
    if (!/^[A-Za-z0-9]{4,12}$/.test(schoolCode.trim())) {
      return 'Kod sekolah tidak sah atau tidak berdaftar. Sila semak semula dengan pentadbir sekolah anda.';
    }
    if (type === 'create') {
      if (!schoolName.trim()) return 'Sila masukkan nama sekolah.';
      if (!schoolState.trim()) return 'Sila pilih negeri sekolah.';
      if (!district.trim()) return 'Sila masukkan daerah (PPD) sekolah.';
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (authMode === 'login') {
      if (!email.trim() || !password) {
        setError('Sila masukkan e-mel rasmi dan kata laluan anda.');
        return;
      }
    } else if (authMode === 'register') {
      const validationErr = validateOnboardingForm('create');
      if (validationErr) {
        setError(validationErr);
        return;
      }
      if (!email.trim()) {
        setError('Sila masukkan e-mel rasmi sekolah.');
        return;
      }
      if (password.length < 6) {
        setError('Kata laluan mestilah mengandungi sekurang-kurangnya 6 aksara.');
        return;
      }
    } else if (authMode === 'onboarding') {
      const validationErr = validateOnboardingForm(onboardingType);
      if (validationErr) {
        setError(validationErr);
        return;
      }
    } else if (authMode === 'reset') {
      if (!email.trim()) {
        setError('Sila masukkan e-mel rasmi anda.');
        return;
      }
    }

    setIsProcessing(true);
    let completedOnboarding = false;

    try {
      if (authMode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        if (data.user && !data.session) {
          throw new Error('Sila sahkan e-mel anda sebelum log masuk.');
        }

      } else if (authMode === 'register') {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              is_admin_registration: true,
              full_name: fullName.trim(),
              school_name: schoolName.trim(),
              school_code: schoolCode.trim().toUpperCase(),
              state: schoolState.trim(),
              district: district.trim()
            }
          }
        });
        
        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Pendaftaran gagal. Sila cuba lagi.');
        
        setSuccess('Pendaftaran berjaya! Sila semak peti masuk e-mel anda untuk pautan pengesahan.');
        setAuthMode('login');
        setPassword('');

      } else if (authMode === 'onboarding') {
        // 1. Verify active Google session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw { code: '28000', message: userError?.message || 'Sesi telah tamat.' };
        }

        // 2. Execute atomic RPC for joining existing school OR creating new school
        if (onboardingType === 'join') {
          const { error: joinError } = await supabase.rpc('join_existing_school', {
            p_school_code: schoolCode.trim().toUpperCase(),
            p_full_name: fullName.trim(),
          });
          if (joinError) throw joinError;
        } else {
          const { error: createError } = await supabase.rpc('complete_google_onboarding', {
            p_school_name: schoolName.trim(),
            p_school_code: schoolCode.trim().toUpperCase(),
            p_state: schoolState.trim(),
            p_district: district.trim(),
            p_full_name: fullName.trim(),
          });
          if (createError) throw createError;
        }

        // 3. Verify finalized LARAS profile (school_id + role) before allowing dashboard access
        const { data: verifiedProfile, error: verifyError } = await supabase
          .from('profiles')
          .select('school_id, role')
          .eq('id', user.id)
          .single();

        if (verifyError || !verifiedProfile?.school_id || !verifiedProfile?.role) {
          throw verifyError || { code: '42501', message: 'Profil sekolah gagal disahkan selepas pendaftaran.' };
        }

        completedOnboarding = true;
        setSuccess('Pendaftaran selesai! Memuatkan ruang kerja anda...');
        navigate('/', { replace: true });
        return;
        
      } else if (authMode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (resetError) throw resetError;
        
        setSuccess('Pautan pemulihan telah dihantar ke e-mel anda.');
        setAuthMode('login');
        setPassword('');
      }
    } catch (err: any) {
      console.error(`[LARAS Auth] ${authMode}${authMode === 'onboarding' ? `:${onboardingType}` : ''} failed:`, {
        code: err?.code,
        status: err?.status,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
      });

      setError(mapAuthErrorMessage(err, authMode, onboardingType));
      if (authMode === 'login') setPassword('');
    } finally {
      if (!completedOnboarding) {
        setIsProcessing(false);
      }
    }
  };

  const handleOAuth = async (provider: 'google') => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider, 
        options: { 
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[LARAS Auth] Google OAuth init failed:', {
        code: err?.code,
        message: err?.message,
      });
      setError('Gagal menyambung ke pelayan Google. Sila cuba lagi.');
    }
  };

  const cancelOnboarding = async () => {
    setIsProcessing(true);
    try {
      await supabase.rpc('cancel_incomplete_google_onboarding');
    } catch {
      // Ignore cleanup errors and proceed with signOut
    } finally {
      await supabase.auth.signOut();
      setIsProcessing(false);
      setError(null);
      setSuccess(null);
      setAuthMode('login');
    }
  };

  const toggleMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setSuccess(null);
    setPassword('');
  };

  if (isCheckingProfile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-ink">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-semibold">Mengesahkan status akaun anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex font-sans overflow-hidden box-border bg-white">
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:px-16 lg:py-10 h-full overflow-y-auto relative z-10 no-scrollbar">
        <div className="flex items-center gap-2.5 shrink-0 mb-8">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center text-white">
            <School size={16} />
          </div>
          <span className="text-lg font-bold text-ink tracking-tight">Laras</span>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto">
          {authMode === 'reset' && (
            <button onClick={() => toggleMode('login')} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-ink transition-colors mb-6 w-fit">
              <ArrowLeft size={14} /> Kembali ke Log Masuk
            </button>
          )}

          <div className="text-center mb-6 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-1.5 tracking-tight">
              {authMode === 'login' && 'Selamat Kembali'}
              {authMode === 'register' && 'Daftar Sekolah Baru'}
              {authMode === 'onboarding' && 'Lengkapkan Pendaftaran'}
              {authMode === 'reset' && 'Lupa Kata Laluan'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {authMode === 'login' && 'Masukkan e-mel dan kata laluan untuk mengakses akaun.'}
              {authMode === 'register' && 'Daftar sebagai Pentadbir Sistem untuk sekolah anda.'}
              {authMode === 'onboarding' && (
                onboardingType === 'join'
                  ? 'Masukkan kod pendaftaran sekolah sedia ada untuk menyertai ruang kerja.'
                  : 'Sila masukkan butiran sekolah anda untuk mencipta ruang kerja.'
              )}
              {authMode === 'reset' && 'Masukkan e-mel rasmi anda dan kami akan hantar pautan pemulihan.'}
            </p>
          </div>

          {authMode === 'onboarding' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg mb-4 shrink-0">
              <button
                type="button"
                onClick={() => { setOnboardingType('join'); setError(null); }}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  onboardingType === 'join' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
                }`}
              >
                Sertai Sekolah
              </button>
              <button
                type="button"
                onClick={() => { setOnboardingType('create'); setError(null); }}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  onboardingType === 'create' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
                }`}
              >
                Daftar Sekolah Baru
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 shrink-0" noValidate>
            {error && (
              <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-start gap-2.5 text-rose text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-forest/10 border border-forest/20 rounded-lg flex items-start gap-2.5 text-forest text-xs font-medium">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {authMode === 'onboarding' && onboardingType === 'join' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Penuh</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Cikgu Aminah binti Ismail" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kod Pendaftaran Sekolah</label>
                  <div className="relative">
                    <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="Contoh: YEA1094" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                  </div>
                </div>
                <div className="my-2 border-b border-slate-100"></div>
              </>
            )}

            {(authMode === 'register' || (authMode === 'onboarding' && onboardingType === 'create')) && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pentadbir</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Ahmad bin Ali" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Sekolah</label>
                    <div className="relative">
                      <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="SMK Mutiara" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                    </div>
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kod</label>
                    <input type="text" required value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="YEA1094" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negeri</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select value={schoolState} onChange={(e) => setSchoolState(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink appearance-none cursor-pointer">
                        <option value="Sarawak">Sarawak</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Johor">Johor</option>
                        <option value="Selangor">Selangor</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daerah (PPD)</label>
                    <div className="relative">
                      <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Samarahan" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                    </div>
                  </div>
                </div>
                <div className="my-2 border-b border-slate-100"></div>
              </>
            )}

            {authMode !== 'onboarding' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mel Rasmi</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sekolah.edu.my" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'register') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Laluan</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink focus:outline-none transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm bg-white group-hover:border-ink flex items-center justify-center transition-colors">
                     <CheckCircle2 size={10} className="text-ink opacity-0" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">Ingat Saya</span>
                </label>
                <button type="button" onClick={() => toggleMode('reset')} className="text-[11px] font-semibold text-ink hover:underline">
                  Lupa Kata Laluan?
                </button>
              </div>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity disabled:opacity-70 flex justify-center items-center h-10.5 mt-4">
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : (
                authMode === 'login' ? 'Log Masuk' : 
                authMode === 'register' ? 'Daftar dengan E-mel' :
                authMode === 'onboarding' ? (onboardingType === 'join' ? 'Sertai Sekolah & Masuk' : 'Simpan & Masuk') : 
                'Hantar Pautan'
              )}
            </button>
          </form>

          {(authMode === 'login' || authMode === 'register') && (
            <>
              <div className="flex items-center gap-4 my-5 shrink-0">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Atau teruskan dengan</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button type="button" onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5">
                  <Globe size={14} className="text-ink" />
                  <span className="text-xs font-semibold text-ink">Akaun Google (Termasuk DELIMa)</span>
                </button>
              </div>
            </>
          )}

          {authMode === 'onboarding' && (
            <div className="mt-6 text-center shrink-0">
               <button type="button" onClick={cancelOnboarding} disabled={isProcessing} className="flex items-center justify-center gap-1.5 mx-auto text-xs font-semibold text-rose hover:underline focus:outline-none disabled:opacity-50">
                 <LogOut size={14} /> Log Keluar & Batal
               </button>
            </div>
          )}

          {(authMode === 'login' || authMode === 'register') && (
            <div className="mt-6 text-center text-xs font-medium text-slate-500 shrink-0">
              {authMode === 'login' ? "Organisasi belum didaftarkan? " : "Sudah mempunyai akaun sekolah? "}
              <button type="button" onClick={() => toggleMode(authMode === 'login' ? 'register' : 'login')} className="font-semibold text-ink hover:underline focus:outline-none ml-1">
                {authMode === 'login' ? 'Daftar Sekolah Sekarang.' : 'Log Masuk.'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0 mt-8">
          <p>&copy; {new Date().getFullYear()} LARAS OS.</p>
          <div className="flex gap-4">
            <button className="hover:text-ink transition-colors">Terma</button>
            <button className="hover:text-ink transition-colors">Privasi</button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 h-full bg-ink relative overflow-hidden text-white">
        <div className="w-full h-full p-12 xl:p-24 flex flex-col relative z-10">
          <div className="max-w-md">
            <h1 className="text-3xl xl:text-5xl font-semibold leading-tight mb-4 tracking-tight">Urus sekolah dengan lebih teratur — dan manusiawi.</h1>
            <p className="text-slate-400 text-sm xl:text-base">Log masuk untuk melihat jadual, agihan tugas, dan nadi sekolah anda dalam satu ruang kerja yang tenang.</p>
          </div>
          <div className="mt-auto w-[110%] bg-canvas border border-slate-800 rounded-t-xl p-6 translate-y-8 flex-1 max-h-[55%] relative flex flex-col gap-4">
             <div className="flex items-center justify-center h-full text-slate-600">Illustrasi Ruang Kerja</div>
          </div>
        </div>
      </div>
    </div>
  );
}