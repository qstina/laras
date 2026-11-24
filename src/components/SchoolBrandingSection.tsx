import { useState } from 'react';
import { Upload, Image as ImageIcon, Palette, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type UploadableField =
  | 'logo_url'
  | 'cover_photo_url'
  | 'kpm_logo_url'
  | 'jpn_logo_url'
  | 'ppd_logo_url';

interface SchoolBrandingProps {
  schoolId: string;
  branding: {
    logo_url?: string;
    cover_photo_url?: string;
    kpm_logo_url?: string;
    jpn_logo_url?: string;
    ppd_logo_url?: string;
    primary_color?: string;
    accent_color?: string;
    motto?: string;
    slogan?: string;
    phone?: string;
    email?: string;
    school_song_lyrics?: string;
    school_song_url?: string;
  };
  onChange: (updated: Partial<SchoolBrandingProps['branding']>) => void;
}

export default function SchoolBrandingSection({
  schoolId,
  branding,
  onChange,
}: SchoolBrandingProps) {
  const [uploadingField, setUploadingField] = useState<UploadableField | null>(null);

  const handleImageUpload = async (file: File, field: UploadableField) => {
    if (!schoolId) return;
    if (!file.type.startsWith('image/')) {
      alert('Sila muat naik fail imej sahaja (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('Saiz imej melebihi had 4MB. Sila kecilkan saiz fail terlebih dahulu.');
      return;
    }

    setUploadingField(field);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${schoolId}/${field}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);

      onChange({ [field]: publicUrlData.publicUrl });
    } catch (err: any) {
      alert('Gagal memuat naik imej: ' + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const regionalSlots: Array<{ field: UploadableField; title: string; subtitle: string }> = [
    { field: 'kpm_logo_url', title: 'Logo KPM / Jata Negara', subtitle: 'Kementerian Pendidikan Malaysia' },
    { field: 'jpn_logo_url', title: 'Logo JPN Negeri', subtitle: 'Jabatan Pendidikan Negeri' },
    { field: 'ppd_logo_url', title: 'Logo PPD Daerah', subtitle: 'Pejabat Pendidikan Daerah' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-ink">
          Identiti Visual &amp; Aset Penerbitan Buku Pengurusan
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Logo, gambar sekolah, motto dan warna korporat di bawah akan diselaraskan secara automatik ke muka hadapan dan kandungan Book Builder.
        </p>
      </div>

      {/* Logo & School Building Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Official School Logo */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Lencana / Logo Rasmi Sekolah</span>
            {branding.logo_url && (
              <button
                type="button"
                onClick={() => onChange({ logo_url: '' })}
                className="text-[11px] text-rose hover:underline inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> Buang
              </button>
            )}
          </div>

          <div className="h-32 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden p-3">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Logo Sekolah"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon size={24} className="mx-auto mb-1 opacity-60" />
                <p className="text-[11px]">PNG telus latar disyorkan</p>
              </div>
            )}
          </div>

          <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
            {uploadingField === 'logo_url' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {branding.logo_url ? 'Tukar Logo Sekolah' : 'Muat Naik Logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 'logo_url');
              }}
            />
          </label>
        </div>

        {/* School Compound / Building Photograph */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">
              Gambar Bangunan / Kawasan Sekolah (Pilihan)
            </span>
            {branding.cover_photo_url && (
              <button
                type="button"
                onClick={() => onChange({ cover_photo_url: '' })}
                className="text-[11px] text-rose hover:underline inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> Buang
              </button>
            )}
          </div>

          <div className="h-32 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden">
            {branding.cover_photo_url ? (
              <img
                src={branding.cover_photo_url}
                alt="Foto Sekolah"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-400 px-4">
                <ImageIcon size={24} className="mx-auto mb-1 opacity-60" />
                <p className="text-[11px]">
                  Orientasi melintang (16:9). Jika tiada, muka hadapan tipografi korporat akan dijana.
                </p>
              </div>
            )}
          </div>

          <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
            {uploadingField === 'cover_photo_url' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {branding.cover_photo_url ? 'Tukar Gambar Sekolah' : 'Muat Naik Gambar Sekolah'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 'cover_photo_url');
              }}
            />
          </label>
        </div>
      </div>

      {/* Regional Crests (KPM / JPN / PPD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {regionalSlots.map((slot) => {
          const url = branding[slot.field];
          return (
            <div
              key={slot.field}
              className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{slot.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{slot.subtitle}</p>
                </div>
                {url && (
                  <button
                    type="button"
                    onClick={() => onChange({ [slot.field]: '' })}
                    className="text-[10px] text-rose hover:underline shrink-0"
                  >
                    Buang
                  </button>
                )}
              </div>

              <div className="h-20 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden p-2">
                {url ? (
                  <img src={url} alt={slot.title} className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon size={20} className="text-slate-300" />
                )}
              </div>

              <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-ink bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                {uploadingField === slot.field ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                {url ? 'Tukar' : 'Muat Naik'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, slot.field);
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>

      {/* Corporate Brand Colors & Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Warna Utama Sekolah
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <input
              type="color"
              value={branding.primary_color || '#1E3A8A'}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs font-mono text-slate-600 uppercase">
              {branding.primary_color || '#1E3A8A'}
            </span>
            <Palette size={13} className="ml-auto text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Warna Aksen / Sekunder
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <input
              type="color"
              value={branding.accent_color || '#D97706'}
              onChange={(e) => onChange({ accent_color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs font-mono text-slate-600 uppercase">
              {branding.accent_color || '#D97706'}
            </span>
            <Palette size={13} className="ml-auto text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            No. Telefon Rasmi
          </label>
          <input
            type="text"
            value={branding.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="cth: 082-123456"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Emel Rasmi Sekolah
          </label>
          <input
            type="email"
            value={branding.email || ''}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="cth: yee8101@moe.edu.my"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Motto, Slogan & School Song Lyrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Motto / Cogankata Sekolah
          </label>
          <input
            type="text"
            value={branding.motto || ''}
            onChange={(e) => onChange({ motto: e.target.value })}
            placeholder="cth: Berilmu, Berdisiplin, Berbakti"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Slogan / Tagline Sekolah
          </label>
          <input
            type="text"
            value={branding.slogan || ''}
            onChange={(e) => onChange({ slogan: e.target.value })}
            placeholder="cth: Together We Create A Legacy"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
            Lirik Lagu Sekolah (Untuk Bab Identiti Sekolah)
          </label>
          <textarea
            rows={4}
            value={branding.school_song_lyrics || ''}
            onChange={(e) => onChange({ school_song_lyrics: e.target.value })}
            placeholder="Masukkan rangkap penuh lagu sekolah di sini..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink resize-y"
          />
        </div>
      </div>
    </div>
  );
}