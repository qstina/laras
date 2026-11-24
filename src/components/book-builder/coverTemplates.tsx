import React from 'react';
import { ImagePlus, Building2, ShieldCheck, Pencil } from 'lucide-react';

export type CoverTemplateId =
  | 'corporate-diagonal'
  | 'editorial-minimal'
  | 'executive-dark'
  | 'photo-showcase'
  | 'crest-classic';

export type AssetFieldKey =
  | 'kpm_logo_url'
  | 'jpn_logo_url'
  | 'ppd_logo_url'
  | 'logo_url'
  | 'cover_photo_url';

export type HeadingFontOption = 'Arial' | 'Georgia' | 'Tahoma' | 'Times New Roman';
export type BodyFontOption = 'Arial' | 'Verdana' | 'Tahoma' | 'Georgia';
export type TableStyleOption = 'corporate-tint' | 'classic-grid' | 'minimal-lines';

export interface CoverConfig {
  templateId: CoverTemplateId;
  primaryColor: string;
  accentColor: string;
  kpmLabel: string;
  title: string;
  subtitle: string;
  session: string;
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  motto: string;
  kpm_logo_url: string;
  jpn_logo_url: string;
  ppd_logo_url: string;
  logo_url: string;
  cover_photo_url: string;
  photoZoom: number;
  photoOffsetY: number;
  showRegionalLogos: boolean;
  headingFont: HeadingFontOption;
  bodyFont: BodyFontOption;
  tableStyle: TableStyleOption;
  enableSectionDividers: boolean;
  showRunningHeaders: boolean;
  romanPreliminaries: boolean;
}

export const COVER_TEMPLATE_META: Array<{
  id: CoverTemplateId;
  name: string;
  subtitle: string;
  recommendedPrimary: string;
  recommendedAccent: string;
}> = [
  {
    id: 'corporate-diagonal',
    name: 'Pilihan A: Korporat & Fotografi Kampus',
    subtitle: 'Blok geometri sudut dengan bingkai foto sekolah & lencana rasmi',
    recommendedPrimary: '#1E3A8A',
    recommendedAccent: '#D97706',
  },
  {
    id: 'editorial-minimal',
    name: 'Pilihan B: Editorial Bersih & Rasmi',
    subtitle: 'Susun atur penerbitan cerah dengan reben bucu & tipografi bertingkat',
    recommendedPrimary: '#0F172A',
    recommendedAccent: '#0F766E',
  },
  {
    id: 'executive-dark',
    name: 'Pilihan C: Eksekutif Blok Warna Penuh',
    subtitle: 'Latar warna penuh berprestij dengan corak geometri & aksen keemasan',
    recommendedPrimary: '#1E1B4B',
    recommendedAccent: '#EAB308',
  },
  {
    id: 'photo-showcase',
    name: 'Pilihan D: Fokus Bangunan Sekolah',
    subtitle: 'Paparan lebar gambar sekolah dengan kad tajuk moden di bahagian bawah',
    recommendedPrimary: '#14532D',
    recommendedAccent: '#16A34A',
  },
  {
    id: 'crest-classic',
    name: 'Pilihan E: Klasik Rasmi & Lencana Berbingkai',
    subtitle: 'Bingkai protokol KPM berganda dengan fokus lencana rasmi & plak tajuk',
    recommendedPrimary: '#7F1D1D',
    recommendedAccent: '#D97706',
  },
];

export const CORPORATE_COLOR_PRESETS = [
  { name: 'Biru Diraja & Emas', primary: '#1E3A8A', accent: '#D97706' },
  { name: 'Zamrud & Teal', primary: '#064E3B', accent: '#0D9488' },
  { name: 'Indigo Gelap & Amber', primary: '#1E1B4B', accent: '#F59E0B' },
  { name: 'Merah Marun & Emas', primary: '#7F1D1D', accent: '#D97706' },
  { name: 'Arang Korporat & Biru Langit', primary: '#0F172A', accent: '#0284C7' },
  { name: 'Ungu Akademik & Perak', primary: '#3B0764', accent: '#9333EA' },
];

export function getContrastText(hexColor: string): string {
  const clean = (hexColor || '#1E293B').replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0F172A' : '#FFFFFF';
}

export function buildDefaultCoverConfig(profile: any): CoverConfig {
  const saved = profile?.cover_config || {};
  const tpl: CoverTemplateId = saved.templateId || 'corporate-diagonal';
  return {
    templateId: tpl,
    primaryColor: saved.primaryColor || profile?.primary_color || '#1E3A8A',
    accentColor: saved.accentColor || profile?.accent_color || '#D97706',
    kpmLabel: saved.kpmLabel || 'KEMENTERIAN PENDIDIKAN MALAYSIA',
    title: saved.title || 'BUKU PENGURUSAN SEKOLAH',
    subtitle: saved.subtitle || 'PENTADBIRAN • KURIKULUM • HAL EHWAL MURID • KOKURIKULUM',
    session: saved.session || `SESI AKADEMIK ${profile?.current_session || '2026/2027'}`,
    schoolName: saved.schoolName || profile?.name || 'NAMA SEKOLAH',
    schoolCode: saved.schoolCode || profile?.code || '',
    address: saved.address || profile?.address || '',
    phone: saved.phone || profile?.phone || '',
    email: saved.email || profile?.email || '',
    motto: saved.motto || profile?.motto || '',
    kpm_logo_url: profile?.kpm_logo_url || saved.kpm_logo_url || '',
    jpn_logo_url: profile?.jpn_logo_url || saved.jpn_logo_url || '',
    ppd_logo_url: profile?.ppd_logo_url || saved.ppd_logo_url || '',
    logo_url: profile?.logo_url || saved.logo_url || '',
    cover_photo_url: profile?.cover_photo_url || saved.cover_photo_url || '',
    photoZoom: saved.photoZoom || 100,
    photoOffsetY: saved.photoOffsetY ?? 50,
    showRegionalLogos: saved.showRegionalLogos ?? true,
    headingFont:
      saved.headingFont ||
      (tpl === 'editorial-minimal' || tpl === 'crest-classic' ? 'Georgia' : 'Arial'),
    bodyFont: saved.bodyFont || 'Arial',
    tableStyle:
      saved.tableStyle ||
      (tpl === 'editorial-minimal'
        ? 'minimal-lines'
        : tpl === 'crest-classic'
        ? 'classic-grid'
        : 'corporate-tint'),
    enableSectionDividers: saved.enableSectionDividers ?? true,
    showRunningHeaders: saved.showRunningHeaders ?? true,
    romanPreliminaries: saved.romanPreliminaries ?? true,
  };
}

interface LogoSlotProps {
  url: string;
  label: string;
  field: AssetFieldKey;
  darkBg?: boolean;
  sizeClass?: string;
  onAssetClick?: (field: AssetFieldKey) => void;
}

function LogoSlot({
  url,
  label,
  field,
  darkBg = false,
  sizeClass = 'h-14 w-14',
  onAssetClick,
}: LogoSlotProps) {
  if (url) {
    return (
      <button
        type="button"
        onClick={() => onAssetClick?.(field)}
        title={`Klik untuk tukar atau buang (${label})`}
        className={`group relative ${sizeClass} flex items-center justify-center rounded-lg transition-transform hover:scale-105 focus:outline-none`}
      >
        <img src={url} alt={label} className="max-h-full max-w-full object-contain drop-shadow-sm" />
        <span className="print:hidden opacity-0 group-hover:opacity-100 absolute -bottom-2 bg-slate-900/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow transition-opacity whitespace-nowrap">
          Tukar
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onAssetClick?.(field)}
      className={`print:hidden ${sizeClass} px-2 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
        darkBg
          ? 'border-white/35 bg-white/10 text-white/80 hover:bg-white/20 hover:border-white'
          : 'border-slate-300 bg-slate-50/90 text-slate-500 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <ImagePlus size={14} className="shrink-0 opacity-80" />
      <span className="text-[8.5px] font-semibold leading-tight">{label}</span>
    </button>
  );
}

interface CoverCanvasProps {
  config: CoverConfig;
  onAssetClick?: (field: AssetFieldKey) => void;
  onOpenEditor?: () => void;
  compactPreview?: boolean;
}

export const CoverCanvas: React.FC<CoverCanvasProps> = ({
  config,
  onAssetClick,
  onOpenEditor,
  compactPreview = false,
}) => {
  const primary = config.primaryColor || '#1E3A8A';
  const accent = config.accentColor || '#D97706';
  const primaryText = getContrastText(primary);
  const accentText = getContrastText(accent);

  const contactLine = [
    config.schoolCode ? `Kod Sekolah: ${config.schoolCode}` : '',
    config.phone ? `Tel: ${config.phone}` : '',
    config.email ? `Emel: ${config.email}` : '',
  ]
    .filter(Boolean)
    .join('   •   ');

  const renderCrestRow = (darkBg = false, schoolLogoSize = 'h-16 w-16') => (
    <div className="flex flex-wrap items-center justify-center gap-3.5">
      {config.showRegionalLogos && (
        <>
          <LogoSlot
            url={config.kpm_logo_url}
            label="Tambah Logo KPM"
            field="kpm_logo_url"
            darkBg={darkBg}
            sizeClass="h-13 w-14"
            onAssetClick={onAssetClick}
          />
          <LogoSlot
            url={config.jpn_logo_url}
            label="Tambah Logo JPN"
            field="jpn_logo_url"
            darkBg={darkBg}
            sizeClass="h-13 w-14"
            onAssetClick={onAssetClick}
          />
          <LogoSlot
            url={config.ppd_logo_url}
            label="Tambah Logo PPD"
            field="ppd_logo_url"
            darkBg={darkBg}
            sizeClass="h-13 w-14"
            onAssetClick={onAssetClick}
          />
        </>
      )}
      <LogoSlot
        url={config.logo_url}
        label="Tambah Logo Sekolah"
        field="logo_url"
        darkBg={darkBg}
        sizeClass={schoolLogoSize}
        onAssetClick={onAssetClick}
      />
    </div>
  );

  const renderPhotoBox = (heightClass: string, darkBg = false) => {
    if (config.cover_photo_url) {
      return (
        <div
          onClick={() => onAssetClick?.('cover_photo_url')}
          title="Klik untuk tukar atau laraskan gambar sekolah"
          className={`group relative w-full ${heightClass} overflow-hidden cursor-pointer`}
        >
          <img
            src={config.cover_photo_url}
            alt="Gambar Bangunan Sekolah"
            className="w-full h-full object-cover transition-transform duration-200"
            style={{
              objectPosition: `center ${config.photoOffsetY}%`,
              transform: `scale(${(config.photoZoom || 100) / 100})`,
            }}
          />
          <div className="print:hidden opacity-0 group-hover:opacity-100 absolute inset-0 bg-slate-900/45 flex items-center justify-center transition-opacity">
            <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5">
              <Pencil size={13} /> Tukar / Laras Gambar Sekolah
            </span>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onAssetClick?.('cover_photo_url')}
        className={`print:hidden w-full ${heightClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 px-6 text-center transition-all cursor-pointer ${
          darkBg
            ? 'border-white/30 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white'
            : 'border-slate-300 bg-slate-50/80 text-slate-500 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <Building2 size={26} className="opacity-75" />
        <div>
          <p className="text-xs font-bold">Tambah Gambar Sekolah</p>
          <p className="text-[10px] opacity-75 mt-0.5">
            Klik untuk muat naik foto bangunan atau kawasan sekolah (ruang ini disembunyikan semasa cetakan jika kosong)
          </p>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`relative w-full h-[297mm] bg-white overflow-hidden select-none flex flex-col justify-between ${
        compactPreview ? 'pointer-events-none' : ''
      }`}
    >
      {/* Floating Quick-Edit Pill on Hover (hidden when printing) */}
      {!compactPreview && onOpenEditor && (
        <button
          type="button"
          onClick={onOpenEditor}
          className="print:hidden absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Pencil size={13} /> Ubah Suai Muka Hadapan
        </button>
      )}

      {/* =====================================================================
          TEMPLATE A: KORPORAT DIAGONAL & FOTOGRAFI KAMPUS
         ===================================================================== */}
      {config.templateId === 'corporate-diagonal' && (
        <>
          <div className="relative">
            <div
              className="pt-11 pb-14 px-14 relative overflow-hidden"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              <div
                className="absolute -right-16 -top-16 w-64 h-64 rotate-45 opacity-25"
                style={{ backgroundColor: accent }}
              />
              <div
                className="absolute left-0 bottom-0 h-2.5 w-full"
                style={{ backgroundColor: accent }}
              />

              <p className="text-center text-[10pt] font-bold tracking-[0.2em] uppercase opacity-90 mb-5">
                {config.kpmLabel}
              </p>

              <div className="bg-white/95 rounded-2xl py-3.5 px-6 shadow-md max-w-xl mx-auto">
                {renderCrestRow(false, 'h-15 w-15')}
              </div>

              <div className="text-center mt-6">
                <h2 className="text-[17pt] font-extrabold tracking-wide uppercase leading-snug">
                  {config.schoolName}
                </h2>
                {config.motto && (
                  <p className="text-[10pt] italic opacity-90 mt-1">&ldquo;{config.motto}&rdquo;</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-14 my-auto py-6 flex flex-col gap-6">
            <div className="border-l-[6px] pl-6 py-1" style={{ borderColor: accent }}>
              <span
                className="inline-block px-3.5 py-1 rounded text-[10pt] font-extrabold tracking-widest uppercase mb-3"
                style={{ backgroundColor: accent, color: accentText }}
              >
                {config.session}
              </span>
              <h1
                className="text-[30pt] font-black leading-[1.08] tracking-tight uppercase"
                style={{ color: primary }}
              >
                {config.title}
              </h1>
              {config.subtitle && (
                <p className="text-[9.5pt] font-semibold tracking-[0.14em] text-slate-500 uppercase mt-3">
                  {config.subtitle}
                </p>
              )}
            </div>

            <div
              className={`rounded-2xl overflow-hidden ${
                config.cover_photo_url ? 'border-[3px] shadow-sm' : 'print:hidden'
              }`}
              style={{ borderColor: primary }}
            >
              {renderPhotoBox('h-[66mm]', false)}
            </div>
          </div>

          <div className="px-14 pb-10">
            <div className="border-t-2 pt-4 text-center" style={{ borderColor: primary }}>
              {config.address && (
                <p className="text-[9.5pt] font-bold text-slate-800 uppercase">{config.address}</p>
              )}
              {contactLine && <p className="text-[8.5pt] text-slate-500 mt-1">{contactLine}</p>}
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          TEMPLATE B: EDITORIAL MINIMALIS & LENCANA RASMI
         ===================================================================== */}
      {config.templateId === 'editorial-minimal' && (
        <>
          <div className="relative pt-14 px-16">
            <div
              className="absolute top-0 left-0 w-44 h-4"
              style={{ backgroundColor: primary }}
            />
            <div
              className="absolute top-0 left-44 w-20 h-4"
              style={{ backgroundColor: accent }}
            />

            <p className="text-center text-[9.5pt] font-bold tracking-[0.22em] text-slate-500 uppercase mb-6">
              {config.kpmLabel}
            </p>

            {renderCrestRow(false, 'h-20 w-20')}

            <div className="text-center mt-6">
              <h2
                className="text-[16pt] font-extrabold tracking-wide uppercase"
                style={{ color: primary }}
              >
                {config.schoolName}
              </h2>
              {config.schoolCode && (
                <p className="text-[9.5pt] font-semibold tracking-widest text-slate-500 mt-1">
                  KOD SEKOLAH: {config.schoolCode}
                </p>
              )}
            </div>
          </div>

          <div className="px-16 my-auto text-center">
            <div className="w-16 h-1 mx-auto mb-7" style={{ backgroundColor: accent }} />
            <h1
              className="text-[34pt] font-black leading-[1.06] tracking-tight uppercase"
              style={{ color: primary }}
            >
              {config.title}
            </h1>
            <div
              className="inline-block mt-6 px-7 py-2.5 rounded-full text-[12pt] font-extrabold tracking-widest uppercase shadow-sm"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              {config.session}
            </div>
            {config.subtitle && (
              <p className="text-[9.5pt] font-semibold tracking-[0.14em] text-slate-500 uppercase mt-5">
                {config.subtitle}
              </p>
            )}

            <div className={`mt-7 max-w-lg mx-auto rounded-xl overflow-hidden ${config.cover_photo_url ? '' : 'print:hidden'}`}>
              {renderPhotoBox('h-[46mm]', false)}
            </div>
          </div>

          <div className="px-16 pb-12">
            {config.motto && (
              <p
                className="text-center text-[10.5pt] font-bold italic mb-4"
                style={{ color: accent }}
              >
                &ldquo;{config.motto}&rdquo;
              </p>
            )}
            <div className="border-t border-slate-300 pt-4 text-center">
              {config.address && <p className="text-[9pt] font-semibold text-slate-700">{config.address}</p>}
              {contactLine && <p className="text-[8.5pt] text-slate-500 mt-1">{contactLine}</p>}
            </div>
            <div
              className="absolute bottom-0 right-0 w-52 h-3.5"
              style={{ backgroundColor: accent }}
            />
          </div>
        </>
      )}

      {/* =====================================================================
          TEMPLATE C: EKSEKUTIF BLOK WARNA PENUH (EXECUTIVE DARK / FULL COLOR)
         ===================================================================== */}
      {config.templateId === 'executive-dark' && (
        <div
          className="w-full h-full flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ backgroundColor: primary, color: primaryText }}
        >
          <div
            className="absolute -right-24 top-24 w-80 h-80 rotate-45 opacity-15 rounded-3xl"
            style={{ backgroundColor: accent }}
          />
          <div
            className="absolute -left-20 bottom-28 w-72 h-72 rotate-45 opacity-10 rounded-3xl"
            style={{ backgroundColor: '#FFFFFF' }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
              <span className="text-[9pt] font-bold tracking-[0.18em] uppercase opacity-85">
                {config.kpmLabel}
              </span>
              <span
                className="px-3 py-1 rounded text-[9pt] font-extrabold uppercase"
                style={{ backgroundColor: accent, color: accentText }}
              >
                {config.session}
              </span>
            </div>

            <div className="bg-white/95 rounded-2xl py-3.5 px-6 shadow-lg max-w-xl mx-auto">
              {renderCrestRow(false, 'h-16 w-16')}
            </div>

            <h2 className="text-center text-[16pt] font-extrabold tracking-wide uppercase mt-6">
              {config.schoolName}
            </h2>
          </div>

          <div className="relative z-10 my-auto py-4">
            <div
              className="w-20 h-1.5 mb-5 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <h1 className="text-[33pt] font-black leading-[1.06] tracking-tight uppercase">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="text-[9.5pt] font-semibold tracking-[0.14em] uppercase opacity-80 mt-3">
                {config.subtitle}
              </p>
            )}

            <div
              className={`mt-7 rounded-2xl overflow-hidden ${
                config.cover_photo_url ? 'border-2 border-white/25' : 'print:hidden'
              }`}
            >
              {renderPhotoBox('h-[58mm]', true)}
            </div>
          </div>

          <div className="relative z-10 border-t border-white/20 pt-4 text-center">
            {config.motto && (
              <p className="text-[10pt] italic font-semibold mb-1.5" style={{ color: accent }}>
                &ldquo;{config.motto}&rdquo;
              </p>
            )}
            {config.address && <p className="text-[9pt] opacity-90">{config.address}</p>}
            {contactLine && <p className="text-[8.5pt] opacity-75 mt-1">{contactLine}</p>}
          </div>
        </div>
      )}

      {/* =====================================================================
          TEMPLATE D: FOKUS BANGUNAN SEKOLAH (PHOTO SHOWCASE)
         ===================================================================== */}
      {config.templateId === 'photo-showcase' && (
        <>
          <div className="pt-11 px-14 pb-6 bg-white">
            <p className="text-center text-[9.5pt] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
              {config.kpmLabel}
            </p>
            {renderCrestRow(false, 'h-16 w-16')}
            <h2
              className="text-center text-[16pt] font-extrabold tracking-wide uppercase mt-4"
              style={{ color: primary }}
            >
              {config.schoolName}
            </h2>
          </div>

          <div
            className="px-14 py-7 relative"
            style={{ backgroundColor: primary, color: primaryText }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-[10pt] font-extrabold tracking-widest uppercase mb-1"
                  style={{ color: accent }}
                >
                  {config.session}
                </p>
                <h1 className="text-[26pt] font-black leading-tight uppercase">{config.title}</h1>
              </div>
              <ShieldCheck size={42} className="opacity-25 shrink-0" />
            </div>
          </div>

          <div className="px-14 py-6 flex-1 flex flex-col justify-center">
            <div
              className={`rounded-2xl overflow-hidden ${
                config.cover_photo_url ? 'border border-slate-200 shadow-md' : 'print:hidden'
              }`}
            >
              {renderPhotoBox('h-[88mm]', false)}
            </div>
            {config.motto && (
              <p
                className="text-center text-[10.5pt] font-bold italic mt-4"
                style={{ color: primary }}
              >
                &ldquo;{config.motto}&rdquo;
              </p>
            )}
          </div>

          <div
            className="px-14 py-5 text-center"
            style={{ backgroundColor: accent, color: accentText }}
          >
            {config.address && <p className="text-[9.5pt] font-bold uppercase">{config.address}</p>}
            {contactLine && <p className="text-[8.5pt] opacity-90 mt-0.5">{contactLine}</p>}
          </div>
        </>
      )}

      {/* =====================================================================
          TEMPLATE E: KLASIK RASMI & LENCANA BERBINGKAI (CREST CLASSIC)
         ===================================================================== */}
      {config.templateId === 'crest-classic' && (
        <div className="w-full h-full p-8 flex flex-col justify-between bg-white">
          <div
            className="w-full h-full border-[3px] p-1.5 flex flex-col justify-between"
            style={{ borderColor: primary }}
          >
            <div
              className="w-full h-full border px-11 py-10 flex flex-col justify-between relative"
              style={{ borderColor: accent }}
            >
              {/* Top Official Header & Crests */}
              <div className="text-center">
                <p className="text-[9.5pt] font-bold tracking-[0.22em] text-slate-600 uppercase mb-5">
                  {config.kpmLabel}
                </p>

                {renderCrestRow(false, 'h-20 w-20')}

                <h2
                  className="text-[16pt] font-extrabold tracking-wide uppercase mt-5 leading-snug"
                  style={{ color: primary }}
                >
                  {config.schoolName}
                </h2>
                {config.schoolCode && (
                  <p className="text-[9pt] font-bold tracking-widest text-slate-500 uppercase mt-1">
                    KOD SEKOLAH: {config.schoolCode}
                  </p>
                )}
              </div>

              {/* Center Formal Title Plaque */}
              <div className="my-auto py-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <span className="h-0.5 w-14" style={{ backgroundColor: accent }} />
                  <span
                    className="px-4 py-1 text-[9.5pt] font-extrabold tracking-[0.18em] uppercase border"
                    style={{ borderColor: primary, color: primary }}
                  >
                    {config.session}
                  </span>
                  <span className="h-0.5 w-14" style={{ backgroundColor: accent }} />
                </div>

                <div
                  className="py-6 px-6 border-y-2"
                  style={{ borderColor: primary }}
                >
                  <h1
                    className="text-[29pt] font-black leading-[1.1] tracking-tight uppercase"
                    style={{ color: primary }}
                  >
                    {config.title}
                  </h1>
                  {config.subtitle && (
                    <p className="text-[9pt] font-semibold tracking-[0.14em] text-slate-600 uppercase mt-3">
                      {config.subtitle}
                    </p>
                  )}
                </div>

                <div
                  className={`mt-6 max-w-md mx-auto rounded-lg overflow-hidden ${
                    config.cover_photo_url ? 'border-2' : 'print:hidden'
                  }`}
                  style={{ borderColor: accent }}
                >
                  {renderPhotoBox('h-[48mm]', false)}
                </div>
              </div>

              {/* Bottom Formal Motto & Address */}
              <div className="text-center">
                {config.motto && (
                  <p
                    className="text-[10pt] font-bold italic mb-3"
                    style={{ color: accent }}
                  >
                    &ldquo;{config.motto}&rdquo;
                  </p>
                )}
                <div
                  className="border-t-2 pt-3.5"
                  style={{ borderColor: primary }}
                >
                  {config.address && (
                    <p className="text-[9pt] font-bold text-slate-800 uppercase">{config.address}</p>
                  )}
                  {contactLine && <p className="text-[8.5pt] text-slate-500 mt-1">{contactLine}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};