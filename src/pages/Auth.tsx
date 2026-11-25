import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Loader2,
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Eye,
  Globe,
  User,
  MapPin,
  Building,
  Mail,
  ArrowLeft,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Clock,
  Lock,
  Layers,
  Check,
  X,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';
import {
  MALAYSIA_STATES,
  SCHOOL_CATEGORIES,
  getPpdsByState,
  inferStateFromSchoolCode,
} from '../data/malaysiaEducation';

interface AuthProps {
  message?: string | null;
  session?: any;
  isRecovery?: boolean;
  onRecoveryComplete?: () => void;
}

type AuthMode =
  | 'login'
  | 'register'
  | 'reset'
  | 'update-password'
  | 'onboarding'
  | 'verify-email'
  | 'email-confirmed';

type OnboardingType = 'join' | 'create';

const STORAGE_KEYS = {
  REMEMBER_ME: 'laras_remember_me',
  SESSION_ALIVE: 'laras_tab_session_alive',
  PENDING_EMAIL: 'laras_pending_verification_email',
  VERIFIED_TOAST: 'laras_email_verified_toast',
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmailFormat(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Sila masukkan alamat e-mel rasmi anda.';
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Format e-mel tidak sah. Contoh: admin@sekolah.edu.my';
  }
  return null;
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

function mapAuthErrorMessage(
  err: any,
  mode: AuthMode,
  onboardingType?: OnboardingType
): string {
  const code = err?.code || '';
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  // 1. Invalid school code
  if (code === 'P0002' || msg.includes('invalid_school_code') || msg.includes('tidak dijumpai')) {
    return 'Kod sekolah tidak sah atau tidak berdaftar. Sila semak semula dengan pentadbir sekolah anda.';
  }

  // 2. Expired or invalid OTP / email verification link
  if (
    code === 'otp_expired' ||
    msg.includes('otp_expired') ||
    msg.includes('token has expired') ||
    msg.includes('email link is invalid or has expired')
  ) {
    return 'Pautan pengesahan telah tamat tempoh atau sudah digunakan. Sila minta pautan pengesahan baharu.';
  }

  // 3. Session / Google OAuth expiration
  if (code === '28000' || msg.includes('jwt') || msg.includes('session') || msg.includes('sesi')) {
    return 'Sesi pengesahan anda telah tamat. Sila log masuk semula untuk meneruskan.';
  }

  // 4. Rate limiting
  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('for security purposes, you can only request this after')
  ) {
    return 'Terlalu banyak percubaan penghantaran e-mel. Sila tunggu 60 saat sebelum mencuba semula.';
  }

  // 5. Standard Auth errors
  if (msg.includes('invalid login credentials')) {
    return 'E-mel atau kata laluan tidak sah. Sila semak semula butiran log masuk anda.';
  }
  if (msg.includes('email not confirmed') || msg.includes('sahkan e-mel')) {
    return 'E-mel anda belum disahkan. Sila klik pautan pengesahan di dalam peti masuk e-mel anda.';
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'E-mel ini telah didaftarkan dalam sistem. Sila log masuk atau gunakan fungsi Lupa Kata Laluan.';
  }
  if (msg.includes('weak_password') || msg.includes('password should be at least')) {
    return 'Kata laluan terlalu lemah. Gunakan sekurang-kurangnya 8 aksara dengan gabungan huruf besar, huruf kecil, nombor dan simbol.';
  }
  if (msg.includes('same_password') || msg.includes('new password should be different')) {
    return 'Kata laluan baharu mestilah berbeza daripada kata laluan semasa anda.';
  }
  if (msg.includes('email_address_invalid') || msg.includes('unable to validate email')) {
    return 'Alamat e-mel tidak sah. Sila pastikan e-mel ditaip dengan betul.';
  }

  // 6. Input validation errors
  if (code === '22023' || msg.includes('validation_error') || msg.includes('wajib diisi')) {
    return 'Sila pastikan semua maklumat wajib diisi dengan format yang sah.';
  }

  // 7. Duplicate constraints
  if (code === '23505' || msg.includes('duplicate_school_code') || msg.includes('duplicate key')) {
    if (
      onboardingType === 'create' &&
      (msg.includes('school') || msg.includes('code') || msg.includes('kod sekolah'))
    ) {
      return 'Kod sekolah ini telah didaftarkan dalam sistem. Pilih "Sertai Sekolah" untuk menyertai sekolah tersebut.';
    }
    return 'Rekod sekolah atau akaun ini telah wujud dalam sistem. Sila log masuk.';
  }

  // 8. RLS / Permission / PostgREST errors
  if (
    code === '42501' ||
    code === 'PGRST116' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied')
  ) {
    return 'Akses pangkalan data ditolak oleh polisi keselamatan (RLS). Sila hubungi pentadbir sistem.';
  }

  // 9. Database integrity errors
  if (
    code === '22P02' ||
    code === '23514' ||
    code.startsWith('23') ||
    code.startsWith('P0') ||
    msg.includes('violates')
  ) {
    return `Ralat integriti pangkalan data (${code || 'DB'}) semasa memautkan akaun sekolah. Sila cuba semula.`;
  }

  // 10. Missing RPC function
  if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
    return 'Fungsi pelayan tidak ditemui. Sila pastikan migrasi pangkalan data terkini telah dijalankan.';
  }

  // 11. Network failures
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed')
  ) {
    return 'Sambungan rangkaian terganggu semasa menghubungi pelayan. Sila semak internet anda dan cuba lagi.';
  }

  if (mode === 'onboarding') {
    return `Pendaftaran sekolah gagal diselesaikan${code ? ` (Kod: ${code})` : ''}. Sila cuba lagi.`;
  }

  return 'Berlaku ralat semasa memproses permintaan anda. Sila cuba semula.';
}

export default function Auth({
  message,
  session,
  isRecovery = false,
  onRecoveryComplete,
}: AuthProps) {
  const navigate = useNavigate();

  // Synchronously capture URL callback parameters on initial load before cleaning URL
  const initialCallbackRef = useRef<{
    type: string | null;
    error: string | null;
    errorCode: string | null;
    errorDescription: string | null;
    tokenHash: string | null;
    pathname: string;
  } | null>(null);

  if (initialCallbackRef.current === null && typeof window !== 'undefined') {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);

    initialCallbackRef.current = {
      type: hashParams.get('type') || searchParams.get('type'),
      error: hashParams.get('error') || searchParams.get('error'),
      errorCode: hashParams.get('error_code') || searchParams.get('error_code'),
      errorDescription:
        hashParams.get('error_description') || searchParams.get('error_description'),
      tokenHash: searchParams.get('token_hash'),
      pathname: window.location.pathname,
    };
  }

  const processedCallbackRef = useRef(false);
  const isSignupConfirmationFlowRef = useRef(
    initialCallbackRef.current?.type === 'signup' ||
      initialCallbackRef.current?.type === 'email'
  );
  const isRecoveryFlowRef = useRef(
    isRecovery ||
      initialCallbackRef.current?.type === 'recovery' ||
      initialCallbackRef.current?.pathname === '/update-password'
  );

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (isRecoveryFlowRef.current) {
      return 'update-password';
    }
    return 'login';
  });

  const [onboardingType, setOnboardingType] = useState<OnboardingType>('join');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isVerifyingRecovery, setIsVerifyingRecovery] = useState<boolean>(
    () => isRecoveryFlowRef.current
  );
  const [error, setError] = useState<string | null>(message || null);
  const [success, setSuccess] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  // Email Verification & Resend States
  const [pendingEmail, setPendingEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL) || '';
    } catch {
      return '';
    }
  });
  const [verificationExpiredState, setVerificationExpiredState] = useState(false);
  const [showInlineResend, setShowInlineResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmedUserEmail, setConfirmedUserEmail] = useState('');

  // Form States
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Field-level touch & validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [, setPasswordTouched] = useState(false);

  // Registration & Onboarding States
  const [fullName, setFullName] = useState('');
  const [schoolCategory, setSchoolCategory] = useState('SMK');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolState, setSchoolState] = useState('Sarawak');
  const [district, setDistrict] = useState('');

  // Derived Options & Validation
  const stateOptions = useMemo(
    () =>
      MALAYSIA_STATES.map((s) => ({
        value: s.name,
        label: s.name,
        sublabel: s.jpnName,
      })),
    []
  );

  const ppdOptions = useMemo(
    () =>
      getPpdsByState(schoolState).map((ppd) => ({
        value: ppd,
        label: ppd,
      })),
    [schoolState]
  );

  const categoryOptions = useMemo(
    () =>
      SCHOOL_CATEGORIES.map((c) => ({
        value: c.value,
        label: c.label,
        sublabel: c.description,
      })),
    []
  );

  const emailError = useMemo(() => {
    if (!emailTouched && !email) return null;
    return validateEmailFormat(email);
  }, [email, emailTouched]);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSymbol;

  const inferredStateFromCode = useMemo(
    () => inferStateFromSchoolCode(schoolCode),
    [schoolCode]
  );

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // Enforce "Ingat Saya" session persistence policy across browser restarts
  useEffect(() => {
    try {
      const rememberPref = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      const tabAlive = sessionStorage.getItem(STORAGE_KEYS.SESSION_ALIVE);
      if (rememberPref === 'false' && !tabAlive && session?.user) {
        supabase.auth.signOut({ scope: 'local' }).finally(() => {
          localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        });
      }
    } catch {
      // Ignore storage access errors in private modes
    }
  }, [session]);

  // Sync external PASSWORD_RECOVERY event detected by App.tsx
  useEffect(() => {
    if (isRecovery) {
      isRecoveryFlowRef.current = true;
      setIsVerifyingRecovery(false);
      setError(null);
      setSuccess(null);
      setAuthMode('update-password');
    }
  }, [isRecovery]);

  // Handle URL callback errors, token_hash verification, and PASSWORD_RECOVERY listener
  useEffect(() => {
    let mounted = true;
    const cb = initialCallbackRef.current;

    const cleanUrlParams = () => {
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, '/login');
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryFlowRef.current = true;
        setIsVerifyingRecovery(false);
        setError(null);
        setSuccess(null);
        setPassword('');
        setConfirmPassword('');
        setAuthMode('update-password');
        cleanUrlParams();
      } else if (
        event === 'SIGNED_IN' &&
        isSignupConfirmationFlowRef.current &&
        !isRecoveryFlowRef.current &&
        currentSession?.user
      ) {
        try {
          localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
          sessionStorage.setItem(STORAGE_KEYS.VERIFIED_TOAST, '1');
        } catch {
          // ignore
        }
        setConfirmedUserEmail(currentSession.user.email || '');
        setAuthMode('email-confirmed');
        cleanUrlParams();
      }
    });

    async function initCallback() {
      if (processedCallbackRef.current || !cb) return;
      processedCallbackRef.current = true;

      if (cb.error || cb.errorCode) {
        cleanUrlParams();
        setIsVerifyingRecovery(false);
        const isExpired =
          cb.errorCode === 'otp_expired' ||
          cb.error === 'access_denied' ||
          (cb.errorDescription || '').toLowerCase().includes('expired');

        if (isExpired) {
          if (isRecoveryFlowRef.current) {
            isRecoveryFlowRef.current = false;
            onRecoveryComplete?.();
            setAuthMode('reset');
            setError(
              'Pautan tetapan semula kata laluan telah tamat tempoh atau sudah digunakan. Sila minta pautan baharu di bawah.'
            );
          } else {
            setVerificationExpiredState(true);
            setError(
              'Pautan pengesahan telah tamat tempoh atau sudah digunakan. Jika anda belum mengesahkan akaun, sila minta pautan baharu di bawah.'
            );
          }
        } else {
          setError(
            mapAuthErrorMessage(
              { code: cb.errorCode, message: cb.errorDescription || cb.error },
              isRecoveryFlowRef.current ? 'update-password' : 'login'
            )
          );
        }
        return;
      }

      if (cb.tokenHash && cb.type === 'recovery') {
        isRecoveryFlowRef.current = true;
        setAuthMode('update-password');
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: cb.tokenHash,
          type: 'recovery',
        });
        cleanUrlParams();
        if (!mounted) return;
        setIsVerifyingRecovery(false);

        if (verifyErr) {
          isRecoveryFlowRef.current = false;
          onRecoveryComplete?.();
          setAuthMode('reset');
          setError(
            'Pautan tetapan semula kata laluan tidak sah atau telah tamat tempoh. Sila minta pautan baharu.'
          );
        }
        return;
      }

      if (cb.tokenHash && (cb.type === 'signup' || cb.type === 'email')) {
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: cb.tokenHash,
          type: cb.type === 'email' ? 'email' : 'signup',
        });
        cleanUrlParams();
        if (!mounted) return;

        if (verifyErr) {
          setVerificationExpiredState(true);
          setError(mapAuthErrorMessage(verifyErr, 'verify-email'));
          return;
        }
        if (data.user) {
          try {
            localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
            sessionStorage.setItem(STORAGE_KEYS.VERIFIED_TOAST, '1');
          } catch {
            // ignore
          }
          setConfirmedUserEmail(data.user.email || '');
          setAuthMode('email-confirmed');
        }
        return;
      }

      // Let Supabase finish exchanging #access_token or ?code before cleaning the URL
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      cleanUrlParams();

      if (isRecoveryFlowRef.current) {
        setIsVerifyingRecovery(false);
        if (!activeSession?.user) {
          isRecoveryFlowRef.current = false;
          onRecoveryComplete?.();
          setAuthMode('reset');
          setError(
            'Sesi pemulihan kata laluan tidak ditemui atau pautan telah tamat tempoh. Sila masukkan e-mel anda untuk pautan baharu.'
          );
        }
      }
    }

    initCallback();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onRecoveryComplete]);

  // Check authenticated user's profile & school linkage
  useEffect(() => {
    let mounted = true;

    async function checkRegistrationStatus() {
      if (
        !session?.user ||
        isProcessing ||
        isRecovery ||
        isRecoveryFlowRef.current ||
        authMode === 'update-password'
      ) {
        return;
      }

      if (isSignupConfirmationFlowRef.current || authMode === 'email-confirmed') {
        setConfirmedUserEmail(session.user.email || '');
        try {
          localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
          sessionStorage.setItem(STORAGE_KEYS.VERIFIED_TOAST, '1');
        } catch {
          // ignore
        }
        if (authMode !== 'email-confirmed') {
          setAuthMode('email-confirmed');
        }
        return;
      }

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

    checkRegistrationStatus();

    return () => {
      mounted = false;
    };
  }, [session, isProcessing, isRecovery, authMode, navigate]);

  // Auto-redirect smoothly after showing email verification success state
  useEffect(() => {
    if (authMode !== 'email-confirmed') return;
    const timer = window.setTimeout(() => {
      isSignupConfirmationFlowRef.current = false;
      if (session?.user) {
        navigate('/', { replace: true });
      } else {
        setSuccess('E-mel anda telah disahkan. Sila log masuk ke akaun LARAS anda.');
        setAuthMode('login');
      }
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [authMode, session, navigate]);

  const handleStateChange = (newState: string) => {
    setSchoolState(newState);
    const validPpds = getPpdsByState(newState);
    if (validPpds.length === 1) {
      setDistrict(validPpds[0]);
    } else if (!validPpds.includes(district)) {
      setDistrict('');
    }
  };

  const handleResendConfirmation = async (targetEmail?: string) => {
    const emailToVerify = (targetEmail || pendingEmail || email).trim();
    const emailValidation = validateEmailFormat(emailToVerify);
    if (emailValidation) {
      setError(emailValidation);
      return;
    }

    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setInfoNotice(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToVerify,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (resendError) {
        const lowerMsg = (resendError.message || '').toLowerCase();
        if (lowerMsg.includes('already confirmed') || lowerMsg.includes('already verified')) {
          setVerificationExpiredState(false);
          setShowInlineResend(false);
          setSuccess('E-mel anda telah pun disahkan! Sila log masuk ke akaun anda.');
          setAuthMode('login');
          return;
        }
        throw resendError;
      }

      setPendingEmail(emailToVerify);
      try {
        localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, emailToVerify);
      } catch {
        // ignore
      }
      setResendCooldown(60);
      setVerificationExpiredState(false);
      setShowInlineResend(false);
      setInfoNotice(
        `Pautan pengesahan baharu telah dihantar ke ${emailToVerify}. Sila semak peti masuk atau folder spam anda.`
      );
      if (authMode !== 'verify-email') {
        setAuthMode('verify-email');
      }
    } catch (err: any) {
      console.error('[LARAS Auth] Resend confirmation failed:', err);
      setError(mapAuthErrorMessage(err, 'verify-email'));
    } finally {
      setIsResending(false);
    }
  };

  const validateOnboardingForm = (type: OnboardingType): string | null => {
    if (!fullName.trim()) return 'Sila masukkan nama penuh anda.';
    if (!schoolCode.trim()) {
      return 'Sila masukkan kod sekolah rasmi (contoh: YEA1094).';
    }
    if (!/^[A-Za-z0-9]{4,12}$/.test(schoolCode.trim())) {
      return 'Format kod sekolah tidak sah. Gunakan 4 hingga 12 aksara abjad dan nombor (contoh: YEA1094).';
    }
    if (type === 'create') {
      if (!schoolName.trim()) return 'Sila masukkan nama penuh sekolah.';
      if (!schoolState.trim()) return 'Sila pilih negeri sekolah.';
      if (!district.trim()) return 'Sila pilih atau masukkan PPD / daerah sekolah.';
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInfoNotice(null);
    setShowInlineResend(false);

    if (authMode === 'login') {
      setEmailTouched(true);
      const emailErr = validateEmailFormat(email);
      if (emailErr) {
        setError(emailErr);
        return;
      }
      if (!password) {
        setError('Sila masukkan kata laluan anda.');
        return;
      }
    } else if (authMode === 'register') {
      setEmailTouched(true);
      setPasswordTouched(true);
      const validationErr = validateOnboardingForm('create');
      if (validationErr) {
        setError(validationErr);
        return;
      }
      const emailErr = validateEmailFormat(email);
      if (emailErr) {
        setError(emailErr);
        return;
      }
      if (!isPasswordStrong) {
        setError(
          'Kata laluan mestilah sekurang-kurangnya 8 aksara serta mengandungi huruf besar, huruf kecil, nombor dan simbol.'
        );
        return;
      }
    } else if (authMode === 'onboarding') {
      const validationErr = validateOnboardingForm(onboardingType);
      if (validationErr) {
        setError(validationErr);
        return;
      }
    } else if (authMode === 'reset') {
      setEmailTouched(true);
      const emailErr = validateEmailFormat(email);
      if (emailErr) {
        setError(emailErr);
        return;
      }
    } else if (authMode === 'update-password') {
      setPasswordTouched(true);
      if (!isPasswordStrong) {
        setError(
          'Kata laluan baharu mestilah sekurang-kurangnya 8 aksara serta mengandungi huruf besar, huruf kecil, nombor dan simbol.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError('Pengesahan kata laluan tidak sepadan. Sila semak semula.');
        return;
      }
    }

    setIsProcessing(true);
    let completedOnboarding = false;

    try {
      if (authMode === 'login') {
        const cleanEmail = email.trim();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) {
          if ((signInError.message || '').toLowerCase().includes('email not confirmed')) {
            setPendingEmail(cleanEmail);
            setShowInlineResend(true);
          }
          throw signInError;
        }
        if (data.user && !data.session) {
          setPendingEmail(cleanEmail);
          setShowInlineResend(true);
          throw new Error('Sila sahkan e-mel anda sebelum log masuk.');
        }

        try {
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe ? 'true' : 'false');
          sessionStorage.setItem(STORAGE_KEYS.SESSION_ALIVE, '1');
          localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
        } catch {
          // ignore
        }
      } else if (authMode === 'register') {
        const cleanEmail = email.trim();
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              is_admin_registration: true,
              full_name: fullName.trim(),
              school_category: schoolCategory,
              school_name: schoolName.trim(),
              school_code: schoolCode.trim().toUpperCase(),
              state: schoolState.trim(),
              district: district.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Pendaftaran gagal. Sila cuba lagi.');

        if (authData.session) {
          try {
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            sessionStorage.setItem(STORAGE_KEYS.SESSION_ALIVE, '1');
          } catch {
            // ignore
          }
          setSuccess('Pendaftaran berjaya! Memuatkan ruang kerja sekolah anda...');
          return;
        }

        setPendingEmail(cleanEmail);
        try {
          localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, cleanEmail);
        } catch {
          // ignore
        }
        setResendCooldown(60);
        setPassword('');
        setPasswordTouched(false);
        setAuthMode('verify-email');
      } else if (authMode === 'onboarding') {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          throw { code: '28000', message: userError?.message || 'Sesi telah tamat.' };
        }

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

        const { data: verifiedProfile, error: verifyError } = await supabase
          .from('profiles')
          .select('school_id, role')
          .eq('id', user.id)
          .single();

        if (verifyError || !verifiedProfile?.school_id || !verifiedProfile?.role) {
          throw (
            verifyError || {
              code: '42501',
              message: 'Profil sekolah gagal disahkan selepas pendaftaran.',
            }
          );
        }

        completedOnboarding = true;
        setSuccess('Pendaftaran selesai! Memuatkan ruang kerja anda...');
        navigate('/', { replace: true });
        return;
      } else if (authMode === 'reset') {
        const cleanEmail = email.trim();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/login?type=recovery`,
        });
        if (resetError) throw resetError;

        setResendCooldown(60);
        setSuccess(
          `Pautan tetapan semula kata laluan telah dihantar ke ${cleanEmail}. Sila semak peti masuk atau folder spam anda.`
        );
      } else if (authMode === 'update-password') {
        const {
          data: { session: recoverySession },
        } = await supabase.auth.getSession();

        if (!recoverySession?.user) {
          isRecoveryFlowRef.current = false;
          onRecoveryComplete?.();
          setAuthMode('reset');
          throw {
            code: '28000',
            message: 'Sesi pemulihan kata laluan telah tamat. Sila minta pautan baharu.',
          };
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;

        try {
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
          sessionStorage.setItem(STORAGE_KEYS.SESSION_ALIVE, '1');
        } catch {
          // ignore
        }

        isRecoveryFlowRef.current = false;
        onRecoveryComplete?.();
        setPassword('');
        setConfirmPassword('');
        setPasswordTouched(false);
        setSuccess('Kata laluan baharu anda berjaya disimpan! Mengalihkan...');

        window.setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
      }
    } catch (err: any) {
      console.error(
        `[LARAS Auth] ${authMode}${authMode === 'onboarding' ? `:${onboardingType}` : ''} failed:`,
        {
          code: err?.code,
          status: err?.status,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
        }
      );

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
      setIsProcessing(true);
      try {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ALIVE, '1');
      } catch {
        // ignore
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('[LARAS Auth] Google OAuth init failed:', {
        code: err?.code,
        message: err?.message,
      });
      setIsProcessing(false);
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
      setInfoNotice(null);
      setAuthMode('login');
    }
  };

  const toggleMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setSuccess(null);
    setInfoNotice(null);
    setShowInlineResend(false);
    setVerificationExpiredState(false);
    setPassword('');
    setConfirmPassword('');
    setPasswordTouched(false);
  };

  if (isVerifyingRecovery) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-ink">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-semibold">Mengesahkan pautan pemulihan kata laluan...</p>
          <p className="text-xs text-slate-400">Sila tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (isCheckingProfile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-ink">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-semibold">Mengesahkan status akaun anda...</p>
          <p className="text-xs text-slate-400">Menyediakan ruang kerja sekolah LARAS</p>
        </div>
      </div>
    );
  }

  const isWideForm =
    authMode === 'register' || (authMode === 'onboarding' && onboardingType === 'create');

  return (
    <div className="h-screen w-full flex font-sans overflow-hidden box-border bg-white">
      {/* Left Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:px-14 lg:py-8 h-full overflow-y-auto relative z-10 no-scrollbar">
        {/* Brand Header */}
        <div className="flex items-center justify-between shrink-0 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center text-white">
              <School size={16} />
            </div>
            <span className="text-lg font-bold text-ink tracking-tight">Laras</span>
          </div>

          {authMode === 'register' && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
              Pendaftaran Pentadbir
            </span>
          )}
        </div>

        {/* Main Center Container */}
        <div
          className={`flex-1 flex flex-col justify-center w-full ${
            isWideForm ? 'max-w-md' : 'max-w-sm'
          } mx-auto transition-all duration-200`}
        >
          {(authMode === 'reset' || authMode === 'verify-email') && (
            <button
              type="button"
              onClick={() => toggleMode('login')}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-ink transition-colors mb-5 w-fit"
            >
              <ArrowLeft size={14} /> Kembali ke Log Masuk
            </button>
          )}

          {/* EMAIL CONFIRMED STATE */}
          {authMode === 'email-confirmed' ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 rounded-2xl bg-forest/10 border border-forest/20 text-forest flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold text-ink tracking-tight">
                  E-mel Berjaya Disahkan!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Akaun pentadbir sekolah anda
                  {confirmedUserEmail ? (
                    <>
                      {' '}
                      (<span className="font-semibold text-ink">{confirmedUserEmail}</span>)
                    </>
                  ) : null}{' '}
                  telah diaktifkan sepenuhnya.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-ink shrink-0" />
                <span>Mengalihkan anda ke ruang kerja sekolah LARAS...</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  isSignupConfirmationFlowRef.current = false;
                  if (session?.user) {
                    navigate('/', { replace: true });
                  } else {
                    toggleMode('login');
                  }
                }}
                className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity flex justify-center items-center h-10.5"
              >
                {session?.user ? 'Teruskan ke Papan Pemuka' : 'Log Masuk Sekarang'}
              </button>
            </div>
          ) : authMode === 'verify-email' ? (
            /* EMAIL VERIFICATION PENDING STATE */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-ink/5 border border-slate-200 text-ink flex items-center justify-center mx-auto mb-3">
                  <Mail size={22} />
                </div>
                <h2 className="text-2xl font-semibold text-ink tracking-tight">
                  Semak Peti Masuk E-mel Anda
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Kami telah menghantar pautan pengesahan akaun ke{' '}
                  <span className="font-semibold text-ink break-all">
                    {pendingEmail || email}
                  </span>
                  .
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-start gap-2.5 text-rose text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {infoNotice && (
                <div className="p-3 bg-forest/10 border border-forest/20 rounded-lg flex items-start gap-2.5 text-forest text-xs font-medium">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{infoNotice}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Clock size={14} className="text-ink shrink-0 mt-0.5" />
                  <p>
                    Klik pautan <strong className="text-ink">Confirm email address</strong> di dalam
                    e-mel tersebut untuk mengaktifkan ruang kerja sekolah anda.
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">
                  Tidak jumpa e-mel? Sila semak folder <strong className="text-slate-600">Spam</strong>{' '}
                  atau <strong className="text-slate-600">Promotions</strong>, kemudian minta pautan
                  baharu di bawah.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isResending || resendCooldown > 0}
                  onClick={() => handleResendConfirmation(pendingEmail || email)}
                  className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 h-10.5"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menghantar semula...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw size={14} />
                      <span>Hantar Semula dalam {resendCooldown}s</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Hantar Semula E-mel Pengesahan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(pendingEmail || email);
                    toggleMode('login');
                  }}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-ink border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Sudah Sahkan E-mel? Teruskan ke Log Masuk
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD AUTH FORMS (LOGIN / REGISTER / ONBOARDING / RESET / UPDATE-PASSWORD) */
            <>
              <div className="text-center mb-5 shrink-0">
                <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-1.5 tracking-tight">
                  {authMode === 'login' && 'Selamat Kembali'}
                  {authMode === 'register' && 'Daftar Sekolah Baru'}
                  {authMode === 'onboarding' && 'Lengkapkan Pendaftaran'}
                  {authMode === 'reset' && 'Lupa Kata Laluan'}
                  {authMode === 'update-password' && 'Kata Laluan Baharu'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {authMode === 'login' && 'Masukkan e-mel dan kata laluan untuk mengakses akaun.'}
                  {authMode === 'register' &&
                    'Daftar sebagai Pentadbir Sistem untuk mencipta ruang kerja sekolah.'}
                  {authMode === 'onboarding' &&
                    (onboardingType === 'join'
                      ? 'Masukkan kod pendaftaran sekolah sedia ada untuk menyertai ruang kerja.'
                      : 'Sila lengkapkan butiran sekolah anda untuk mencipta ruang kerja.')}
                  {authMode === 'reset' &&
                    'Masukkan e-mel rasmi anda dan kami akan hantar pautan tetapan semula.'}
                  {authMode === 'update-password' &&
                    'Tetapkan kata laluan baharu yang kukuh untuk akaun LARAS anda.'}
                </p>
              </div>

              {authMode === 'onboarding' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg mb-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingType('join');
                      setError(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-all ${
                      onboardingType === 'join'
                        ? 'bg-white text-ink shadow-xs'
                        : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    Sertai Sekolah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingType('create');
                      setError(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-all ${
                      onboardingType === 'create'
                        ? 'bg-white text-ink shadow-xs'
                        : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    Daftar Sekolah Baru
                  </button>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5 shrink-0" noValidate>
                {error && (
                  <div className="p-3 bg-rose/10 border border-rose/20 rounded-lg space-y-2 text-rose text-xs font-medium">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>

                    {(showInlineResend || verificationExpiredState) && (
                      <div className="pl-6 pt-0.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isResending || resendCooldown > 0}
                          onClick={() => handleResendConfirmation(pendingEmail || email)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose/30 rounded-md text-[11px] font-semibold text-ink hover:bg-slate-50 transition-colors disabled:opacity-60"
                        >
                          {isResending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          {resendCooldown > 0
                            ? `Hantar semula (${resendCooldown}s)`
                            : 'Hantar Semula E-mel Pengesahan'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-forest/10 border border-forest/20 rounded-lg flex items-start gap-2.5 text-forest text-xs font-medium">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {/* ONBOARDING: JOIN EXISTING SCHOOL */}
                {authMode === 'onboarding' && onboardingType === 'join' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Nama Penuh
                      </label>
                      <div className="relative">
                        <User
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          required
                          disabled={isProcessing}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Contoh: Cikgu Aminah binti Ismail"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Kod Pendaftaran Sekolah
                      </label>
                      <div className="relative">
                        <School
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          required
                          disabled={isProcessing}
                          value={schoolCode}
                          onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                          placeholder="Contoh: YEA1094"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Dapatkan kod sekolah 7-aksara KPM daripada Pentadbir Sistem sekolah anda.
                      </p>
                    </div>
                    <div className="my-2 border-b border-slate-100"></div>
                  </>
                )}

                {/* REGISTER OR ONBOARDING: CREATE NEW SCHOOL */}
                {(authMode === 'register' ||
                  (authMode === 'onboarding' && onboardingType === 'create')) && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Nama Pentadbir
                      </label>
                      <div className="relative">
                        <User
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          required
                          disabled={isProcessing}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Contoh: Ahmad bin Ali"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Kategori Sekolah
                      </label>
                      <SearchableSelect
                        value={schoolCategory}
                        onChange={setSchoolCategory}
                        options={categoryOptions}
                        placeholder="Pilih kategori sekolah..."
                        searchPlaceholder="Cari kategori (cth: SK, SMK, SJKC)..."
                        icon={<Layers size={14} />}
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nama Sekolah
                        </label>
                        <div className="relative">
                          <School
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            required
                            disabled={isProcessing}
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Contoh: SMK Muara Tuang"
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Kod Sekolah
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          disabled={isProcessing}
                          value={schoolCode}
                          onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                          placeholder="YEA1094"
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    {inferredStateFromCode && inferredStateFromCode !== schoolState && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600">
                        <span>
                          Kod <strong>{schoolCode.trim().toUpperCase()}</strong> biasanya di{' '}
                          <strong className="text-ink">{inferredStateFromCode}</strong>.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStateChange(inferredStateFromCode)}
                          className="font-semibold text-ink underline ml-2 shrink-0"
                        >
                          Guna {inferredStateFromCode}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Negeri / Wilayah
                        </label>
                        <SearchableSelect
                          value={schoolState}
                          onChange={handleStateChange}
                          options={stateOptions}
                          placeholder="Pilih negeri..."
                          searchPlaceholder="Cari negeri..."
                          icon={<MapPin size={14} />}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          PPD / Daerah
                        </label>
                        <SearchableSelect
                          value={district}
                          onChange={setDistrict}
                          options={ppdOptions}
                          placeholder={schoolState ? 'Pilih PPD / daerah...' : 'Pilih negeri dahulu'}
                          searchPlaceholder={`Cari PPD di ${schoolState}...`}
                          emptyMessage={`Tiada PPD sepadan di ${schoolState}.`}
                          icon={<Building size={14} />}
                          disabled={isProcessing || !schoolState}
                          allowCustom
                          customOptionLabel="Lain-lain PPD / Masukkan manual"
                          customInputPlaceholder="Contoh: PPD Samarahan"
                        />
                      </div>
                    </div>
                    <div className="my-1 border-b border-slate-100"></div>
                  </>
                )}

                {/* EMAIL FIELD */}
                {authMode !== 'onboarding' && authMode !== 'update-password' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      E-mel Rasmi
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        disabled={isProcessing}
                        value={email}
                        onBlur={() => setEmailTouched(true)}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="admin@sekolah.edu.my"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white border ${
                          emailTouched && emailError
                            ? 'border-rose/50 focus:border-rose focus:ring-rose/10'
                            : 'border-slate-200 focus:border-ink/40 focus:ring-ink/5'
                        } rounded-lg text-sm outline-none focus:ring-4 transition-all text-ink disabled:bg-slate-50`}
                      />
                    </div>
                    {emailTouched && emailError && (
                      <p className="text-[11px] text-rose font-medium">{emailError}</p>
                    )}
                  </div>
                )}

                {/* PASSWORD FIELD (LOGIN / REGISTER / UPDATE-PASSWORD) */}
                {(authMode === 'login' ||
                  authMode === 'register' ||
                  authMode === 'update-password') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {authMode === 'update-password' ? 'Kata Laluan Baharu' : 'Kata Laluan'}
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete={
                          authMode === 'login' ? 'current-password' : 'new-password'
                        }
                        disabled={isProcessing}
                        value={password}
                        onBlur={() => setPasswordTouched(true)}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? 'Sembunyikan kata laluan' : 'Tunjuk kata laluan'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink focus:outline-none transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Requirements Checklist for Register & Reset Password */}
                    {(authMode === 'register' || authMode === 'update-password') && (
                      <div className="pt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px]">
                        <div
                          className={`flex items-center gap-1 ${
                            passwordChecks.minLength ? 'text-forest font-medium' : 'text-slate-400'
                          }`}
                        >
                          {passwordChecks.minLength ? <Check size={12} /> : <X size={12} />}
                          <span>Min. 8 aksara</span>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${
                            passwordChecks.hasUpper ? 'text-forest font-medium' : 'text-slate-400'
                          }`}
                        >
                          {passwordChecks.hasUpper ? <Check size={12} /> : <X size={12} />}
                          <span>Huruf besar (A-Z)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${
                            passwordChecks.hasLower ? 'text-forest font-medium' : 'text-slate-400'
                          }`}
                        >
                          {passwordChecks.hasLower ? <Check size={12} /> : <X size={12} />}
                          <span>Huruf kecil (a-z)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${
                            passwordChecks.hasNumber ? 'text-forest font-medium' : 'text-slate-400'
                          }`}
                        >
                          {passwordChecks.hasNumber ? <Check size={12} /> : <X size={12} />}
                          <span>Nombor (0-9)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${
                            passwordChecks.hasSymbol ? 'text-forest font-medium' : 'text-slate-400'
                          }`}
                        >
                          {passwordChecks.hasSymbol ? <Check size={12} /> : <X size={12} />}
                          <span>Simbol (!@#$...)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CONFIRM PASSWORD FIELD (UPDATE-PASSWORD) */}
                {authMode === 'update-password' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sahkan Kata Laluan Baharu
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        disabled={isProcessing}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink disabled:bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? 'Sembunyikan pengesahan kata laluan'
                            : 'Tunjuk pengesahan kata laluan'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink focus:outline-none transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                      <p className="text-[11px] text-rose font-medium">
                        Kata laluan tidak sepadan.
                      </p>
                    )}
                  </div>
                )}

                {/* REMEMBER ME & FORGOT PASSWORD */}
                {authMode === 'login' && (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={rememberMe}
                      onClick={() => setRememberMe((prev) => !prev)}
                      className="flex items-center gap-2 cursor-pointer group focus:outline-none"
                    >
                      <span
                        className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                          rememberMe
                            ? 'bg-ink border-ink text-white'
                            : 'bg-white border-slate-300 group-hover:border-ink'
                        }`}
                      >
                        {rememberMe && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 group-hover:text-ink transition-colors">
                        Ingat Saya
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleMode('reset')}
                      className="text-[11px] font-semibold text-ink hover:underline"
                    >
                      Lupa Kata Laluan?
                    </button>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-ink hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 h-10.5 mt-3 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>
                        {authMode === 'login' && 'Mengesahkan...'}
                        {authMode === 'register' && 'Mendaftarkan Sekolah...'}
                        {authMode === 'onboarding' && 'Menyimpan Rekod...'}
                        {authMode === 'reset' && 'Menghantar Pautan...'}
                        {authMode === 'update-password' && 'Mengemas Kini...'}
                      </span>
                    </>
                  ) : authMode === 'login' ? (
                    'Log Masuk'
                  ) : authMode === 'register' ? (
                    'Daftar Sekolah & Akaun'
                  ) : authMode === 'onboarding' ? (
                    onboardingType === 'join' ? (
                      'Sertai Sekolah & Masuk'
                    ) : (
                      'Simpan & Masuk'
                    )
                  ) : authMode === 'update-password' ? (
                    'Simpan Kata Laluan Baharu'
                  ) : (
                    'Hantar Pautan Pemulihan'
                  )}
                </button>
              </form>

              {/* GOOGLE / DELIMA OAUTH */}
              {(authMode === 'login' || authMode === 'register') && (
                <>
                  <div className="flex items-center gap-4 my-4 shrink-0">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      Atau teruskan dengan
                    </span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleOAuth('google')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 disabled:opacity-60 cursor-pointer"
                    >
                      <Globe size={14} className="text-ink" />
                      <span className="text-xs font-semibold text-ink">
                        Akaun Google (Termasuk DELIMa)
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* CANCEL GOOGLE ONBOARDING */}
              {authMode === 'onboarding' && (
                <div className="mt-5 text-center shrink-0">
                  <button
                    type="button"
                    onClick={cancelOnboarding}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-1.5 mx-auto text-xs font-semibold text-rose hover:underline focus:outline-none disabled:opacity-50"
                  >
                    <LogOut size={14} /> Log Keluar & Batal
                  </button>
                </div>
              )}

              {/* SWITCH BETWEEN LOGIN & REGISTER */}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="mt-5 text-center text-xs font-medium text-slate-500 shrink-0">
                  {authMode === 'login'
                    ? 'Organisasi belum didaftarkan? '
                    : 'Sudah mempunyai akaun sekolah? '}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => toggleMode(authMode === 'login' ? 'register' : 'login')}
                    className="font-semibold text-ink hover:underline focus:outline-none ml-1"
                  >
                    {authMode === 'login' ? 'Daftar Sekolah Sekarang.' : 'Log Masuk.'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0 mt-6">
          <p>&copy; {new Date().getFullYear()} LARAS OS.</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-ink transition-colors"
            >
              Terma
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-ink transition-colors"
            >
              Privasi
            </button>
          </div>
        </div>
      </div>

      {/* Right Showcase Panel */}
      <div className="hidden lg:flex flex-1 h-full bg-ink relative overflow-hidden text-white">
        <div className="w-full h-full p-12 xl:p-20 flex flex-col relative z-10">
          <div className="max-w-md">
            <h1 className="text-3xl xl:text-5xl font-semibold leading-tight mb-4 tracking-tight">
              Urus sekolah dengan lebih teratur — dan manusiawi.
            </h1>
            <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
              Log masuk untuk melihat jadual, agihan tugas, dan nadi sekolah anda dalam satu ruang
              kerja yang tenang.
            </p>
          </div>

          {/* LARAS Workspace Preview Illustration */}
          <div
            aria-hidden="true"
            className="mt-auto w-[108%] bg-canvas border border-slate-800 rounded-t-xl p-5 xl:p-6 translate-y-8 flex-1 max-h-[56%] relative flex flex-col gap-4 text-ink select-none overflow-hidden"
          >
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="ml-2 text-[11px] font-semibold text-slate-500">
                  Buku Pengurusan Sekolah • Sesi 2026/2027
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-forest/10 border border-forest/20 text-forest text-[10px] font-semibold">
                Agihan Seimbang
              </span>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200/90 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Direktori Guru</span>
                  <Users size={13} />
                </div>
                <p className="text-lg font-bold text-ink leading-none">68 Staf</p>
                <p className="text-[10px] text-forest font-medium mt-1">100% dipadankan</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Jawatankuasa</span>
                  <Layers size={13} />
                </div>
                <p className="text-lg font-bold text-ink leading-none">24 Unit</p>
                <p className="text-[10px] text-slate-500 mt-1">Kurikulum, HEM & Koko</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Dokumen Rasmi</span>
                  <FileText size={13} />
                </div>
                <p className="text-lg font-bold text-ink leading-none">Sedia Cetak</p>
                <p className="text-[10px] text-slate-500 mt-1">Format DOCX & PDF</p>
              </div>
            </div>

            {/* Committee Allocation Preview List */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex-1 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">
                  Semakan Agihan Tugas & Jawatankuasa
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <Calendar size={11} /> Kemas kini automatik
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    unit: 'Jawatankuasa Kurikulum Sekolah',
                    lead: 'Cikgu Noraini binti Kassim',
                    load: '3 tugas',
                    status: 'Selesai',
                  },
                  {
                    unit: 'Jawatankuasa Hal Ehwal Murid (HEM)',
                    lead: 'Ustaz Hafiz bin Zulkifli',
                    load: '3 tugas',
                    status: 'Selesai',
                  },
                  {
                    unit: 'Jawatankuasa Kokurikulum & Sukan',
                    lead: 'Cikgu Lim Wei Ming',
                    load: '2 tugas',
                    status: 'Disemak',
                  },
                ].map((item) => (
                  <div
                    key={item.unit}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50/90 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-ink truncate">{item.unit}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.lead}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {item.load}
                      </span>
                      <span className="text-[10px] font-semibold text-forest bg-forest/10 px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Legal / Policy Modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">
                {legalModal === 'terms'
                  ? 'Terma Penggunaan LARAS OS'
                  : 'Dasar Privasi Data Sekolah'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="text-slate-400 hover:text-ink"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {legalModal === 'terms'
                ? 'LARAS OS disediakan khusus untuk kegunaan pengurusan pentadbiran, jawatankuasa, dan agihan tugas kakitangan sekolah. Pentadbir sekolah bertanggungjawab memastikan ketepatan maklumat staf dan kod sekolah yang didaftarkan.'
                : 'Semua rekod pentadbiran sekolah, direktori guru, dan maklumat akaun dilindungi menggunakan kawalan akses peringkat baris (RLS) mengikut sekolah masing-masing serta tidak dikongsi kepada pihak ketiga.'}
            </p>
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-1.5 bg-ink text-white rounded-lg text-xs font-semibold hover:opacity-90"
              >
                Faham
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}