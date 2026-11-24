import React, { useState } from 'react';
import {
  X,
  Palette,
  Image as ImageIcon,
  Type,
  LayoutTemplate,
  Upload,
  Trash2,
  Loader2,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  type AssetFieldKey,
  CORPORATE_COLOR_PRESETS,
  COVER_TEMPLATE_META,
  CoverCanvas,
  type CoverConfig,
  type CoverTemplateId,
} from './coverTemplates';

interface CoverDesignerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  config: CoverConfig;
  onChange: (nextConfig: CoverConfig) => void;
  onPersistAssetsToProfile: (partialProfile: Record<string, any>) => Promise<void>;
  focusedAssetField?: AssetFieldKey | null;
}

const ASSET_SLOTS: Array<{ key: AssetFieldKey; label: string; hint: string }> = [
  { key: 'logo_url', label: 'Logo Rasmi Sekolah', hint: 'Lencana sekolah (PNG telus latar disyorkan)' },
  { key: 'kpm_logo_url', label: 'Logo KPM / Jata Negara', hint: 'Kementerian Pendidikan Malaysia' },
  { key: 'jpn_logo_url', label: 'Logo JPN Negeri', hint: 'Jabatan Pendidikan Negeri' },
  { key: 'ppd_logo_url', label: 'Logo PPD Daerah', hint: 'Pejabat Pendidikan Daerah' },
  { key: 'cover_photo_url', label: 'Gambar Bangunan / Kawasan Sekolah', hint: 'Orientasi melintang (16:9)' },
];

export const CoverDesignerDrawer: React.FC<CoverDesignerDrawerProps> = ({
  isOpen,
  onClose,
  schoolId,
  config,
  onChange,
  onPersistAssetsToProfile,
  focusedAssetField,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'assets' | 'colors' | 'text'>(
    focusedAssetField ? 'assets' : 'template'
  );
  const [uploadingKey, setUploadingKey] = useState<AssetFieldKey | null>(null);

  React.useEffect(() => {
    if (focusedAssetField) setActiveTab('assets');
  }, [focusedAssetField]);

  if (!isOpen) return null;

  const updateField = <K extends keyof CoverConfig>(key: K, value: CoverConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleSelectTemplate = (templateId: CoverTemplateId) => {
    onChange({ ...config, templateId });
  };

  const handleUploadAsset = async (file: File, field: AssetFieldKey) => {
    if (!schoolId) {
      alert('ID sekolah tidak ditemui. Sila pastikan profil sekolah telah didaftarkan.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej sahaja (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Saiz imej melebihi had 5MB.');
      return;
    }

    setUploadingKey(field);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${schoolId}/${field}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const nextConfig = { ...config, [field]: publicUrl };
      onChange(nextConfig);
      await onPersistAssetsToProfile({ [field]: publicUrl });
    } catch (err: any) {
      alert('Gagal memuat naik aset: ' + (err?.message || 'Ralat storan'));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveAsset = async (field: AssetFieldKey) => {
    const nextConfig = { ...config, [field]: '' };
    onChange(nextConfig);
    await onPersistAssetsToProfile({ [field]: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/50 backdrop-blur-[1px]">
      {/* Left Control Panel */}
      <div className="w-full max-w-md bg-white h-full border-r border-slate-200 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-ink">Pereka Muka Hadapan & Gaya Penerbitan</h2>
            <p className="text-[11px] text-slate-500">
              Pilih 5 templat rasmi, muat naik logo & laraskan tipografi buku
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-white text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'template'
                ? 'border-ink text-ink bg-slate-50/70'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            <LayoutTemplate size={14} /> Templat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'assets'
                ? 'border-ink text-ink bg-slate-50/70'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            <ImageIcon size={14} /> Logo & Foto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'colors'
                ? 'border-ink text-ink bg-slate-50/70'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            <Palette size={14} /> Warna & Gaya
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-ink text-ink bg-slate-50/70'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            <Type size={14} /> Teks
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: TEMPLATES (ALL 5 OPTIONS) */}
          {activeTab === 'template' && (
            <div className="space-y-3">
              {COVER_TEMPLATE_META.map((tpl) => {
                const selected = config.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selected
                        ? 'border-ink bg-slate-50 ring-2 ring-ink/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink">{tpl.name}</span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{tpl.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[10px] text-slate-400">Cadangan warna:</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({
                            ...config,
                            templateId: tpl.id,
                            primaryColor: tpl.recommendedPrimary,
                            accentColor: tpl.recommendedAccent,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-medium hover:bg-slate-50"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tpl.recommendedPrimary }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tpl.recommendedAccent }}
                        />
                        Guna Palet Ini
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: LOGOS & PHOTOGRAPH */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-ink">Papar Slot Logo KPM / JPN / PPD</p>
                  <p className="text-[10px] text-slate-500">
                    Sembunyikan jika mahu guna logo sekolah sahaja
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showRegionalLogos}
                  onChange={(e) => updateField('showRegionalLogos', e.target.checked)}
                  className="w-4 h-4 accent-ink cursor-pointer"
                />
              </div>

              {ASSET_SLOTS.map((slot) => {
                if (
                  !config.showRegionalLogos &&
                  ['kpm_logo_url', 'jpn_logo_url', 'ppd_logo_url'].includes(slot.key)
                ) {
                  return null;
                }
                const currentUrl = config[slot.key];
                const isHighlighted = focusedAssetField === slot.key;

                return (
                  <div
                    key={slot.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHighlighted
                        ? 'border-sky bg-sky/5 ring-2 ring-sky/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-ink">{slot.label}</p>
                        <p className="text-[10px] text-slate-500">{slot.hint}</p>
                      </div>
                      {currentUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAsset(slot.key)}
                          className="text-[11px] text-rose hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Buang
                        </button>
                      )}
                    </div>

                    {currentUrl && (
                      <div className="h-24 mb-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                        <img
                          src={currentUrl}
                          alt={slot.label}
                          className={
                            slot.key === 'cover_photo_url'
                              ? 'w-full h-full object-cover rounded'
                              : 'max-h-full max-w-full object-contain'
                          }
                        />
                      </div>
                    )}

                    <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                      {uploadingKey === slot.key ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {currentUrl ? 'Tukar Imej' : `Muat Naik ${slot.label}`}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAsset(file, slot.key);
                        }}
                      />
                    </label>

                    {/* Cropping & Framing Controls for School Photo */}
                    {slot.key === 'cover_photo_url' && currentUrl && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <SlidersHorizontal size={12} /> Pelarasan Bingkai Foto
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Zum Foto</span>
                            <span>{config.photoZoom}%</span>
                          </div>
                          <input
                            type="range"
                            min={100}
                            max={150}
                            value={config.photoZoom}
                            onChange={(e) => updateField('photoZoom', Number(e.target.value))}
                            className="w-full accent-ink"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Posisi Menegak</span>
                            <span>{config.photoOffsetY}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={config.photoOffsetY}
                            onChange={(e) => updateField('photoOffsetY', Number(e.target.value))}
                            className="w-full accent-ink"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: COLORS, TYPOGRAPHY & STRUCTURE */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-ink mb-2">Palet Warna Korporat Pratetap</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CORPORATE_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          primaryColor: preset.primary,
                          accentColor: preset.accent,
                        })
                      }
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-ink text-left bg-white transition-colors"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Warna Utama (HEX)
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 bg-white">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value.toUpperCase())}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-full text-xs font-mono uppercase outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Warna Aksen (HEX)
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 bg-white">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value.toUpperCase())}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-full text-xs font-mono uppercase outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Inner Page Typography & Table Style */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-ink">Tipografi &amp; Gaya Jadual Halaman Dalam</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Fon Tajuk &amp; Bab
                    </label>
                    <select
                      value={config.headingFont || 'Arial'}
                      onChange={(e) => updateField('headingFont', e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-ink"
                    >
                      <option value="Arial">Arial (Moden Korporat)</option>
                      <option value="Georgia">Georgia (Editorial Klasik)</option>
                      <option value="Tahoma">Tahoma (Tegas &amp; Kemas)</option>
                      <option value="Times New Roman">Times New Roman (Rasmi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Fon Teks Kandungan
                    </label>
                    <select
                      value={config.bodyFont || 'Arial'}
                      onChange={(e) => updateField('bodyFont', e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-ink"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Gaya Jadual &amp; Direktori
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'corporate-tint', label: 'Korporat Berwarna' },
                      { id: 'classic-grid', label: 'Grid Rasmi' },
                      { id: 'minimal-lines', label: 'Garis Minimalis' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateField('tableStyle', opt.id as any)}
                        className={`py-2 px-2 rounded-lg border text-[11px] font-semibold text-center transition-colors ${
                          (config.tableStyle || 'corporate-tint') === opt.id
                            ? 'border-ink bg-slate-100 text-ink'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Publication Structure Controls */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <p className="text-xs font-bold text-ink">Struktur Penerbitan &amp; Penomboran</p>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
                  <div>
                    <p className="text-[11px] font-semibold text-ink">Halaman Pemisah Bahagian Utama</p>
                    <p className="text-[10px] text-slate-500">
                      Sisip halaman pembuka korporat sebelum setiap bahagian utama
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableSectionDividers ?? true}
                    onChange={(e) => updateField('enableSectionDividers', e.target.checked)}
                    className="w-4 h-4 accent-ink"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
                  <div>
                    <p className="text-[11px] font-semibold text-ink">Pengepala &amp; Pengaki Halaman</p>
                    <p className="text-[10px] text-slate-500">
                      Papar nama sekolah, sesi &amp; nombor halaman pada cetakan/PDF/DOCX
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showRunningHeaders ?? true}
                    onChange={(e) => updateField('showRunningHeaders', e.target.checked)}
                    className="w-4 h-4 accent-ink"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
                  <div>
                    <p className="text-[11px] font-semibold text-ink">Angka Romawi Halaman Awal (i, ii, iii)</p>
                    <p className="text-[10px] text-slate-500">
                      Gunakan i, ii, iii untuk Kandungan &amp; Identiti; 1, 2, 3 untuk isi utama
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.romanPreliminaries ?? true}
                    onChange={(e) => updateField('romanPreliminaries', e.target.checked)}
                    className="w-4 h-4 accent-ink"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: TEXT FIELDS */}
          {activeTab === 'text' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Baris Kementerian / Jabatan
                </label>
                <input
                  type="text"
                  value={config.kpmLabel}
                  onChange={(e) => updateField('kpmLabel', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={config.schoolName}
                  onChange={(e) => updateField('schoolName', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tajuk Utama Dokumen
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sesi Akademik / Tahun
                </label>
                <input
                  type="text"
                  value={config.session}
                  onChange={(e) => updateField('session', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Subtajuk / Bidang Pengurusan
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Motto Sekolah
                </label>
                <input
                  type="text"
                  value={config.motto}
                  onChange={(e) => updateField('motto', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Alamat Rasmi
                </label>
                <textarea
                  rows={2}
                  value={config.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Kod Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.schoolCode}
                    onChange={(e) => updateField('schoolCode', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    No. Telefon
                  </label>
                  <input
                    type="text"
                    value={config.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Emel
                  </label>
                  <input
                    type="text"
                    value={config.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-ink"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Apply Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg bg-ink text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Selesai &amp; Terapkan ke Buku
          </button>
        </div>
      </div>

      {/* Right Live Full-Scale Preview */}
      <div className="flex-1 overflow-auto p-6 lg:p-8 flex items-start justify-center bg-slate-800/40">
        <div className="w-[210mm] min-h-[297mm] shrink-0 bg-white shadow-2xl rounded-sm overflow-hidden">
          <CoverCanvas
            config={config}
            onAssetClick={(field) => {
              setActiveTab('assets');
              void field;
            }}
          />
        </div>
      </div>
    </div>
  );
};