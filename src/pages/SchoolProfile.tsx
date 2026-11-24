import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Calendar, Check, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SchoolProfileRecord {
  id?: string;
  school_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  motto: string;
  vision: string;
  mission: string;
  current_session: string;
  fpk: string;
  school_song_url: string;
  logo_url: string;
  cover_config?: Record<string, any> | null;
}

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const STORAGE_BUCKET = 'school-assets';

function extractStoragePathFromUrl(publicUrl: string): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0]);
}

export default function SchoolProfile() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [profile, setProfile] = useState<SchoolProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Logo upload & preview states
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [isLogoMarkedRemoved, setIsLogoMarkedRemoved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userProfileError || !userProfile?.school_id) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const sid: string = userProfile.school_id;
        if (isMounted) setSchoolId(sid);

        // Fetch existing school_profile row scoped strictly to the user's school_id
        const { data: existingProfile, error: profileError } = await supabase
          .from('school_profile')
          .select('*')
          .eq('school_id', sid)
          .limit(1)
          .maybeSingle();

        // Also check schools table as fallback for initial school name/code if school_profile is empty
        let fallbackSchool: { name?: string; code?: string } | null = null;
        if (!existingProfile) {
          const { data: schoolRow } = await supabase
            .from('schools')
            .select('name, code')
            .eq('id', sid)
            .maybeSingle();
          fallbackSchool = schoolRow || null;
        }

        if (!isMounted) return;

        if (!profileError && existingProfile) {
          setProfile({
            id: existingProfile.id,
            school_id: existingProfile.school_id || sid,
            name: existingProfile.name || '',
            code: existingProfile.code || '',
            address: existingProfile.address || '',
            phone: existingProfile.phone || '',
            email: existingProfile.email || '',
            motto: existingProfile.motto || '',
            vision: existingProfile.vision || '',
            mission: existingProfile.mission || '',
            current_session: existingProfile.current_session || '2026/2027',
            fpk: existingProfile.fpk || '',
            school_song_url: existingProfile.school_song_url || '',
            logo_url: existingProfile.logo_url || '',
            cover_config: existingProfile.cover_config ?? null,
          });
        } else {
          setProfile({
            school_id: sid,
            name: fallbackSchool?.name || '',
            code: fallbackSchool?.code || '',
            address: '',
            phone: '',
            email: '',
            motto: '',
            vision: '',
            mission: '',
            current_session: '2026/2027',
            fpk: '',
            school_song_url: '',
            logo_url: '',
            cover_config: null,
          });
        }
      } catch (err) {
        console.error('Ralat memuatkan profil sekolah:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Revoke local object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Format fail tidak disokong. Sila pilih fail PNG, JPG, WEBP atau SVG.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError('Saiz fail melebihi had 2MB. Sila kecilkan saiz logo terlebih dahulu.');
      e.target.value = '';
      return;
    }

    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedLogoFile(file);
    setLogoPreviewUrl(objectUrl);
    setIsLogoMarkedRemoved(false);
  };

  const handleRemoveLogo = () => {
    setLogoError(null);
    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setSelectedLogoFile(null);
    setLogoPreviewUrl('');
    setIsLogoMarkedRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!profile || !schoolId) {
      alert('Sesi pengguna atau ID sekolah tidak ditemui. Sila log masuk semula.');
      return;
    }

    const trimmedName = (profile.name || '').trim();
    if (!trimmedName) {
      alert('Sila masukkan Nama Sekolah Rasmi sebelum menyimpan.');
      return;
    }

    const trimmedSongUrl = (profile.school_song_url || '').trim();
    if (trimmedSongUrl && !/^https?:\/\/.+/i.test(trimmedSongUrl)) {
      alert('URL Pautan Lagu Sekolah mestilah bermula dengan http:// atau https://');
      return;
    }

    setIsSaving(true);
    setLogoError(null);

    const previousLogoUrl = profile.logo_url || '';
    let finalLogoUrl = isLogoMarkedRemoved ? '' : previousLogoUrl;
    let newlyUploadedPath: string | null = null;

    try {
      // 1. Upload staged logo file to Supabase Storage if a new file was selected
      if (selectedLogoFile) {
        const rawExt = selectedLogoFile.name.split('.').pop()?.toLowerCase() || 'png';
        const safeExt = rawExt.replace(/[^a-z0-9]/g, '') || 'png';
        const filePath = `${schoolId}/logo_${Date.now()}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, selectedLogoFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: selectedLogoFile.type,
          });

        if (uploadError) {
          throw new Error(`Gagal memuat naik logo sekolah: ${uploadError.message}`);
        }

        newlyUploadedPath = filePath;
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrlData.publicUrl;
      }

      // 2. Check existing record by ID or school_id to prevent duplicate school_profile rows
      let existingId = profile.id || null;
      let existingCoverConfig = profile.cover_config ?? null;

      if (!existingId) {
        const { data: foundRow } = await supabase
          .from('school_profile')
          .select('id, cover_config')
          .eq('school_id', schoolId)
          .limit(1)
          .maybeSingle();

        if (foundRow?.id) {
          existingId = foundRow.id;
          existingCoverConfig = foundRow.cover_config ?? existingCoverConfig;
        }
      }

      // Synchronise cover_config metadata if already configured (without touching book_draft)
      const syncedCoverConfig =
        existingCoverConfig && typeof existingCoverConfig === 'object'
          ? {
              ...existingCoverConfig,
              schoolName: trimmedName,
              schoolCode: (profile.code || '').trim().toUpperCase(),
              schoolAddress: (profile.address || '').trim(),
              session: profile.current_session || '2026/2027',
              logo_url: finalLogoUrl,
            }
          : undefined;

      const basePayload: Record<string, any> = {
        name: trimmedName,
        code: (profile.code || '').trim().toUpperCase(),
        address: (profile.address || '').trim(),
        phone: (profile.phone || '').trim(),
        email: (profile.email || '').trim(),
        motto: (profile.motto || '').trim(),
        vision: (profile.vision || '').trim(),
        mission: (profile.mission || '').trim(),
        current_session: profile.current_session || '2026/2027',
        fpk: (profile.fpk || '').trim(),
        school_song_url: trimmedSongUrl,
        logo_url: finalLogoUrl,
      };

      if (syncedCoverConfig !== undefined) {
        basePayload.cover_config = syncedCoverConfig;
      }

      // Helper that gracefully retries if an optional column is not present in the DB schema
      const executeWrite = async (payloadToWrite: Record<string, any>) => {
        const workingPayload = { ...payloadToWrite };
        for (let attempt = 0; attempt < 5; attempt++) {
          const response = existingId
            ? await supabase
                .from('school_profile')
                .update(workingPayload)
                .eq('id', existingId)
                .eq('school_id', schoolId)
                .select()
                .maybeSingle()
            : await supabase
                .from('school_profile')
                .insert({ school_id: schoolId, ...workingPayload })
                .select()
                .maybeSingle();

          if (!response.error) {
            return response.data;
          }

          const missingColMatch = response.error.message?.match(
            /Could not find the '([^']+)' column/i
          );
          if (missingColMatch && missingColMatch[1] in workingPayload) {
            delete workingPayload[missingColMatch[1]];
            continue;
          }

          throw response.error;
        }
        return null;
      };

      const savedRow = await executeWrite(basePayload);

      // 3. Clean up superseded or removed logo file in Supabase Storage (only inside this school's folder)
      const oldStoragePath = extractStoragePathFromUrl(previousLogoUrl);
      if (
        oldStoragePath &&
        oldStoragePath.startsWith(`${schoolId}/`) &&
        oldStoragePath !== newlyUploadedPath &&
        (isLogoMarkedRemoved || Boolean(newlyUploadedPath))
      ) {
        await supabase.storage.from(STORAGE_BUCKET).remove([oldStoragePath]);
      }

      // 4. Reload / synchronise local state with persisted database values
      const mergedProfile: SchoolProfileRecord = {
        id: savedRow?.id || existingId || undefined,
        school_id: savedRow?.school_id || schoolId,
        name: savedRow?.name ?? basePayload.name,
        code: savedRow?.code ?? basePayload.code,
        address: savedRow?.address ?? basePayload.address,
        phone: savedRow?.phone ?? basePayload.phone,
        email: savedRow?.email ?? basePayload.email,
        motto: savedRow?.motto ?? basePayload.motto,
        vision: savedRow?.vision ?? basePayload.vision,
        mission: savedRow?.mission ?? basePayload.mission,
        current_session: savedRow?.current_session ?? basePayload.current_session,
        fpk: savedRow?.fpk ?? basePayload.fpk,
        school_song_url: savedRow?.school_song_url ?? basePayload.school_song_url,
        logo_url: savedRow?.logo_url ?? finalLogoUrl,
        cover_config: savedRow?.cover_config ?? syncedCoverConfig ?? existingCoverConfig,
      };

      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      setSelectedLogoFile(null);
      setLogoPreviewUrl('');
      setIsLogoMarkedRemoved(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setProfile(mergedProfile);
      alert('Profil sekolah berjaya dikemaskini!');
    } catch (err: any) {
      // Roll back newly uploaded file if DB save failed so orphaned files aren't left behind
      if (newlyUploadedPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([newlyUploadedPath]);
      }
      alert('Gagal menyimpan profil: ' + (err?.message || 'Ralat tidak dijangka.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
          <p className="text-sm font-medium">Memuatkan Profil Sekolah...</p>
        </div>
      </div>
    );
  }

  const displayedLogoUrl = isLogoMarkedRemoved
    ? ''
    : logoPreviewUrl || profile?.logo_url || '';

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Profil Sekolah & Identiti
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Maklumat asas ini diguna pakai di seluruh sistem dan Buku Pengurusan.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="space-y-4 lg:space-y-6">
          <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-ink">Sesi Akademik Semasa</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky/10 border border-sky/20 text-sky flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={profile?.current_session || '2026/2027'}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, current_session: e.target.value } : prev
                    )
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all cursor-pointer"
                >
                  <option value="2026/2027">Sesi 2026/2027 (Aktif)</option>
                  <option value="2025/2026">Sesi 2025/2026 (Arkib)</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Menukar sesi akademik akan memaparkan data yang berkaitan dengan tahun tersebut.
            </p>
          </div>

          <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-ink">Logo Sekolah</h3>
              {displayedLogoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isSaving}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Buang Logo
                </button>
              )}
            </div>

            <div className="w-full h-36 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center p-4 overflow-hidden">
              {displayedLogoUrl ? (
                <img
                  src={displayedLogoUrl}
                  alt="Logo Rasmi Sekolah"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-center text-slate-400">
                  <ImageIcon size={24} className="mb-1.5 opacity-60" />
                  <span className="text-xs font-medium text-slate-500">Tiada logo dimuat naik</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    PNG latar telus disyorkan (Maks. 2MB)
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="w-full bg-white hover:bg-slate-50 text-ink border border-slate-200 rounded-lg font-medium h-9 px-3.5 text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
              >
                <Upload size={14} />
                {displayedLogoUrl ? 'Tukar Logo Sekolah' : 'Muat Naik Logo'}
              </button>
            </div>

            {selectedLogoFile && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                Pratonton logo baharu dipilih ({selectedLogoFile.name}). Klik{' '}
                <span className="font-semibold">Simpan Perubahan</span> untuk menyimpan ke storan.
              </p>
            )}

            {isLogoMarkedRemoved && !selectedLogoFile && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 leading-relaxed">
                Logo ditandakan untuk dibuang. Klik{' '}
                <span className="font-semibold">Simpan Perubahan</span> untuk mengesahkan.
              </p>
            )}

            {logoError && (
              <p className="text-[11px] text-rose-600 font-medium leading-relaxed">{logoError}</p>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Logo ini dipaparkan secara automatik pada Dashboard, muka hadapan Book Builder, serta
              cetakan DOCX dan PDF.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 space-y-5">
            <h3 className="text-base font-semibold text-ink">Maklumat Institusi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nama Sekolah Rasmi
                </label>
                <input
                  type="text"
                  value={profile?.name || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kod Sekolah
                </label>
                <input
                  type="text"
                  value={profile?.code || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, code: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all uppercase"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Alamat Rasmi Sekolah
                </label>
                <textarea
                  rows={2}
                  value={profile?.address || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, address: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all resize-none"
                ></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  No. Telefon Rasmi
                </label>
                <input
                  type="text"
                  value={profile?.phone || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, phone: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Emel Rasmi Sekolah
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, email: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Motto / Cogankata Sekolah
                </label>
                <input
                  type="text"
                  value={profile?.motto || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, motto: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 space-y-5">
              <h3 className="text-base font-semibold text-ink">Falsafah, Visi & Misi</h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Falsafah Pendidikan Kebangsaan
                </label>
                <textarea
                  rows={3}
                  value={profile?.fpk || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, fpk: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all resize-none"
                ></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Visi Sekolah
                </label>
                <input
                  type="text"
                  value={profile?.vision || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, vision: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Misi Sekolah
                </label>
                <textarea
                  rows={2}
                  value={profile?.mission || ''}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, mission: e.target.value } : prev))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all resize-none"
                ></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  URL Pautan Lagu Sekolah (Audio/Video)
                </label>
                <input
                  type="url"
                  value={profile?.school_song_url || ''}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, school_song_url: e.target.value } : prev
                    )
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}