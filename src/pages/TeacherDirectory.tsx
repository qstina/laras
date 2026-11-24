import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, Plus, Filter, AlertCircle, Upload, 
  Download, CheckCircle2, X, FileSpreadsheet, ArrowRight, AlertTriangle,
  Users,
  Sparkles
} from 'lucide-react';
import StaffProfileDrawer from '../components/StaffProfileDrawer';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

type StaffImportRecord = {
  name: string;
  type: 'Guru' | 'Sokongan';
  jawatan: string;
  gred: string;
  department: string | null;
  email: string | null;
  status: string;
};

type ParsedPreviewRow = {
  rowNumber: number;
  bil?: string;
  jantina?: string;
  record: StaffImportRecord;
};

type InvalidImportRow = {
  rowNumber: number;
  data: Partial<StaffImportRecord> & { jantina?: string };
  reason: string;
};

// Normalize standard and non-breaking spaces (\u00A0)
function cleanText(value?: string | null): string {
  if (!value) return '';
  return value.replace(/[\s\u00A0]+/g, ' ').trim();
}

// Parse RFC-4180 CSV text safely (supports quotes, commas inside quotes, CRLF/LF, BOM, and , or ; delimiters)
function parseCsvRows(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

// Derive Guru vs Sokongan accurately from Malaysian civil service GRED and JAWATAN
function classifyStaffType(gred: string, jawatan: string): 'Guru' | 'Sokongan' {
  const normGred = cleanText(gred).toUpperCase();
  const normJawatan = cleanText(jawatan).toUpperCase();

  // Skim Perkhidmatan Pendidikan (SSM DG29-DG54 & SSPA DG7-DG14)
  if (/^DG\d+/i.test(normGred)) {
    return 'Guru';
  }

  // Skim Anggota Kumpulan Pelaksana / Staf Sokongan (C, H, N, W, FT, FA, JA, S, U, KP, etc.)
  if (/^(N|C|H|W|FT|FA|JA|S|U|KP|E|G|J|Q|R|B)\d+/i.test(normGred)) {
    return 'Sokongan';
  }

  // Fallback by post title if grade format is non-standard
  if (/\b(GURU|PENGETUA|PENOLONG KANAN|KETUA BIDANG|GPK)\b/i.test(normJawatan)) {
    return 'Guru';
  }

  return 'Sokongan';
}

function normalizeGender(rawGender: string): string {
  const g = cleanText(rawGender).toUpperCase();
  if (g === 'L' || g === 'LELAKI') return 'L';
  if (g === 'P' || g === 'PEREMPUAN') return 'P';
  return g;
}

export default function TeacherDirectory() {
  // --- STATE ---
  const [staffList, setStaffList] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI & Filter States
  const [activeTab, setActiveTab] = useState<'Semua' | 'Guru' | 'Sokongan'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  
  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // --- IMPORT MODAL STATE ---
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'review' | 'uploading' | 'success'>('upload');
  const [parsedData, setParsedData] = useState<ParsedPreviewRow[]>([]);
  const [invalidData, setInvalidData] = useState<InvalidImportRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  async function fetchStaff() {
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', session.user.id).single();
      if (profile) setSchoolId(profile.school_id);
    }

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name', { ascending: true });

    if (!error) {
      setStaffList(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  // --- CSV EXPORT ---
  const handleExportCSV = () => {
    if (staffList.length === 0) return alert('Tiada rekod untuk dieksport.');
    
    const headers = ['Nama', 'Jenis', 'Jawatan', 'Gred', 'Opsyen Dominan / Unit', 'Emel', 'Status'];
    const csvContent = [
      headers.join(','),
      ...staffList.map(s => `"${s.name}","${s.type}","${s.jawatan || ''}","${s.gred || ''}","${s.department || ''}","${s.email || ''}","${s.status}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Direktori_Warga_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV PARSING & VALIDATION ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const allRows = parseCsvRows(csvText);

      // Locate the header row (first non-empty row)
      const headerRowIndex = allRows.findIndex(row => row.some(cell => cleanText(cell) !== ''));
      if (headerRowIndex === -1) {
        alert('Fail CSV kosong atau tidak sah.');
        return;
      }

      const normalizedHeaders = allRows[headerRowIndex].map(h => cleanText(h).toUpperCase());

      const findColumnIndex = (aliases: string[]) =>
        normalizedHeaders.findIndex(h => aliases.includes(h));

      const colIdx = {
        bil: findColumnIndex(['BIL', 'NO']),
        nama: findColumnIndex(['NAMA', 'NAMA PENUH', 'NAMA WARGA', 'NAMA STAF']),
        jantina: findColumnIndex(['JANTINA', 'GENDER']),
        gred: findColumnIndex(['GRED', 'GRED JAWATAN']),
        jawatan: findColumnIndex(['JAWATAN', 'JAWATAN HAKIKI']),
        opsyen: findColumnIndex(['OPSYEN DOMINAN', 'OPSYEN', 'BIDANG / OPSYEN', 'PANITIA / UNIT', 'PANITIA']),
        emel: findColumnIndex(['EMEL', 'EMAIL']),
      };

      const missingHeaders: string[] = [];
      if (colIdx.nama === -1) missingHeaders.push('NAMA');
      if (colIdx.gred === -1) missingHeaders.push('GRED');
      if (colIdx.jawatan === -1) missingHeaders.push('JAWATAN');
      if (colIdx.opsyen === -1) missingHeaders.push('OPSYEN DOMINAN');

      if (missingHeaders.length > 0) {
        alert(
          `Format header CSV tidak sepadan. Lajur wajib tidak ditemui: ${missingHeaders.join(', ')}.\n` +
          `Sila pastikan fail mengandungi lajur: BIL, NAMA, JANTINA, GRED, JAWATAN, OPSYEN DOMINAN.`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const validRows: ParsedPreviewRow[] = [];
      const invalidRows: InvalidImportRow[] = [];

      const existingEmails = new Set(staffList.map(s => cleanText(s.email).toLowerCase()).filter(Boolean));
      const existingNames = new Set(staffList.map(s => cleanText(s.name).toLowerCase()).filter(Boolean));
      const seenEmailsInCsv = new Set<string>();
      const seenNamesInCsv = new Set<string>();

      for (let i = headerRowIndex + 1; i < allRows.length; i++) {
        const rawRow = allRows[i];
        // Skip completely blank lines
        if (!rawRow || rawRow.every(cell => cleanText(cell) === '')) continue;

        const bil = colIdx.bil !== -1 ? cleanText(rawRow[colIdx.bil]) : '';
        const name = cleanText(rawRow[colIdx.nama]);
        const jantina = colIdx.jantina !== -1 ? normalizeGender(rawRow[colIdx.jantina] || '') : '';
        const gred = cleanText(rawRow[colIdx.gred]).toUpperCase();
        const jawatan = cleanText(rawRow[colIdx.jawatan]);
        const rawOpsyen = cleanText(rawRow[colIdx.opsyen]);
        const opsyenDominan =
          rawOpsyen && !['-', 'TIADA', 'N/A', 'NIL'].includes(rawOpsyen.toUpperCase())
            ? rawOpsyen
            : null;
        const rawEmail = colIdx.emel !== -1 ? cleanText(rawRow[colIdx.emel]).toLowerCase() : '';
        const finalEmail = rawEmail !== '' ? rawEmail : null;

        const derivedType = classifyStaffType(gred, jawatan);

        const record: StaffImportRecord = {
          name,
          type: derivedType,
          jawatan,
          gred,
          department: opsyenDominan,
          email: finalEmail,
          status: 'Aktif',
        };

        if (!record.name || !record.gred || !record.jawatan) {
          invalidRows.push({
            rowNumber: i + 1,
            data: { ...record, jantina },
            reason: 'Kekurangan data wajib (NAMA / GRED / JAWATAN)',
          });
          continue;
        }

        if (colIdx.jantina !== -1 && jantina !== '' && jantina !== 'L' && jantina !== 'P') {
          invalidRows.push({
            rowNumber: i + 1,
            data: { ...record, jantina },
            reason: `Nilai JANTINA tidak sah (${jantina}) — gunakan L atau P`,
          });
          continue;
        }

        const normalizedNameKey = name.toLowerCase();
        if (existingNames.has(normalizedNameKey)) {
          invalidRows.push({
            rowNumber: i + 1,
            data: { ...record, jantina },
            reason: 'Nama warga sudah wujud di dalam sistem',
          });
          continue;
        }

        if (seenNamesInCsv.has(normalizedNameKey)) {
          invalidRows.push({
            rowNumber: i + 1,
            data: { ...record, jantina },
            reason: 'Nama warga bertindih dalam fail CSV',
          });
          continue;
        }

        if (finalEmail) {
          if (existingEmails.has(finalEmail)) {
            invalidRows.push({
              rowNumber: i + 1,
              data: { ...record, jantina },
              reason: `Emel sudah wujud: ${finalEmail}`,
            });
            continue;
          }
          if (seenEmailsInCsv.has(finalEmail)) {
            invalidRows.push({
              rowNumber: i + 1,
              data: { ...record, jantina },
              reason: `Emel bertindih dalam fail CSV: ${finalEmail}`,
            });
            continue;
          }
          seenEmailsInCsv.add(finalEmail);
        }

        seenNamesInCsv.add(normalizedNameKey);
        validRows.push({
          rowNumber: i + 1,
          bil,
          jantina,
          record,
        });
      }

      setParsedData(validRows);
      setInvalidData(invalidRows);
      setImportStep('review');
    };
    
    reader.readAsText(file);
  };

  const handleBulkInsert = async () => {
    if (parsedData.length === 0) return alert('Tiada data sah untuk diimport.');
    if (!schoolId) return alert('Ralat: Sila log masuk semula. Sistem tidak dapat mengenal pasti organisasi sekolah anda.');

    setImportStep('uploading');
    const dataToInsert = parsedData.map(item => ({ ...item.record, school_id: schoolId }));

    const { error } = await supabase.from('staff').insert(dataToInsert);

    if (error) {
      alert('Gagal mengimport data: ' + error.message);
      setImportStep('review');
    } else {
      setImportStep('success');
      fetchStaff();
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setTimeout(() => {
      setImportStep('upload');
      setParsedData([]);
      setInvalidData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 300);
  };

  const openAddStaff = () => {
    setSelectedStaffId(null);
    setIsDrawerOpen(true);
  };

  const openEditStaff = (id: string) => {
    setSelectedStaffId(id);
    setIsDrawerOpen(true);
  };

  // --- FILTERS ---
  const filteredStaff = staffList.filter(staff => {
    const matchTab = activeTab === 'Semua' ? true : staff.type === activeTab;
    const matchSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (staff.jawatan && staff.jawatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (staff.department && staff.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchIncomplete = showIncompleteOnly ? (!staff.gred || !staff.jawatan) : true;
    
    return matchTab && matchSearch && matchIncomplete;
  });

  const missingDataCount = staffList.filter(s => !s.gred || !s.jawatan).length;
  const readinessPercentage = staffList.length > 0 
    ? Math.round(((staffList.length - missingDataCount) / staffList.length) * 100) 
    : 0;

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-ink rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Memuatkan Pangkalan Data...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Warga sekolah</h2>
          <p className="text-sm text-slate-500 mt-1">
            {staffList.length} warga sekolah • {staffList.filter(s => s.type === 'Guru').length} Guru • {staffList.filter(s => s.type === 'Sokongan').length} Staf Sokongan
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link 
            to="/workload"
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles size={14} /> Agihan Automatik
          </Link>
          <button 
            onClick={() => setImportModalOpen(true)}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors md:flex"
          >
            <Download size={14} /> Eksport
          </button>
          <button 
            onClick={openAddStaff}
            className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Tambah Warga
          </button>
        </div>
      </div>

      {/* Book Readiness Tracker */}
      <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-2/3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${readinessPercentage === 100 ? 'bg-forest/10 text-forest' : 'bg-amber/10 text-amber'}`}>
            {readinessPercentage === 100 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-ink">Ketersediaan Buku Pengurusan</h3>
              <span className="text-sm font-semibold text-ink">{readinessPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden flex">
              <div className="h-full bg-forest transition-all duration-1000" style={{ width: `${readinessPercentage}%` }}></div>
              <div className="h-full bg-amber transition-all duration-1000" style={{ width: `${100 - readinessPercentage}%` }}></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end w-full md:w-1/3">
          <p className="text-sm font-semibold text-ink">{missingDataCount} profil perlukan perhatian</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Data wajib (Gred/Jawatan) tidak lengkap</p>
          <button 
            onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
            className={`text-[11px] font-semibold mt-2 flex items-center gap-1 transition-opacity ${showIncompleteOnly ? 'text-amber hover:opacity-70' : 'text-ink hover:opacity-70'}`}
          >
            {showIncompleteOnly ? 'Tunjuk Semua' : 'Semak Profil'} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          {['Semua', 'Guru', 'Sokongan'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto pr-1">
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, jawatan atau opsyen..." 
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus-within:border-ink/30 focus-within:ring-4 focus-within:ring-ink/5 transition-all" 
            />
          </div>
          <button 
            onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
            className={`p-1.5 rounded-lg transition-colors border ${showIncompleteOnly ? 'bg-amber/10 text-amber border-amber/20' : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'}`}
            title="Tapis Data Tidak Lengkap"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-80">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 mb-3">
              <Users size={24} />
            </div>
            <h3 className="text-sm font-semibold text-ink">{searchQuery || showIncompleteOnly ? 'Tiada Padanan' : 'Tiada Rekod Warga Sekolah'}</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">Sila ubah carian atau tambah warga secara manual atau gunakan fungsi Import CSV.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-3xl">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Warga</th>
                  <th className="px-4 py-3">Jawatan & Gred</th>
                  <th className="px-4 py-3">Opsyen Dominan / Unit</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr 
                    key={staff.id} 
                    onClick={() => openEditStaff(staff.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 overflow-hidden shrink-0">
                          {staff.avatar_url ? (
                            <img src={staff.avatar_url} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink group-hover:text-ink/70 transition-colors truncate">{staff.name}</p>
                          {(!staff.gred || !staff.jawatan) && (
                            <p className="text-[10px] font-bold text-amber flex items-center gap-1 mt-0.5">
                              <AlertCircle size={10} /> Data Tidak Lengkap
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink">{staff.jawatan || '-'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{staff.gred || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{staff.department || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 border text-[10px] font-bold rounded-md inline-block uppercase tracking-wide ${staff.status === 'Aktif' ? 'bg-forest/10 text-forest border-forest/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffProfileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        staffId={selectedStaffId} 
        schoolId={schoolId}
        onSuccess={fetchStaff}
      />

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky/10 text-sky flex items-center justify-center border border-sky/20">
                  <FileSpreadsheet size={16} />
                </div>
                <h3 className="text-sm font-semibold text-ink">Import Pukal Warga Sekolah</h3>
              </div>
              <button onClick={closeImportModal} className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              {importStep === 'upload' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h4 className="text-base font-semibold text-ink">Muat Naik Fail e-Operasi / HRMIS</h4>
                    <p className="text-xs text-slate-500 mt-1">Sistem menyokong fail berformat .CSV untuk import terus.</p>
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 hover:border-ink/30 transition-colors cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-ink mb-3">
                      <Upload size={20} />
                    </div>
                    <p className="text-sm font-semibold text-ink">Klik untuk pilih fail</p>
                    <p className="text-[11px] text-slate-500 mt-1">atau seret dan lepas fail di sini</p>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  
                  <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 flex gap-2.5 text-xs text-amber-800">
                    <AlertCircle size={16} className="shrink-0 text-amber mt-0.5" />
                    <p className="leading-relaxed">
                      Pastikan baris pertama (header) mengandungi lajur: <strong>BIL, NAMA, JANTINA, GRED, JAWATAN, OPSYEN DOMINAN</strong>. Kategori (Guru / Staf Sokongan) akan dikesan secara automatik berdasarkan gred dan jawatan, manakala <em>OPSYEN DOMINAN</em> boleh dibiarkan kosong bagi Staf Sokongan.
                    </p>
                  </div>
                </div>
              )}

              {importStep === 'review' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Semakan Validasi Data</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sistem mengimbas {parsedData.length + invalidData.length} baris dari fail anda.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-forest/10 border border-forest/20 rounded-lg text-center min-w-20">
                        <p className="text-[10px] font-bold text-forest uppercase tracking-wide">Sah</p>
                        <p className="text-lg font-bold text-forest">{parsedData.length}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg text-center min-w-20 ${invalidData.length > 0 ? 'bg-rose/10 border border-rose/20' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${invalidData.length > 0 ? 'text-rose' : 'text-slate-400'}`}>Ditolak</p>
                        <p className={`text-lg font-bold ${invalidData.length > 0 ? 'text-rose' : 'text-slate-600'}`}>{invalidData.length}</p>
                      </div>
                    </div>
                  </div>

                  {invalidData.length > 0 && (
                    <div className="bg-rose/10 border border-rose/20 rounded-lg p-3 flex gap-2.5 text-xs text-rose-800">
                      <AlertTriangle size={16} className="shrink-0 text-rose mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose">Amaran: Terdapat {invalidData.length} rekod yang akan diabaikan.</p>
                        <p className="mt-0.5 opacity-90">Anda masih boleh meneruskan import untuk rekod yang sah.</p>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">Status</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">Nama (Baris)</th>
                          <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">Catatan / Butiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invalidData.slice(0, 10).map((item, idx) => (
                          <tr key={`invalid-${idx}`} className="bg-rose/5">
                            <td className="px-3 py-2.5"><span className="text-[10px] font-bold text-rose bg-rose/10 border border-rose/20 px-2 py-0.5 rounded-md uppercase tracking-wide">Ditolak</span></td>
                            <td className="px-3 py-2.5 text-ink font-medium">{item.data.name || '(Tiada Nama)'} <span className="text-[10px] text-slate-400 ml-1 font-normal">Baris {item.rowNumber}</span></td>
                            <td className="px-3 py-2.5 text-rose">{item.reason}</td>
                          </tr>
                        ))}
                        {parsedData.slice(0, 10).map((item, idx) => (
                          <tr key={`valid-${idx}`}>
                            <td className="px-3 py-2.5"><span className="text-[10px] font-bold text-forest bg-forest/10 border border-forest/20 px-2 py-0.5 rounded-md uppercase tracking-wide">Sah</span></td>
                            <td className="px-3 py-2.5 font-medium text-ink">{item.record.name}</td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {item.record.type} • {item.record.gred} • {item.record.department || 'Tiada Opsyen'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(parsedData.length + invalidData.length) > 20 && (
                      <div className="p-2.5 bg-slate-50 text-center text-[11px] font-medium text-slate-500 border-t border-slate-100">
                        Memaparkan sebahagian sahaja daripada keseluruhan rekod.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(importStep === 'uploading' || importStep === 'success') && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  {importStep === 'uploading' ? (
                    <>
                      <div className="w-12 h-12 border-4 border-slate-200 border-t-ink rounded-full animate-spin mb-2"></div>
                      <h4 className="text-base font-semibold text-ink">Sedang memuat naik...</h4>
                      <p className="text-xs text-slate-500">Menyimpan {parsedData.length} rekod. Sila tunggu sebentar.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-forest/10 border border-forest/20 text-forest rounded-xl flex items-center justify-center mb-2">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-xl font-bold text-ink">Import Berjaya!</h4>
                      <p className="text-xs text-slate-500">Kesemua {parsedData.length} rekod yang sah telah dimasukkan ke dalam sistem Laras.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
              {importStep !== 'uploading' && importStep !== 'success' && (
                <button onClick={closeImportModal} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
              )}
              
              {importStep === 'review' && (
                <button 
                  onClick={handleBulkInsert} 
                  disabled={parsedData.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all ${parsedData.length > 0 ? 'bg-ink hover:opacity-90' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  Sah & Import ({parsedData.length}) <ArrowRight size={14} />
                </button>
              )}

              {importStep === 'success' && (
                <button onClick={closeImportModal} className="px-4 py-2 text-xs font-bold text-white bg-ink hover:opacity-90 rounded-lg transition-all">
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}