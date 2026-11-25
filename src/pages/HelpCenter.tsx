import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Rocket,
  School,
  Users,
  CheckSquare,
  GitBranch,
  BarChart2,
  History,
  Calendar,
  Bell,
  Mail,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  X,
} from 'lucide-react';

interface SectionMeta {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: any;
  modulePath?: string;
  moduleLabel?: string;
  keywords: string[];
}

const HELP_SECTIONS: SectionMeta[] = [
  {
    id: 'pengenalan',
    number: '01',
    title: 'Pengenalan LARAS',
    subtitle: 'Fungsi sistem, matlamat pengurusan sekolah, dan hubungan antara modul.',
    icon: Sparkles,
    modulePath: '/',
    moduleLabel: 'Buka Dashboard',
    keywords: ['pengenalan', 'apa itu laras', 'sistem', 'tujuan', 'aliran kerja', 'modul', 'dashboard'],
  },
  {
    id: 'permulaan',
    number: '02',
    title: 'Panduan Memulakan Penggunaan',
    subtitle: 'Langkah demi langkah dari pendaftaran akaun hingga penjanaan Buku Pengurusan.',
    icon: Rocket,
    modulePath: '/',
    moduleLabel: 'Ke Halaman Utama',
    keywords: ['mula', 'daftar', 'log masuk', 'persediaan awal', 'langkah', 'urutan', 'wajib'],
  },
  {
    id: 'profil-sekolah',
    number: '03',
    title: 'Profil Sekolah',
    subtitle: 'Mengemas kini identiti sekolah, logo rasmi, sesi akademik, dan maklumat pentadbiran.',
    icon: School,
    modulePath: '/school-profile',
    moduleLabel: 'Buka Profil Sekolah',
    keywords: ['profil sekolah', 'logo', 'kod sekolah', 'sesi', 'visi', 'misi', 'alamat', 'simpan perubahan'],
  },
  {
    id: 'warga-sekolah',
    number: '04',
    title: 'Pengurusan Warga Sekolah',
    subtitle: 'Merekod guru dan staf sokongan, import CSV, dan penetapan jawatan serta opsyen.',
    icon: Users,
    modulePath: '/teachers',
    moduleLabel: 'Buka Warga Sekolah',
    keywords: ['warga sekolah', 'guru', 'akp', 'sokongan', 'csv', 'import', 'gred', 'opsyen', 'jawatan'],
  },
  {
    id: 'jawatankuasa',
    number: '05',
    title: 'Pengurusan Jawatankuasa',
    subtitle: 'Struktur Jawatankuasa Besar, Jawatankuasa Kecil, jawatan, dan bidang tugas.',
    icon: CheckSquare,
    modulePath: '/committees',
    moduleLabel: 'Buka Jawatankuasa',
    keywords: ['jawatankuasa', 'jawatankuasa besar', 'jawatankuasa kecil', 'kurikulum', 'hem', 'kokurikulum', 'pentadbiran', 'bidang tugas'],
  },
  {
    id: 'pengagihan-tugas',
    number: '06',
    title: 'Pengagihan Tugas',
    subtitle: 'Melantik guru ke jawatankuasa secara manual atau melalui enjin Auto Agih.',
    icon: GitBranch,
    modulePath: '/committees',
    moduleLabel: 'Urus Agihan Tugas',
    keywords: ['pengagihan tugas', 'agih', 'auto agih', 'lantik', 'pengerusi', 'setiausaha', 'ahli jawatankuasa', 'pemberatan'],
  },
  {
    id: 'beban-tugas',
    number: '07',
    title: 'Beban Tugas',
    subtitle: 'Jadual matriks pemberatan, Mata Semasa, formula Beban (%), had 120%, dan pengecualian.',
    icon: BarChart2,
    modulePath: '/workload',
    moduleLabel: 'Buka Beban Tugas',
    keywords: ['beban tugas', 'mata semasa', 'peratus', '120%', 'formula', 'mata rujukan', 'ex-officio', 'tinggi', 'seimbang', 'rendah'],
  },
  {
    id: 'buku-pengurusan',
    number: '08',
    title: 'Buku Pengurusan',
    subtitle: 'Penyediaan kandungan, pautan data langsung, reka muka hadapan, komen, dan eksport DOCX/PDF.',
    icon: BookOpen,
    modulePath: '/book-builder',
    moduleLabel: 'Buka Book Builder',
    keywords: ['buku pengurusan', 'book builder', 'editor', 'muka hadapan', 'komen', 'docx', 'pdf', 'cetak', 'simpan draf'],
  },
  {
    id: 'sejarah-janaan',
    number: '09',
    title: 'Sejarah Janaan Buku',
    subtitle: 'Rekod versi terbitan terdahulu, tarikh janaan, penjanaan semula, dan muat turun fail.',
    icon: History,
    modulePath: '/reports',
    moduleLabel: 'Buka Janaan Buku',
    keywords: ['sejarah janaan', 'rekod', 'versi', 'muat turun', 'docx', 'pdf', 'laporan', 'penerbitan'],
  },
  {
    id: 'kalendar',
    number: '10',
    title: 'Kalendar & Takwim',
    subtitle: 'Mengurus acara sekolah, mesyuarat, label warna, dan paparan tarikh pada Dashboard.',
    icon: Calendar,
    modulePath: '/',
    moduleLabel: 'Lihat Takwim di Dashboard',
    keywords: ['kalendar', 'takwim', 'acara', 'mesyuarat', 'tarikh', 'masa', 'label warna'],
  },
  {
    id: 'notifikasi',
    number: '11',
    title: 'Notifikasi & Aktiviti',
    subtitle: 'Pemberitahuan berkaitan janaan buku, jemputan staf, takwim, dan rekod aktiviti sekolah.',
    icon: Bell,
    keywords: ['notifikasi', 'loceng', 'pemberitahuan', 'aktiviti', 'jemputan', 'takwim'],
  },
  {
    id: 'mesej',
    number: '12',
    title: 'Mesej',
    subtitle: 'Komunikasi dalaman bersama warga sekolah dan guru yang telah dijemput.',
    icon: Mail,
    keywords: ['mesej', 'mesej baharu', 'warga sekolah', 'guru dijemput', 'komunikasi'],
  },
  {
    id: 'tetapan',
    number: '13',
    title: 'Tetapan Akaun & Jemputan Staf',
    subtitle: 'Mengurus profil pengguna, jemputan guru baharu melalui e-mel, keselamatan, dan log keluar.',
    icon: Settings,
    modulePath: '/settings',
    moduleLabel: 'Buka Tetapan',
    keywords: ['tetapan', 'akaun', 'jemput guru', 'jemputan staf', 'e-mel', 'kata laluan', 'log keluar', 'sesi'],
  },
  {
    id: 'faq',
    number: '14',
    title: 'Soalan Lazim (FAQ)',
    subtitle: 'Jawapan pantas bagi persoalan lazim pentadbir dan guru dalam penggunaan harian LARAS.',
    icon: HelpCircle,
    keywords: ['faq', 'soalan lazim', 'masalah', 'bantuan', 'kenapa', 'bagaimana'],
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Persediaan Awal',
    question: 'Mengapa saya perlu melengkapkan Profil Sekolah terlebih dahulu?',
    answer:
      'Maklumat dalam Profil Sekolah seperti nama rasmi sekolah, kod sekolah, alamat, sesi akademik semasa, visi, misi, dan logo rasmi digunakan secara automatik oleh modul Book Builder untuk membina muka hadapan, pengepala rasmi, dan bab maklumat asas dalam Buku Pengurusan. Jika maklumat ini kosong, kandungan buku yang dijana tidak akan lengkap.',
  },
  {
    id: 'faq-2',
    category: 'Akaun & Akses',
    question: 'Bolehkah beberapa orang guru menggunakan akaun sekolah yang sama?',
    answer:
      'Setiap guru atau pentadbir digalakkan mempunyai akaun peribadi masing-masing yang dipautkan ke sekolah yang sama. Pentadbir boleh menjemput guru melalui halaman Tetapan → Pengurusan Staf (Admin) supaya setiap ahli mempunyai nama pengarang yang jelas apabila menambah komen dalam Book Builder, mencipta acara takwim, atau menjana versi buku.',
  },
  {
    id: 'faq-3',
    category: 'Akaun & Akses',
    question: 'Bagaimanakah guru yang dijemput menyertai sekolah sedia ada?',
    answer:
      'Apabila pentadbir menghantar jemputan di bahagian Jemput Guru / Staf Baru pada halaman Tetapan, sistem menghantar pautan pendaftaran rasmi ke peti masuk e-mel guru tersebut (sah selama 7 hari). Guru hanya perlu membuka pautan tersebut, melengkapkan pendaftaran akaun, dan profil mereka akan terus dipautkan ke sekolah berkenaan.',
  },
  {
    id: 'faq-4',
    category: 'Jawatankuasa',
    question: 'Apakah perbezaan antara Jawatankuasa Besar dan Jawatankuasa Kecil?',
    answer:
      'Jawatankuasa Besar ialah kategori induk pengurusan sekolah seperti Pentadbiran, Kurikulum, Hal Ehwal Murid (HEM), dan Kokurikulum. Di bawah setiap Jawatankuasa Besar terdapat Jawatankuasa Kecil (unit khusus) seperti Panitia Mata Pelajaran, Jawatankuasa Disiplin, atau Unit Beruniform yang mempunyai senarai jawatan serta bidang tugas tersendiri.',
  },
  {
    id: 'faq-5',
    category: 'Pengagihan Tugas',
    question: 'Bagaimanakah fungsi Jana Agihan Automatik (Auto Agih) berfungsi?',
    answer:
      'Enjin Auto Agih menilai kesesuaian setiap guru aktif berdasarkan jawatan rasmi (contohnya PK, GKMP, Ketua Panitia), opsyen dominan dan bidang kepakaran, had kapasiti beban tugas maksimum (120%), serta mengelakkan pertindihan jawatan kepimpinan utama. Sebelum sebarang rekod disimpan, sistem memaparkan tetingkap Semakan & Suntingan Agihan supaya pentadbir boleh menukar guru secara manual dan mengesahkan cadangan.',
  },
  {
    id: 'faq-6',
    category: 'Beban Tugas',
    question: 'Mengapa peratusan Beban (%) seseorang guru tinggi?',
    answer:
      'Peratusan beban dikira berdasarkan jumlah mata pemberatan daripada semua jawatankuasa yang dianggotai oleh guru tersebut dibahagikan dengan Mata Rujukan 100% (lalai: 20 mata). Jika seseorang guru memegang beberapa jawatan berimpak tinggi seperti Setiausaha atau Penyelaras dalam beberapa jawatankuasa serentak, jumlah matanya akan melebihi 20 mata (>100%) dan ditandakan berstatus Tinggi.',
  },
  {
    id: 'faq-7',
    category: 'Beban Tugas',
    question: 'Apakah maksud had kapasiti beban 120%?',
    answer:
      'Had 120% ialah paras siling kawalan dalam enjin pengagihan automatik LARAS (bersamaan 24 mata jika Mata Rujukan 100% ialah 20 mata). Apabila enjin Auto Agih mencadangkan tugasan baharu, ia tidak akan mencadangkan guru yang jumlah beban unjurannya melebihi 120% supaya agihan kekal adil dan terkawal.',
  },
  {
    id: 'faq-8',
    category: 'Beban Tugas',
    question: 'Mengapa terdapat warga sekolah yang mempunyai 0 mata beban tugas?',
    answer:
      'Nilai 0 mata (0%) bermaksud warga sekolah tersebut belum dilantik ke mana-mana jawatan dalam mana-mana jawatankuasa bagi sesi semasa, atau semua pelantikannya mempunyai pemberatan 0 mata. Anda boleh menyemak senarai staf berbeban rendah atau tiada tugasan melalui tab tapisan Rendah di halaman Beban Tugas.',
  },
  {
    id: 'faq-9',
    category: 'Pengagihan Tugas',
    question: 'Bolehkah saya menukar tugasan guru secara manual selepas agihan dibuat?',
    answer:
      'Ya. Anda boleh mengubah lantikan pada bila-bila masa sama ada terus di dalam halaman Jawatankuasa (ruang kerja jawatankuasa) ataupun melalui halaman Beban Tugas dengan menekan butang Lihat Butiran pada baris guru berkenaan, kemudian klik ikon sunting untuk menukar guru pengganti, peranan, atau membuang tugasan.',
  },
  {
    id: 'faq-10',
    category: 'Buku Pengurusan',
    question: 'Apakah yang berlaku jika saya mengemas kini maklumat sekolah atau guru selepas buku dijana?',
    answer:
      'Book Builder mempunyai Pautan Data Langsung. Seksyen yang belum disunting secara manual akan dikemas kini secara automatik mengikut data terkini pangkalan data. Bagi seksyen yang telah anda sunting secara manual, sistem melindungi suntingan anda daripada tertimpa dan memaparkan pemberitahuan serta ikon segar semula (sync) di panel kiri sekiranya anda mahu memuat semula data baharu.',
  },
  {
    id: 'faq-11',
    category: 'Buku Pengurusan',
    question: 'Di manakah saya boleh mencari dokumen Buku Pengurusan yang telah dijana sebelum ini?',
    answer:
      'Semua dokumen yang dieksport ke format .DOCX atau dicetak/disimpan sebagai PDF dari Book Builder akan direkodkan dalam bahagian Sejarah Penerbitan Buku di halaman Janaan Buku (/reports). Anda boleh mengklik mana-mana rekod untuk membukanya semula dalam Book Builder atau menekan ikon muat turun untuk mendapatkan salinan fail.',
  },
  {
    id: 'faq-12',
    category: 'Kolaborasi',
    question: 'Bolehkah ahli sekolah lain melihat kemas kini yang saya lakukan?',
    answer:
      'Ya. Semua rekod sekolah seperti Profil Sekolah, Warga Sekolah, Jawatankuasa, Pengagihan Tugas, Acara Takwim, draf Buku Pengurusan, komen semakan, dan Sejarah Penerbitan Buku dikongsi dalam ruang kerja sekolah yang sama supaya pentadbir dan penyelaras dapat bekerjasama secara selaras.',
  },
  {
    id: 'faq-13',
    category: 'Notifikasi & Mesej',
    question: 'Mengapa saya tidak melihat sebarang senarai penerima dalam Mesej atau notifikasi baharu?',
    answer:
      'Ciri Mesej dan Notifikasi hanya memaparkan ahli atau jemputan yang dipautkan ke sekolah anda. Jika sekolah anda baru didaftarkan dan belum ada guru lain yang dijemput atau melengkapkan pendaftaran melalui pautan jemputan di halaman Tetapan, senarai warga dalam Mesej Baharu akan memaparkan status tiada ahli lain berdaftar lagi.',
  },
];

const WORKFLOW_STAGES = [
  {
    stage: 'Peringkat 1',
    title: 'Persediaan Asas',
    modules: 'Log Masuk • Profil Sekolah • Warga Sekolah',
    summary:
      'Daftar akaun pentadbir, lengkapkan identiti serta logo rasmi sekolah, dan masukkan senarai penuh guru serta AKP (secara terus atau muat naik CSV).',
    output: 'Pangkalan data rasmi sekolah dan direktori warga aktif tersedia.',
  },
  {
    stage: 'Peringkat 2',
    title: 'Struktur Pengurusan',
    modules: 'Jawatankuasa (Jawatankuasa Besar & Kecil)',
    summary:
      'Sediakan kategori Jawatankuasa Besar (Pentadbiran, Kurikulum, HEM, Kokurikulum) berserta Jawatankuasa Kecil, slot jawatan, dan huraian bidang tugas.',
    output: 'Rangka organisasi jawatankuasa sekolah tersusun mengikut kategori.',
  },
  {
    stage: 'Peringkat 3',
    title: 'Pengagihan Tugas',
    modules: 'Jawatankuasa • Enjin Auto Agih',
    summary:
      'Lantik guru ke jawatan yang ditetapkan sama ada secara manual atau menggunakan cadangan Auto Agih berdasarkan jawatan, opsyen, dan kesesuaian.',
    output: 'Setiap slot jawatan diisi dengan peranan dan mata pemberatan masing-masing.',
  },
  {
    stage: 'Peringkat 4',
    title: 'Semakan Beban Tugas',
    modules: 'Beban Tugas • Analisis & Laporan',
    summary:
      'Pantau taburan mata mengikut Jawatankuasa Besar, semak Mata Semasa dan Beban (%), kenal pasti staf berstatus Tinggi, dan laraskan tugasan jika perlu.',
    output: 'Agihan tugas seimbang dan mematuhi paras kapasiti sekolah.',
  },
  {
    stage: 'Peringkat 5',
    title: 'Penyediaan Buku Pengurusan',
    modules: 'Janaan Buku • Book Builder',
    summary:
      'Buka Editor Laras untuk menyemak bab yang dipautkan terus daripada modul sistem, reka muka hadapan, tambah catatan rasmi, dan semak komen pasukan.',
    output: 'Draf lengkap Buku Pengurusan Sekolah disahkan dan disimpan.',
  },
  {
    stage: 'Peringkat 6',
    title: 'Penjanaan & Penyimpanan',
    modules: 'Eksport .DOCX / PDF • Sejarah Janaan Buku',
    summary:
      'Eksport dokumen akhir ke format .DOCX atau cetak ke PDF. Setiap janaan direkodkan secara automatik dalam Sejarah Penerbitan Buku untuk rujukan semula.',
    output: 'Dokumen rasmi sedia dicetak dan arkib versi tersimpan selamat.',
  },
];

function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'success';
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      wrap: 'bg-slate-50 border-slate-200 text-slate-700',
      icon: <Info size={15} className="text-ink shrink-0 mt-0.5" />,
      title: 'text-ink',
    },
    warning: {
      wrap: 'bg-amber/10 border-amber/30 text-slate-700',
      icon: <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />,
      title: 'text-amber-900',
    },
    success: {
      wrap: 'bg-forest/10 border-forest/20 text-slate-700',
      icon: <CheckCircle2 size={15} className="text-forest shrink-0 mt-0.5" />,
      title: 'text-forest',
    },
  }[type];

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 text-xs leading-relaxed ${styles.wrap}`}>
      {styles.icon}
      <div className="space-y-1">
        <p className={`font-semibold ${styles.title}`}>{title}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}

function ModuleGuideGrid({
  tujuan,
  fungsiUtama,
  caraPenggunaan,
  perkaraPenting,
  hasil,
}: {
  tujuan: string;
  fungsiUtama: string[];
  caraPenggunaan: string[];
  perkaraPenting: string[];
  hasil: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tujuan Modul</p>
        <p className="text-xs sm:text-[13px] text-ink leading-relaxed">{tujuan}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Fungsi Utama
          </p>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
            {fungsiUtama.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0 mt-1.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Cara Penggunaan
          </p>
          <ol className="space-y-2 text-xs text-slate-600 leading-relaxed">
            {caraPenggunaan.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-md bg-slate-100 border border-slate-200 text-ink font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Callout type="warning" title="Perkara Penting">
          <ul className="space-y-1.5 mt-1">
            {perkaraPenting.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-700 font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Callout>

        <Callout type="success" title="Hasil Tindakan">
          <p className="mt-1">{hasil}</p>
        </Callout>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('pengenalan');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(HELP_SECTIONS.map((s) => [s.id, true]))
  );
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({ 'faq-1': true });

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return HELP_SECTIONS;
    return HELP_SECTIONS.filter((sec) => {
      const inTitle = sec.title.toLowerCase().includes(normalizedQuery);
      const inSub = sec.subtitle.toLowerCase().includes(normalizedQuery);
      const inKeywords = sec.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery));
      const inFaq =
        sec.id === 'faq' &&
        FAQ_ITEMS.some(
          (f) =>
            f.question.toLowerCase().includes(normalizedQuery) ||
            f.answer.toLowerCase().includes(normalizedQuery)
        );
      return inTitle || inSub || inKeywords || inFaq;
    });
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return FAQ_ITEMS;
    const matches = FAQ_ITEMS.filter(
      (f) =>
        f.question.toLowerCase().includes(normalizedQuery) ||
        f.answer.toLowerCase().includes(normalizedQuery) ||
        f.category.toLowerCase().includes(normalizedQuery)
    );
    return matches.length > 0 ? matches : FAQ_ITEMS;
  }, [normalizedQuery]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllSectionsExpanded = (expanded: boolean) => {
    setExpandedSections(Object.fromEntries(HELP_SECTIONS.map((s) => [s.id, expanded])));
  };

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const jumpToSection = (id: string) => {
    setActiveSectionId(id);
    setExpandedSections((prev) => ({ ...prev, [id]: true }));
    const el = document.getElementById(`help-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentIdx = filteredSections.findIndex((s) => s.id === activeSectionId);
  const prevSection = currentIdx > 0 ? filteredSections[currentIdx - 1] : null;
  const nextSection =
    currentIdx >= 0 && currentIdx < filteredSections.length - 1
      ? filteredSections[currentIdx + 1]
      : null;

  return (
    <div className="max-w-384 mx-auto space-y-5 lg:space-y-6 pb-8">
      {/* Page Header & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-ink mb-2.5">
              <HelpCircle size={13} />
              Pusat Bantuan &amp; Manual Pengguna LARAS
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Panduan Lengkap Pengurusan Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Rujukan rasmi untuk pentadbir sekolah dan guru mengurus maklumat sekolah, Warga Sekolah, Jawatankuasa, pengagihan tugas, semakan Beban Tugas, serta penerbitan Buku Pengurusan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAllSectionsExpanded(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Kembangkan Semua
            </button>
            <button
              type="button"
              onClick={() => setAllSectionsExpanded(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Kuncupkan Semua
            </button>
          </div>
        </div>

        {/* Help Topic Search */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik panduan, istilah atau fungsi (cth: Auto Agih, 120%, CSV, Book Builder, Sejarah Janaan)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-ink placeholder:text-slate-400 outline-none focus:bg-white focus:border-ink/40 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Padam carian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium mr-1">Topik pantas:</span>
            {['Auto Agih', '120%', 'CSV', 'Book Builder', 'Jemput Guru'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout: Sticky Table of Contents + Guide Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Table of Contents Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200 p-4 lg:sticky lg:top-0">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Isi Kandungan
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredSections.length} Bahagian
            </span>
          </div>

          {filteredSections.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Tiada topik panduan sepadan dengan carian anda.
            </p>
          ) : (
            <nav className="space-y-1 max-h-[68vh] overflow-y-auto pr-1 no-scrollbar">
              {filteredSections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jumpToSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? 'bg-ink text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-ink font-medium'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold shrink-0 ${
                        isActive ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      {sec.number}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        {/* Guide Body */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          {filteredSections.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
              <Search size={28} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-ink">Tiada hasil panduan ditemui</p>
              <p className="text-xs text-slate-500">
                Cuba kata kunci lain seperti <span className="font-semibold">Warga Sekolah</span>,{' '}
                <span className="font-semibold">Jawatankuasa</span>,{' '}
                <span className="font-semibold">Mata Semasa</span>, atau{' '}
                <span className="font-semibold">Buku Pengurusan</span>.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ink text-white text-xs font-semibold"
              >
                Tetapkan Semula Carian
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isOpen = Boolean(expandedSections[sec.id]);

              return (
                <section
                  key={sec.id}
                  id={`help-${sec.id}`}
                  onClick={() => setActiveSectionId(sec.id)}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden scroll-mt-4"
                >
                  {/* Section Header */}
                  <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      className="flex items-start sm:items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-ink shrink-0">
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Bahagian {sec.number}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-ink leading-snug">
                          {sec.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{sec.subtitle}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {sec.modulePath && (
                        <Link
                          to={sec.modulePath}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-ink transition-colors"
                        >
                          {sec.moduleLabel} <ArrowRight size={13} />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        aria-label={isOpen ? 'Kuncupkan bahagian' : 'Kembangkan bahagian'}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-ink"
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {isOpen && (
                    <div className="p-5 lg:p-6 space-y-5 text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      {/* 01. PENGENALAN LARAS + COMPLETE WORKFLOW */}
                      {sec.id === 'pengenalan' && (
                        <>
                          <div className="space-y-3">
                            <p>
                              <strong className="text-ink">LARAS</strong> ialah sistem pengurusan pentadbiran sekolah bersepadu yang direka khusus untuk membantu pihak pentadbir dan guru menyusun maklumat organisasi sekolah, mengagihkan jawatankuasa secara seimbang, memantau pemberatan tugas, serta menerbitkan <strong className="text-ink">Buku Pengurusan Sekolah</strong> dengan kemas dan teratur.
                            </p>
                            <p>
                              Daripada mengurus fail dan jadual secara berasingan yang mudah berlaku pertindihan nama atau ketidakseimbangan tugas, LARAS menghubungkan setiap maklumat daripada satu sumber data yang sama. Sebarang pengemaskinian pada senarai guru atau lantikan jawatankuasa akan terus digunakan dalam pengiraan <strong className="text-ink">Beban Tugas</strong> dan penyediaan kandungan <strong className="text-ink">Buku Pengurusan</strong>.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                              <p className="font-semibold text-ink mb-1">1. Data Berpusat</p>
                              <p className="text-xs text-slate-500">
                                Profil Sekolah, senarai Warga Sekolah, dan struktur Jawatankuasa disimpan dalam satu ruang kerja rasmi sekolah.
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                              <p className="font-semibold text-ink mb-1">2. Agihan Adil &amp; Telus</p>
                              <p className="text-xs text-slate-500">
                                Enjin Auto Agih dan jadual matriks Beban Tugas membantu memastikan tiada guru terbeban secara berlebihan.
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                              <p className="font-semibold text-ink mb-1">3. Penerbitan Pantas</p>
                              <p className="text-xs text-slate-500">
                                Book Builder menyusun bab buku secara automatik dan menyokong eksport terus ke fail .DOCX serta cetakan PDF.
                              </p>
                            </div>
                          </div>

                          {/* Complete 6-Stage End-to-End LARAS Workflow */}
                          <div className="pt-2 space-y-3">
                            <div>
                              <h3 className="text-sm font-semibold text-ink">
                                Aliran Kerja Lengkap LARAS (Dari Persediaan Hingga Penerbitan Buku)
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Hubungan aliran maklumat antara enam peringkat utama dalam sistem LARAS.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                              {WORKFLOW_STAGES.map((wf) => (
                                <div
                                  key={wf.stage}
                                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-3"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span className="px-2 py-0.5 rounded bg-ink text-white text-[10px] font-bold uppercase tracking-wider">
                                        {wf.stage}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                                        {wf.modules}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-ink mb-1">
                                      {wf.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      {wf.summary}
                                    </p>
                                  </div>
                                  <div className="pt-2.5 border-t border-slate-100 text-[11px] text-forest font-medium flex items-start gap-1.5">
                                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                                    <span>{wf.output}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Callout type="info" title="Kesan Perubahan Data Sumber terhadap Buku Pengurusan">
                              Jika anda mengemas kini maklumat dalam <strong className="text-ink">Profil Sekolah</strong>, <strong className="text-ink">Warga Sekolah</strong>, atau <strong className="text-ink">Jawatankuasa</strong> selepas draf buku dibuka, bahagian yang belum disunting manual akan diselaraskan secara automatik. Bahagian yang telah disunting manual pula akan memaparkan amaran kemas kini supaya anda boleh menyemak dan menyelaraskannya mengikut keperluan.
                            </Callout>
                          </div>
                        </>
                      )}

                      {/* 02. PANDUAN MEMULAKAN PENGGUNAAN */}
                      {sec.id === 'permulaan' && (
                        <>
                          <p>
                            Ikuti urutan persediaan di bawah bagi memastikan setiap modul dalam LARAS mempunyai data asas yang diperlukan sebelum anda menjana <strong className="text-ink">Buku Pengurusan Sekolah</strong>.
                          </p>

                          <div className="space-y-2.5">
                            {[
                              {
                                step: 'Langkah 1',
                                title: 'Log masuk atau daftar akaun sekolah',
                                badge: 'Wajib',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Daftar akaun baharu sebagai pentadbir sekolah (atau daftar melalui pautan jemputan jika dijemput oleh pentadbir sedia ada) supaya akaun anda dipautkan ke ruang kerja sekolah yang sah.',
                              },
                              {
                                step: 'Langkah 2',
                                title: 'Lengkapkan maklumat Profil Sekolah',
                                badge: 'Wajib',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Isi nama sekolah, kod sekolah, alamat, sesi akademik semasa (contohnya 2026/2027), logo rasmi sekolah, serta kenyataan visi dan misi. Maklumat ini menjadi asas muka hadapan dan bab pengenalan buku.',
                              },
                              {
                                step: 'Langkah 3',
                                title: 'Tambahkan maklumat Warga Sekolah',
                                badge: 'Wajib',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Masukkan senarai guru dan anggota kumpulan pelaksana (AKP) sama ada satu per satu atau melalui muat naik fail CSV. Pastikan medan Jawatan, Gred, Jenis (Guru/Sokongan), dan Opsyen Dominan dilengkapkan untuk ketepatan agihan.',
                              },
                              {
                                step: 'Langkah 4',
                                title: 'Sediakan struktur Jawatankuasa',
                                badge: 'Wajib',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Bina atau susun Jawatankuasa Besar (Pentadbiran, Kurikulum, HEM, Kokurikulum) bersama Jawatankuasa Kecil dan jawatan yang diperlukan bagi setiap unit.',
                              },
                              {
                                step: 'Langkah 5',
                                title: 'Agihkan guru kepada jawatankuasa dan bidang tugas',
                                badge: 'Wajib',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Lantik guru ke jawatan dalam setiap jawatankuasa secara manual atau gunakan butang Jana Agihan Automatik (Auto Agih) untuk menjana cadangan lantikan yang boleh disemak sebelum disahkan.',
                              },
                              {
                                step: 'Langkah 6',
                                title: 'Semak pengagihan melalui Beban Tugas',
                                badge: 'Disyorkan',
                                badgeCls: 'bg-forest/15 text-forest border border-forest/20',
                                desc: 'Buka halaman Beban Tugas untuk menyemak jumlah mata dan peratusan beban setiap guru. Lakukan pelarasan jika ada guru berstatus Tinggi (>100%) atau masih tiada tugasan.',
                              },
                              {
                                step: 'Langkah 7',
                                title: 'Lengkapkan kandungan Buku Pengurusan dalam Book Builder',
                                badge: 'Wajib Sebelum Eksport',
                                badgeCls: 'bg-ink text-white',
                                desc: 'Buka Book Builder, pilih reka bentuk muka hadapan, semak setiap bab yang dijana daripada pangkalan data, dan tambah catatan atau teks tambahan pada bahagian templat.',
                              },
                              {
                                step: 'Langkah 8',
                                title: 'Jana, semak, dan simpan dokumen akhir',
                                badge: 'Langkah Akhir',
                                badgeCls: 'bg-slate-100 text-slate-700 border border-slate-200',
                                desc: 'Eksport dokumen akhir ke format .DOCX atau cetak ke PDF. Rekod janaan akan disimpan secara automatik dalam Sejarah Penerbitan Buku.',
                              },
                            ].map((item) => (
                              <div
                                key={item.step}
                                className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                      {item.step}
                                    </span>
                                    <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.badgeCls}`}
                                    >
                                      {item.badge}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Callout type="info" title="Langkah yang Boleh Dilengkapkan Kemudian">
                            Pengisian acara dalam <strong className="text-ink">Kalendar &amp; Takwim</strong>, jemputan akaun guru lain melalui <strong className="text-ink">Tetapan</strong>, penggunaan <strong className="text-ink">Mesej</strong> dalaman, serta semakan komen kolaborasi boleh dilakukan secara berperingkat pada bila-bila masa tanpa menyekat persediaan struktur asas jawatankuasa.
                          </Callout>
                        </>
                      )}

                      {/* 03. PROFIL SEKOLAH */}
                      {sec.id === 'profil-sekolah' && (
                        <ModuleGuideGrid
                          tujuan="Menyimpan dan mengurus maklumat rasmi sekolah yang menjadi identiti utama sistem serta sumber rujukan automatik bagi penerbitan Buku Pengurusan Sekolah."
                          fungsiUtama={[
                            'Memaparkan dan mengemas kini maklumat asas sekolah seperti nama sekolah, kod sekolah, alamat, nombor telefon, e-mel rasmi, dan sesi akademik semasa.',
                            'Memuat naik atau menukar logo rasmi sekolah untuk dipaparkan pada muka hadapan dan kepala surat rasmi Buku Pengurusan.',
                            'Mengurus kenyataan rasmi sekolah termasuk Visi, Misi, Moto, dan maklumat pentadbiran sekolah.',
                          ]}
                          caraPenggunaan={[
                            'Klik menu Profil Sekolah di bawah bahagian Organisasi pada bar sisi kiri.',
                            'Semak semua medan maklumat sedia ada dan kemas kini butiran yang diperlukan mengikut sesi semasa.',
                            'Untuk memuat naik atau menukar logo sekolah, klik ruangan muat naik logo dan pilih fail imej rasmi sekolah.',
                            'Klik butang Simpan Perubahan untuk merekodkan semua kemas kini ke dalam pangkalan data sekolah.',
                          ]}
                          perkaraPenting={[
                            'Pastikan medan Sesi Akademik (contohnya 2026/2027) ditetapkan dengan tepat kerana nilai ini digunakan sebagai lalai semasa lantikan jawatankuasa dan penjanaan buku.',
                            'Gunakan imej logo sekolah yang jelas dan berlatar belakang kemas supaya paparan cetakan Buku Pengurusan kelihatan profesional.',
                          ]}
                          hasil="Semua maklumat dan logo sekolah yang disimpan akan dipautkan terus ke modul Book Builder dan dipaparkan secara konsisten pada bahagian maklumat asas sekolah."
                        />
                      )}

                      {/* 04. WARGA SEKOLAH */}
                      {sec.id === 'warga-sekolah' && (
                        <ModuleGuideGrid
                          tujuan="Merekod, menyusun, dan mengurus pangkalan data lengkap guru serta staf sokongan (AKP) yang berkhidmat di sekolah."
                          fungsiUtama={[
                            'Menambah rekod warga sekolah baharu secara manual melalui borang maklumat staf.',
                            'Mengimport senarai warga sekolah secara pukal menggunakan fail CSV mengikut format lajur sistem.',
                            'Menyunting butiran sedia ada seperti nama penuh, jantina, gred jawatan, jawatan rasmi, jenis perkhidmatan (Guru / Sokongan), opsyen dominan, dan status aktif.',
                            'Mencari dan menapis senarai warga sekolah dengan pantas menggunakan bar carian.',
                          ]}
                          caraPenggunaan={[
                            'Buka halaman Warga Sekolah daripada menu Organisasi.',
                            'Untuk menambah seorang staf, klik butang tambah staf baharu, isi maklumat diperlukan, dan simpan.',
                            'Untuk memuat naik senarai ramai staf serentak, gunakan fungsi Import CSV, pastikan susunan lajur menepati format (seperti BIL, NAMA, JANTINA, GRED, JAWATAN, OPSYEN DOMINAN), dan sahkan muat naik.',
                            'Untuk mengemas kini rekod sedia ada, klik pada nama atau butang sunting pada baris staf berkenaan dan simpan perubahan.',
                          ]}
                          perkaraPenting={[
                            'Dashboard memantau kelengkapan tiga medan utama bagi setiap staf: Jawatan, Gred, dan Jenis (Guru/Sokongan). Rekod yang tidak lengkap akan disenaraikan dalam bahagian Staf perlu perhatian.',
                            'Enjin Auto Agih hanya memilih warga berstatus aktif dan menggunakan maklumat Jawatan serta Opsyen Dominan untuk menentukan kesesuaian lantikan jawatankuasa.',
                          ]}
                          hasil="Senarai warga sekolah yang lengkap dan aktif akan tersedia untuk dilantik ke dalam Jawatankuasa, dikira dalam Beban Tugas, serta dipaparkan dalam Direktori Warga Buku Pengurusan."
                        />
                      )}

                      {/* 05. JAWATANKUASA */}
                      {sec.id === 'jawatankuasa' && (
                        <ModuleGuideGrid
                          tujuan="Membina dan mengurus struktur organisasi jawatankuasa sekolah secara berhierarki daripada peringkat induk hingga ke unit khusus."
                          fungsiUtama={[
                            'Menyusun jawatankuasa mengikut Jawatankuasa Besar seperti Pentadbiran, Kurikulum, Hal Ehwal Murid (HEM), dan Kokurikulum.',
                            'Mewujudkan dan mengurus Jawatankuasa Kecil di bawah setiap Jawatankuasa Besar (contohnya Panitia Mata Pelajaran di bawah Kurikulum atau Unit Disiplin di bawah HEM).',
                            'Menetapkan senarai jawatan dalam setiap jawatankuasa serta merekodkan huraian Bidang Tugas bagi setiap jawatankuasa.',
                            'Membuka ruang kerja jawatankuasa untuk melantik, menyunting, atau mengeluarkan ahli jawatankuasa.',
                          ]}
                          caraPenggunaan={[
                            'Klik menu Jawatankuasa pada bar sisi kiri untuk melihat keseluruhan kategori dan senarai jawatankuasa sekolah.',
                            'Pilih Jawatankuasa Besar yang berkaitan atau cipta jawatankuasa baharu melalui butang tambah jawatankuasa.',
                            'Tetapkan nama jawatankuasa, kategori induk, serta senarai jawatan dan bidang tugas yang berkaitan.',
                            'Klik pada mana-mana jawatankuasa untuk membuka ruang kerjanya bagi menambah ahli dan menyemak susunan jawatan.',
                          ]}
                          perkaraPenting={[
                            'Jawatankuasa Besar bertindak sebagai kategori induk yang membentuk bab utama dalam Buku Pengurusan serta lajur utama dalam jadual matriks Beban Tugas.',
                            'Jawatankuasa Kecil ialah unit pelaksanaan di bawah Jawatankuasa Besar tersebut. Memastikan setiap Jawatankuasa Kecil diletakkan di bawah kategori induk yang betul sangat penting supaya pengiraan beban dan susunan buku tepat.',
                          ]}
                          hasil="Struktur organisasi jawatankuasa sekolah terbentuk dengan jelas dan bersedia untuk proses pelantikan guru serta penjanaan bab Jawatankuasa & Bidang Tugas dalam Buku Pengurusan."
                        />
                      )}

                      {/* 06. PENGAGIHAN TUGAS */}
                      {sec.id === 'pengagihan-tugas' && (
                        <ModuleGuideGrid
                          tujuan="Melantik guru dan staf ke jawatan dalam setiap jawatankuasa secara teratur, sama ada melalui pelantikan manual ataupun cadangan automatik."
                          fungsiUtama={[
                            'Pelantikan manual: Memilih warga sekolah aktif untuk mengisi jawatan tertentu (contohnya Pengerusi, Setiausaha, Penyelaras, Ahli Jawatankuasa) berserta mata pemberatan.',
                            'Pengagihan automatik (Auto Agih): Menjana cadangan pelantikan ke jawatan kosong secara serentak menggunakan enjin peraturan LARAS.',
                            'Semakan & suntingan sebelum pengesahan: Menukar calon guru yang dicadangkan dan memantau kesan unjuran Beban (%) secara langsung sebelum disimpan.',
                            'Pengurusan lantikan sedia ada: Menyunting peranan atau memindahkan tugasan kepada guru pengganti.',
                          ]}
                          caraPenggunaan={[
                            'Pastikan struktur Jawatankuasa Besar dan Jawatankuasa Kecil telah disediakan bersama slot jawatan yang diperlukan.',
                            'Untuk lantikan manual: Buka jawatankuasa berkaitan, klik butang tambah ahli, cari nama staf, pilih peranan, tetapkan mata pemberatan, dan simpan.',
                            'Untuk agihan automatik: Buka halaman Beban Tugas dan klik butang Jana Agihan Automatik.',
                            'Dalam tetingkap Semakan & Suntingan Agihan, semak setiap cadangan lantikan, tukar pilihan guru melalui menu pilihan jika perlu, dan klik simpan untuk mengesahkan agihan.',
                          ]}
                          perkaraPenting={[
                            'Sistem menghalang pelantikan berganda bagi individu yang sama di dalam satu jawatankuasa yang sama.',
                            'Enjin Auto Agih mengambil kira jawatan rasmi (seperti PK, GKMP, Ketua Panitia), kesesuaian opsyen/bidang, had beban maksimum 120%, dan pengecualian pengurusan tertinggi daripada slot rutin.',
                            'Cadangan Auto Agih tidak akan mengubah pangkalan data sehingga pentadbir menekan butang pengesahan simpan.',
                          ]}
                          hasil="Setiap jawatankuasa mempunyai senarai ahli dan peranan yang sah, manakala mata pemberatan setiap guru dikemas kini secara automatik dalam modul Beban Tugas."
                        />
                      )}

                      {/* 07. BEBAN TUGAS */}
                      {sec.id === 'beban-tugas' && (
                        <>
                          <ModuleGuideGrid
                            tujuan="Memantau, menilai, dan mengimbangi taburan pemberatan tugas setiap warga sekolah merentas semua Jawatankuasa Besar secara telus."
                            fungsiUtama={[
                              'Memaparkan kad ringkasan KPI: Purata Beban Guru (%), Taburan Status Warga (Tinggi, Seimbang, Rendah), Pemberatan Tertinggi, dan Pemberatan Terendah.',
                              'Menyediakan jadual matriks rentas Jawatankuasa Besar yang memaparkan peranan setiap guru dalam setiap kategori utama.',
                              'Menapis senarai warga mengikut status beban (Semua, Tinggi, Seimbang, Rendah), jenis staf (Semua, Guru, Sokongan), atau carian nama/peranan.',
                              'Membuka butiran penuh tugasan seseorang guru untuk menyunting peranan, menukar guru pengganti, atau membuang tugasan.',
                              'Melaraskan Mata Rujukan 100% dan mata pemberatan mengikut jawatan melalui panel Tetapan Beban.',
                            ]}
                            caraPenggunaan={[
                              'Klik menu Beban Tugas di bawah bahagian Pemberatan & Laporan.',
                              'Gunakan tab tapisan di bahagian atas jadual untuk mengenal pasti guru berstatus Tinggi atau Rendah.',
                              'Tatal jadual secara mendatar untuk membandingkan penglibatan guru merentas lajur Jawatankuasa Besar.',
                              'Klik butang Lihat Butiran pada lajur Tindakan untuk membuka senarai lengkap jawatankuasa yang dianggotai oleh guru tersebut.',
                              'Dalam tetingkap butiran, klik ikon sunting untuk menukar warga pengganti atau peranan, atau klik Tetapan Beban di penjuru kanan atas jika perlu melaraskan mata rujukan sekolah.',
                            ]}
                            perkaraPenting={[
                              'Formula Beban (%): Peratusan beban dikira sebagai (Mata Semasa ÷ Mata Rujukan 100%) × 100, dibundarkan kepada nombor bulat terdekat. Nilai lalai Mata Rujukan 100% ialah 20 mata.',
                              'Contoh pengiraan tepat: Jika Mata Rujukan 100% ialah 20 mata dan seseorang guru memegang 1 jawatan Setiausaha (10 mata) serta 2 jawatan Ahli Jawatankuasa (5 mata setiap satu), maka Mata Semasa = 10 + 5 + 5 = 20 mata, dan Beban (%) = (20 ÷ 20) × 100 = 100%.',
                              'Had Kapasiti 120%: Enjin Auto Agih menetapkan had maksimum 120% (bersamaan 24 mata bagi rujukan 20 mata) bagi mengelakkan sesuatu cadangan automatik membebankan guru secara berlebihan.',
                              'Pengecualian & Pemberatan Khas Pengurusan (Ex-Officio): Pengurusan tertinggi seperti Pengetua dan Penolong Kanan dikecualikan daripada pengisian slot rutin oleh Auto Agih, serta mempunyai pemberatan khas ex-officio apabila memegang peranan Pengerusi atau Timbalan Pengerusi.',
                            ]}
                            hasil="Pentadbir memperoleh gambaran menyeluruh tentang keseimbangan tugas sekolah dan dapat melakukan pelarasan terus sebelum menerbitkan Buku Pengurusan."
                          />

                          {/* Detailed Table Structure & Visual Interpretation Guide */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 lg:p-5 space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-ink">
                                Panduan Membaca Jadual Matriks Beban Tugas
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Penjelasan setiap lajur dan penunjuk visual dalam jadual utama Pengurus Beban Tugas.
                              </p>
                            </div>

                            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-3.5 py-2.5 w-44">Lajur Jadual</th>
                                    <th className="px-3.5 py-2.5">Maksud &amp; Cara Mentafsir</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">Bil.</td>
                                    <td className="px-3.5 py-2.5">
                                      Nombor turutan warga sekolah mengikut senarai tapisan semasa (kekal melekat di sebelah kiri semasa jadual ditatal).
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">Nama &amp; Jawatan</td>
                                    <td className="px-3.5 py-2.5">
                                      Memaparkan nama penuh warga sekolah berserta jawatan rasmi dan gred perkhidmatan mereka.
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">
                                      Lajur Jawatankuasa Besar
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      Lajur dinamik bagi setiap kategori Jawatankuasa Besar (contohnya Pentadbiran, Kurikulum, HEM, Kokurikulum). Setiap sel memaparkan lencana peranan dan nama Jawatankuasa Kecil yang dianggotai dalam kategori tersebut. Lencana berlatar gelap menandakan peranan kepimpinan/penyelarasan (Pengerusi, Setiausaha, Penyelaras, Ketua), manakala lencana cerah menandakan peranan ahli biasa.
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">Mata Semasa</td>
                                    <td className="px-3.5 py-2.5">
                                      Jumlah terkumpul mata pemberatan daripada semua jawatankuasa yang dianggotai berbanding Mata Rujukan 100% sekolah (contoh: <span className="font-semibold text-ink">15 / 20</span>).
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">Beban (%)</td>
                                    <td className="px-3.5 py-2.5">
                                      Peratusan beban tugas semasa dengan kod warna status: <span className="font-semibold text-rose">Merah (&gt;100% — Tinggi)</span>, <span className="font-semibold text-forest">Hijau (50%–100% — Seimbang)</span>, dan <span className="font-semibold text-sky">Biru (&lt;50% — Rendah)</span>. Pada Dashboard, bar kemajuan beban kerja turut memaparkan nisbah visual kapasiti kerja setiap staf.
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3.5 py-2.5 font-semibold text-ink">Tindakan</td>
                                    <td className="px-3.5 py-2.5">
                                      Butang <span className="font-semibold text-ink">Lihat Butiran →</span> untuk membuka senarai pecahan setiap jawatankuasa, mata individu bagi setiap lantikan, serta fungsi sunting atau buang tugasan.
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}

                      {/* 08. BUKU PENGURUSAN */}
                      {sec.id === 'buku-pengurusan' && (
                        <ModuleGuideGrid
                          tujuan="Menyusun, menyunting, dan menerbitkan Buku Pengurusan Sekolah yang menggabungkan data langsung sistem dengan kandungan rasmi sekolah dalam satu editor dokumen."
                          fungsiUtama={[
                            'Pautan Data Langsung: Mengisi maklumat Profil Sekolah, Direktori Warga Sekolah, serta senarai Jawatankuasa & Bidang Tugas secara automatik daripada modul berkaitan.',
                            'Reka Muka Hadapan: Memilih templat muka hadapan rasmi, warna tema utama/aksen, fon tajuk dan kandungan, serta gaya jadual.',
                            'Penyuntingan Teks & Jadual: Menambah atau menyunting teks, jadual, pemisah halaman, dan maklumat khusus pada bahagian templat.',
                            'Komen & Semakan Pasukan: Menyerlahkan teks tertentu untuk menambah komen semakan, menandakan komen sebagai selesai, atau memadam komen.',
                            'Eksport & Cetakan: Mengeksport dokumen ke fail .DOCX yang boleh disunting atau mencetak/menyimpan sebagai PDF lengkap dengan Isi Kandungan.',
                          ]}
                          caraPenggunaan={[
                            'Klik menu Janaan Buku pada bar sisi kiri dan pilih templat penerbitan (seperti Buku Pengurusan Sekolah (Lengkap) atau Lampiran Senarai Jawatankuasa & Bidang Tugas), kemudian klik Buka Editor Laras.',
                            'Gunakan panel Struktur Buku di sebelah kiri untuk menavigasi antara bab dokumen dan memantau status setiap seksyen (Pautan Langsung, Templat, atau Disunting Manual).',
                            'Klik butang Reka Muka Hadapan untuk menyesuaikan penampilan muka hadapan, warna rasmi, dan gaya jadual dokumen.',
                            'Semak kandungan setiap bab, lakukan penyuntingan jika perlu, dan klik Simpan Draf untuk memastikan draf terkini tersimpan.',
                            'Apabila dokumen sedia, klik Eksport .DOCX untuk memuat turun fail Word atau klik Cetak / PDF untuk menjana versi cetakan PDF.',
                          ]}
                          perkaraPenting={[
                            'Sentiasa lengkapkan dan semak data di modul Profil Sekolah, Warga Sekolah, dan Jawatankuasa sebelum memulakan suntingan manual akhir di Book Builder.',
                            'Jika anda menyunting sesuatu bab secara manual, sistem akan melindunginya daripada tertimpa secara automatik apabila data pangkalan data berubah. Sekiranya data sumber dikemas kini kemudian, ikon segar semula akan muncul di sebelah nama bab pada panel kiri.',
                            'Butang Jana Semula Semua akan membina semula keseluruhan dokumen daripada data terkini sistem dan menggantikan semua suntingan manual sedia ada.',
                          ]}
                          hasil="Dokumen rasmi Buku Pengurusan Sekolah berjaya disediakan, disimpan sebagai draf rasmi sekolah, dan dieksport dalam format .DOCX atau PDF."
                        />
                      )}

                      {/* 09. SEJARAH JANAAN BUKU */}
                      {sec.id === 'sejarah-janaan' && (
                        <ModuleGuideGrid
                          tujuan="Menyimpan arkib versi dokumen Buku Pengurusan yang telah dieksport atau dicetak supaya ahli sekolah dapat merujuk, menyemak, dan memuat turun semula versi terdahulu."
                          fungsiUtama={[
                            'Merekodkan setiap aktiviti eksport .DOCX atau cetakan PDF dari Book Builder secara automatik lengkap dengan nombor versi (contoh: v1, v2), sesi akademik, saiz fail, dan cap masa janaan.',
                            'Memaparkan nama sekolah, sesi penerbitan, dan nama pengguna yang menjana versi tersebut apabila kursor diarahkan pada rekod.',
                            'Membolehkan pengguna membuka semula mana-mana versi terdahulu di dalam Book Builder untuk semakan.',
                            'Menyediakan butang muat turun semula terus daripada senarai Sejarah Penerbitan Buku.',
                          ]}
                          caraPenggunaan={[
                            'Klik menu Janaan Buku di bawah bahagian Penerbitan pada bar sisi kiri.',
                            'Lihat panel Sejarah Penerbitan Buku di bahagian kanan halaman untuk menyemak senarai Versi Terkini.',
                            'Klik pada mana-mana rekod janaan untuk membuka paparan versi tersebut di dalam Book Builder.',
                            'Atau gerakkan kursor pada rekod berkenaan dan klik ikon muat turun di sebelah kanan untuk mendapatkan semula salinan fail.',
                          ]}
                          perkaraPenting={[
                            'Rekod sejarah dikongsi dalam ruang kerja sekolah yang sama dan dikemas kini secara langsung apabila mana-mana pentadbir atau penyelaras menjana versi baharu.',
                            'Sistem menyimpan sehingga 10 salinan snapshot janaan terkini bersama metadata penjanaan bagi memudahkan pemulihan versi.',
                          ]}
                          hasil="Setiap terbitan rasmi Buku Pengurusan Sekolah mempunyai jejak rekod yang jelas, mudah dicapai semula oleh pasukan pentadbiran, dan mengelakkan kekeliruan antara versi draf."
                        />
                      )}

                      {/* 10. KALENDAR */}
                      {sec.id === 'kalendar' && (
                        <ModuleGuideGrid
                          tujuan="Mengurus takwim dan acara rasmi sekolah secara berpusat terus melalui paparan kalendar pada halaman Dashboard."
                          fungsiUtama={[
                            'Paparan kalendar bulanan interaktif yang menandakan tarikh-tarikh yang mempunyai acara rasmi sekolah.',
                            'Navigasi pantas antara bulan sebelumnya dan bulan berikutnya serta pemilihan mana-mana tarikh untuk melihat jadual harian.',
                            'Mencipta, menyunting, dan memadam acara takwim lengkap dengan tajuk acara, tarikh, masa mula, masa tamat, label warna kategori (Umum, Mesyuarat, Peringatan, Lokasi / Luar), dan catatan tambahan.',
                          ]}
                          caraPenggunaan={[
                            'Buka halaman Dashboard untuk melihat komponen kalendar bulanan dan senarai acara harian di panel kanan.',
                            'Gunakan butang anak panah pada kalendar untuk menukar bulan, dan klik pada tarikh yang dikehendaki.',
                            'Klik ikon tambah (+) di sebelah paparan tarikh terpilih untuk membuka borang Tambah Acara Takwim.',
                            'Isi Tajuk Acara, Tarikh, Masa (pilihan), pilih Label Warna, masukkan catatan jika ada, dan klik Simpan.',
                            'Untuk mengemas kini atau memadam acara sedia ada, gunakan ikon pensel (Sunting) atau ikon tong sampah (Padam) pada kad acara berkenaan.',
                          ]}
                          perkaraPenting={[
                            'Semua acara yang ditambah dipautkan kepada sekolah anda dan dapat dilihat oleh ahli sekolah lain yang mempunyai akses.',
                            'Pentadbir sekolah dan pencipta acara asal boleh menyunting atau memadam acara yang telah direkodkan.',
                          ]}
                          hasil="Takwim aktiviti dan mesyuarat sekolah tersusun kemas pada Dashboard untuk rujukan harian seluruh warga sekolah."
                        />
                      )}

                      {/* 11. NOTIFIKASI & AKTIVITI */}
                      {sec.id === 'notifikasi' && (
                        <ModuleGuideGrid
                          tujuan="Memaklumkan pengguna tentang perkembangan penting dalam ruang kerja sekolah serta menyediakan ketelusan aktiviti pentadbiran."
                          fungsiUtama={[
                            'Ikon loceng Notifikasi di bar atas memaparkan pemberitahuan berkaitan janaan buku, jemputan staf, dan acara takwim sekolah.',
                            'Penunjuk titik berwarna pada ikon loceng menandakan terdapat pemberitahuan atau kemas kini baharu yang perlu disemak.',
                            'Dashboard turut memaparkan status semasa sekolah secara langsung termasuk kesediaan Buku Pengurusan, senarai Staf perlu perhatian, dan acara takwim terkini.',
                          ]}
                          caraPenggunaan={[
                            'Klik ikon loceng Notifikasi di bahagian kanan atas skrin pada mana-mana halaman.',
                            'Semak senarai pemberitahuan yang dipaparkan dalam tetingkap Notifikasi.',
                            'Rujuk bahagian ringkasan dan panel perhatian di Dashboard untuk memantau tindakan pentadbiran terkini yang memerlukan semakan.',
                          ]}
                          perkaraPenting={[
                            'Pemberitahuan berkaitan janaan buku, jemputan staf, dan takwim bergantung pada aktiviti yang berlaku dalam ruang kerja sekolah anda.',
                            'Jika tiada aktiviti baharu direkodkan lagi, tetingkap akan memaparkan status Tiada notifikasi baharu.',
                          ]}
                          hasil="Pengguna sentiasa peka terhadap perubahan terkini dalam pengurusan buku, status jemputan guru baharu, dan jadual sekolah."
                        />
                      )}

                      {/* 12. MESEJ */}
                      {sec.id === 'mesej' && (
                        <ModuleGuideGrid
                          tujuan="Menyediakan saluran komunikasi ringkas antara pentadbir dan warga sekolah yang berdaftar atau dijemput di bawah sekolah yang sama."
                          fungsiUtama={[
                            'Membuka panel Mesej daripada ikon sampul surat pada bar atas sistem.',
                            'Memaparkan senarai warga sekolah yang berdaftar serta guru yang telah dihantar jemputan pendaftaran.',
                            'Memulakan mesej baharu dengan ahli sekolah yang sah.',
                          ]}
                          caraPenggunaan={[
                            'Klik ikon sampul surat (Mesej) di bahagian kanan atas bar navigasi.',
                            'Pilih Mesej Baharu untuk melihat senarai warga sekolah dan guru dijemput yang tersedia.',
                            'Pilih penerima daripada senarai tersebut untuk memulakan komunikasi.',
                          ]}
                          perkaraPenting={[
                            'Hanya ahli yang dipautkan ke sekolah yang sama akan dipaparkan dalam senarai penerima.',
                            'Jika guru yang dijemput masih belum melengkapkan pendaftaran akaun melalui e-mel jemputan, status mereka akan dipaparkan sebagai menunggu pendaftaran akaun.',
                            'Sekiranya tiada guru lain yang dijemput atau didaftarkan di sekolah anda, sistem akan memaklumkan bahawa tiada ahli lain berdaftar lagi.',
                          ]}
                          hasil="Pentadbir dan guru dapat berhubung terus dalam persekitaran kerja sekolah tanpa perlu keluar daripada sistem LARAS."
                        />
                      )}

                      {/* 13. TETAPAN AKAUN */}
                      {sec.id === 'tetapan' && (
                        <ModuleGuideGrid
                          tujuan="Mengurus maklumat profil peribadi pengguna, menghantar dan memantau jemputan pendaftaran guru baharu, serta mengawal keselamatan sesi log masuk."
                          fungsiUtama={[
                            'Profil Anda: Menyemak dan mengemas kini maklumat asas akaun pengguna yang sedang log masuk.',
                            'Pengurusan Staf (Admin): Menghantar e-mel jemputan rasmi kepada guru atau staf baharu untuk menyertai sekolah (pautan pendaftaran sah selama 7 hari).',
                            'Sejarah & Status Jemputan: Menapis jemputan mengikut status (Semua, Menunggu, Diterima, Luput), menyalin pautan jemputan, menghantar semula jemputan, atau membatalkan jemputan aktif.',
                            'Keselamatan & Log Keluar: Menukar kata laluan melalui aliran pemulihan kata laluan dan menamatkan sesi menggunakan butang Log Keluar.',
                          ]}
                          caraPenggunaan={[
                            'Klik menu Tetapan di bahagian bawah bar sisi kiri (atau klik kad profil anda di penjuru kanan atas dan pilih Tetapan akaun).',
                            'Untuk menjemput guru baharu, pilih tab Pengurusan Staf (Admin), masukkan alamat e-mel rasmi guru, dan klik Hantar Jemputan.',
                            'Pantau status penerimaan di bawah Sejarah & Status Jemputan; gunakan butang Salin atau Hantar Semula jika guru memerlukan pautan pendaftaran semula.',
                            'Untuk keluar daripada sistem dengan selamat, klik butang Log Keluar di bahagian bawah bar sisi kiri atau pada menu profil di penjuru kanan atas.',
                          ]}
                          perkaraPenting={[
                            'Pautan jemputan pendaftaran guru sah selama 7 hari dari tarikh dihantar.',
                            'Demi keselamatan data sekolah, sistem akan menamatkan sesi secara automatik sekiranya tiada sebarang aktiviti dikesan selama 30 minit.',
                          ]}
                          hasil="Akses pengguna sekolah diurus secara terkawal dan guru baharu dapat menyertai ruang kerja sekolah yang tepat dengan selamat."
                        />
                      )}

                      {/* 14. SOALAN LAZIM (FAQ) */}
                      {sec.id === 'faq' && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500">
                            Klik pada mana-mana soalan di bawah untuk membaca jawapan terperinci berdasarkan fungsi sebenar dalam sistem LARAS.
                          </p>

                          <div className="space-y-2.5">
                            {filteredFaqs.map((item) => {
                              const isFaqOpen = Boolean(openFaqIds[item.id]);
                              return (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleFaq(item.id)}
                                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="space-y-1 min-w-0">
                                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        {item.category}
                                      </span>
                                      <p className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                                        {item.question}
                                      </p>
                                    </div>
                                    <span className="text-slate-400 shrink-0">
                                      {isFaqOpen ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </span>
                                  </button>

                                  {isFaqOpen && (
                                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-slate-50/40">
                                      {item.answer}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bottom Section Navigation */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          {prevSection && (
                            <button
                              type="button"
                              onClick={() => jumpToSection(prevSection.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
                            >
                              <ArrowLeft size={13} />
                              Sebelum: {prevSection.title}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {sec.modulePath && (
                            <Link
                              to={sec.modulePath}
                              className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-ink underline"
                            >
                              {sec.moduleLabel}
                            </Link>
                          )}
                          {nextSection && (
                            <button
                              type="button"
                              onClick={() => jumpToSection(nextSection.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:opacity-75 transition-opacity"
                            >
                              Seterusnya: {nextSection.title}
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}