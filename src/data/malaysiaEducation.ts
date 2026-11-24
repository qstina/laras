export interface MalaysiaStateInfo {
  name: string;
  jpnName: string;
  schoolCodePrefixes: string[];
}

export interface SchoolCategoryOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Senarai rasmi 13 Negeri & 3 Wilayah Persekutuan di Malaysia
 * berserta awalan kod sekolah KPM untuk panduan pengesahan.
 */
export const MALAYSIA_STATES: MalaysiaStateInfo[] = [
  { name: 'Johor', jpnName: 'JPN Johor', schoolCodePrefixes: ['J'] },
  { name: 'Kedah', jpnName: 'JPN Kedah', schoolCodePrefixes: ['K'] },
  { name: 'Kelantan', jpnName: 'JPN Kelantan', schoolCodePrefixes: ['D'] },
  { name: 'Melaka', jpnName: 'JPN Melaka', schoolCodePrefixes: ['M'] },
  { name: 'Negeri Sembilan', jpnName: 'JPN Negeri Sembilan', schoolCodePrefixes: ['N'] },
  { name: 'Pahang', jpnName: 'JPN Pahang', schoolCodePrefixes: ['C'] },
  { name: 'Perak', jpnName: 'JPN Perak', schoolCodePrefixes: ['A'] },
  { name: 'Perlis', jpnName: 'JPN Perlis', schoolCodePrefixes: ['R'] },
  { name: 'Pulau Pinang', jpnName: 'JPN Pulau Pinang', schoolCodePrefixes: ['P'] },
  { name: 'Sabah', jpnName: 'JPN Sabah', schoolCodePrefixes: ['X'] },
  { name: 'Sarawak', jpnName: 'JPN Sarawak', schoolCodePrefixes: ['Y'] },
  { name: 'Selangor', jpnName: 'JPN Selangor', schoolCodePrefixes: ['B'] },
  { name: 'Terengganu', jpnName: 'JPN Terengganu', schoolCodePrefixes: ['T'] },
  { name: 'W.P. Kuala Lumpur', jpnName: 'JPW Kuala Lumpur', schoolCodePrefixes: ['W'] },
  { name: 'W.P. Labuan', jpnName: 'JPW Labuan', schoolCodePrefixes: ['W'] },
  { name: 'W.P. Putrajaya', jpnName: 'JPW Putrajaya', schoolCodePrefixes: ['W'] },
];

/**
 * Senarai rasmi Pejabat Pendidikan Daerah (PPD) / Pejabat Pendidikan Wilayah (PPW) / JPN
 * mengikut negeri di bawah Kementerian Pendidikan Malaysia (KPM).
 */
export const PPD_BY_STATE: Record<string, string[]> = {
  Johor: [
    'PPD Batu Pahat',
    'PPD Johor Bahru',
    'PPD Kluang',
    'PPD Kota Tinggi',
    'PPD Kulai',
    'PPD Mersing',
    'PPD Muar',
    'PPD Pasir Gudang',
    'PPD Pontian',
    'PPD Segamat',
    'PPD Tangkak',
  ],
  Kedah: [
    'PPD Baling',
    'PPD Kota Setar',
    'PPD Kuala Muda / Yan',
    'PPD Kubang Pasu',
    'PPD Kulim / Bandar Baharu',
    'PPD Langkawi',
    'PPD Padang Terap',
    'PPD Pendang',
    'PPD Sik',
  ],
  Kelantan: [
    'PPD Bachok',
    'PPD Gua Musang',
    'PPD Jeli',
    'PPD Kota Bharu',
    'PPD Kuala Krai',
    'PPD Machang',
    'PPD Pasir Mas',
    'PPD Pasir Puteh',
    'PPD Tanah Merah',
    'PPD Tumpat',
  ],
  Melaka: [
    'PPD Alor Gajah',
    'PPD Jasin',
    'PPD Melaka Tengah',
  ],
  'Negeri Sembilan': [
    'PPD Jempol dan Jelebu',
    'PPD Kuala Pilah',
    'PPD Port Dickson',
    'PPD Rembau',
    'PPD Seremban',
    'PPD Tampin',
  ],
  Pahang: [
    'PPD Bentong',
    'PPD Bera',
    'PPD Cameron Highlands',
    'PPD Jerantut',
    'PPD Kuantan',
    'PPD Lipis',
    'PPD Maran',
    'PPD Pekan',
    'PPD Raub',
    'PPD Rompin',
    'PPD Temerloh',
  ],
  Perak: [
    'PPD Bagan Datuk',
    'PPD Batang Padang',
    'PPD Hilir Perak',
    'PPD Hulu Perak',
    'PPD Kerian',
    'PPD Kinta Selatan',
    'PPD Kinta Utara',
    'PPD Kuala Kangsar',
    'PPD Larut, Matang dan Selama',
    'PPD Manjung',
    'PPD Muallim',
    'PPD Perak Tengah',
  ],
  Perlis: [
    'JPN Perlis (Negeri Perlis)',
  ],
  'Pulau Pinang': [
    'PPD Barat Daya',
    'PPD Seberang Perai Selatan',
    'PPD Seberang Perai Tengah',
    'PPD Seberang Perai Utara',
    'PPD Timur Laut',
  ],
  Sabah: [
    'PPD Beaufort',
    'PPD Beluran',
    'PPD Keningau',
    'PPD Kinabatangan',
    'PPD Kota Belud',
    'PPD Kota Kinabalu',
    'PPD Kota Marudu',
    'PPD Kuala Penyu',
    'PPD Kudat',
    'PPD Kunak',
    'PPD Lahad Datu',
    'PPD Nabawan',
    'PPD Papar',
    'PPD Penampang',
    'PPD Pitas',
    'PPD Ranau',
    'PPD Sandakan',
    'PPD Semporna',
    'PPD Sipitang',
    'PPD Tambunan',
    'PPD Tawau',
    'PPD Telupid / Tongod',
    'PPD Tenom',
    'PPD Tuaran',
  ],
  Sarawak: [
    'PPD Baram',
    'PPD Bau',
    'PPD Belaga',
    'PPD Betong',
    'PPD Bintulu',
    'PPD Dalat',
    'PPD Daro',
    'PPD Julau',
    'PPD Kanowit',
    'PPD Kapit',
    'PPD Kuching',
    'PPD Lawas',
    'PPD Limbang',
    'PPD Lubok Antu',
    'PPD Lundu',
    'PPD Maradong',
    'PPD Miri',
    'PPD Mukah',
    'PPD Padawan',
    'PPD Samarahan',
    'PPD Saratok',
    'PPD Sarikei',
    'PPD Selangau',
    'PPD Serian',
    'PPD Sibu',
    'PPD Simunjan',
    'PPD Song',
    'PPD Sri Aman',
    'PPD Subis',
    'PPD Tatau / Sebauh',
  ],
  Selangor: [
    'PPD Gombak',
    'PPD Hulu Langat',
    'PPD Hulu Selangor',
    'PPD Klang',
    'PPD Kuala Langat',
    'PPD Kuala Selangor',
    'PPD Petaling Perdana',
    'PPD Petaling Utama',
    'PPD Sabak Bernam',
    'PPD Sepang',
  ],
  Terengganu: [
    'PPD Besut',
    'PPD Dungun',
    'PPD Hulu Terengganu',
    'PPD Kemaman',
    'PPD Kuala Nerus',
    'PPD Kuala Terengganu',
    'PPD Marang',
    'PPD Setiu',
  ],
  'W.P. Kuala Lumpur': [
    'PPW Bangsar & Pudu',
    'PPW Keramat',
    'PPW Sentul',
  ],
  'W.P. Labuan': [
    'JPW Wilayah Persekutuan Labuan',
  ],
  'W.P. Putrajaya': [
    'JPW Wilayah Persekutuan Putrajaya',
  ],
};

/**
 * Kategori institusi / jenis sekolah di bawah KPM
 */
export const SCHOOL_CATEGORIES: SchoolCategoryOption[] = [
  { value: 'SK', label: 'SK — Sekolah Kebangsaan', description: 'Sekolah Rendah Kebangsaan' },
  { value: 'SMK', label: 'SMK — Sekolah Menengah Kebangsaan', description: 'Sekolah Menengah Harian' },
  { value: 'SJKC', label: 'SJK(C) — Sekolah Jenis Kebangsaan Cina', description: 'Sekolah Rendah Jenis Kebangsaan (Cina)' },
  { value: 'SJKT', label: 'SJK(T) — Sekolah Jenis Kebangsaan Tamil', description: 'Sekolah Rendah Jenis Kebangsaan (Tamil)' },
  { value: 'SMKA', label: 'SMKA — Sekolah Menengah Kebangsaan Agama', description: 'Sekolah Menengah Agama Persekutuan' },
  { value: 'SABK', label: 'SABK — Sekolah Agama Bantuan Kerajaan', description: 'Sekolah Rendah / Menengah Agama Bantuan Kerajaan' },
  { value: 'SBP', label: 'SBP — Sekolah Berasrama Penuh', description: 'Sekolah Berasrama Penuh KPM' },
  { value: 'KV', label: 'KV / SMT — Kolej Vokasional / Teknik', description: 'Pendidikan Teknikal & Latihan Vokasional' },
  { value: 'SPK', label: 'SPK — Sekolah Pendidikan Khas', description: 'Sekolah Rendah / Menengah Pendidikan Khas' },
  { value: 'LAIN', label: 'Lain-lain Institusi Pendidikan', description: 'Sekolah Model Khas / Sukan / Seni / Swasta Berdaftar' },
];

export function getPpdsByState(stateName: string): string[] {
  return PPD_BY_STATE[stateName] || [];
}

export function inferStateFromSchoolCode(code: string): string | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const prefix = clean.charAt(0);
  if (prefix === 'W') return null; // 'W' merangkumi W.P. Kuala Lumpur, Labuan & Putrajaya
  const matched = MALAYSIA_STATES.find((s) => s.schoolCodePrefixes.includes(prefix));
  return matched ? matched.name : null;
}