import type { PositionSlotRule } from '../types/autoAssign';

export interface CommitteeTemplate {
  category: string;
  sub_category?: string;
  unit_code?: string;
  name: string;
  parent_committee_name?: string;
  description: string;
  senarai_tugas: string;
  sasaran_kerja: string;
  default_positions?: string[];
  position_slots?: PositionSlotRule[];
}

export const committeeTemplates: CommitteeTemplate[] = [
  // ==========================================
  // 1. PENGURUSAN PENTADBIRAN
  // ==========================================
  {
    category: "Pentadbiran",
    sub_category: "Pengurusan Induk Sekolah",
    unit_code: "1.1",
    name: "Jawatankuasa Pengurusan Sekolah (Induk)",
    description: "Merancang, menyelaras dan memantau pengoperasian sekolah berdasarkan dasar pendidikan, arahan KPM dan hala tuju sekolah.",
    senarai_tugas: "1. Menentukan dasar dan hala tuju sekolah.\n2. Merancang dan mengurus pengoperasian sekolah.\n3. Merancang dan mengawal pengurusan sumber di sekolah.\n4. Mengenal pasti dan menyelesaikan isu dan permasalahan di sekolah.\n5. Merancang, memantau, menilai dan menambah baik pelaksanaan program dan aktiviti sekolah.\n6. Membina hubungan seranta dengan ibu bapa, komuniti dan pihak yang berkepentingan.\n7. Melapor dan mendokumenkan program dan aktiviti sekolah.\n8. Mengurus dan menyelia pengoperasian bilik khas berkaitan kurikulum.\n9. Merancang, menyusun dan melaksanakan program-program dan aktiviti-aktiviti untuk meningkatkan tahap pencapaian sekolah.",
    sasaran_kerja: "1. Mengadakan mesyuarat sekurang-kurang satu (1) kali sebulan.\n2. Memastikan semua laporan program dan aktiviti dimuatnaik ke dalam GD sekolah dalam tempoh 2 minggu selepas program.\n3. Memastikan agihan tugas staf disediakan sebelum Mesyuarat Staf Bil 1.\n4. Memastikan persediaan pengoperasian sekolah siap siaga sebelum pembukaan sesi akademik.",
    default_positions: [
      "Pengerusi",
      "Tim. Pengerusi 1",
      "Tim. Pengerusi 2",
      "Tim. Pengerusi 3",
      "Tim. Pengerusi 5",
      "Tim. Pengerusi 6",
      "AJK"
    ],
    position_slots: [
      { slotKey: "pengurusan-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "pengurusan-tim1", slotOrder: 2, role: "Tim. Pengerusi 1", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "pengurusan-tim2", slotOrder: 3, role: "Tim. Pengerusi 2", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_HEM"] },
      { slotKey: "pengurusan-tim3", slotOrder: 4, role: "Tim. Pengerusi 3", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_KOKURIKULUM"] },
      { slotKey: "pengurusan-tim5", slotOrder: 5, role: "Tim. Pengerusi 5", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_PETANG"] },
      { slotKey: "pengurusan-tim6", slotOrder: 6, role: "Tim. Pengerusi 6", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_T6", "PK_PPKI"] },
      { slotKey: "pengurusan-ajk", slotOrder: 7, role: "AJK", weightage: 2, isLeadershipRole: true, preferredJawatan: ["GKMP", "KAUNSELOR"] }
    ]
  },
  {
    category: "Pentadbiran",
    sub_category: "Pengurusan Induk Sekolah",
    unit_code: "1.2",
    name: "Setiausaha Eksekutif Pengurusan",
    parent_committee_name: "Jawatankuasa Pengurusan Sekolah (Induk)",
    description: "Membantu pengurusan sekolah dalam merancang pengoperasian organisasi dan menyelaraskan tugas-tugas pelaksanaan.",
    senarai_tugas: "1. Membantu pengurusan sekolah dalam merancang pengoperasian organisasi.\n2. Menyelaras tugas-tugas dalam pelaksanaan pengoperasian organisasi dengan jawatankuasa, penyelaras-penyelaras, dan ketua-ketua.\n3. Membantu melaksanakan arahan pengoperasian organisasi dari semasa ke semasa.\n4. Membantu membuat pemantauan harian dalam pengoperasian organisasi.\n5. Membantu memantau kehadiran guru dalam program sekolah mengikut unit masing-masing.",
    sasaran_kerja: "1. Membantu memastikan 100% program peningkatan peratusan pelajar yang mencapai gred lulus dilaksanakan.\n2. Membantu memastikan 100% mesyuarat kurikulum diadakan mengikut jadual.\n3. Membantu memastikan 100% laporan kurikulum disediakan dan dihantar tepat pada masanya.",
    default_positions: [
      "SUE Kurikulum",
      "SUE HEM",
      "SUE Kokurikulum",
      "SUE Pengurusan Petang",
      "SUE Pengurusan T6",
      "SUE Pengurusan PPKI"
    ],
    position_slots: [
      { slotKey: "sue-kurikulum", slotOrder: 1, role: "SUE Kurikulum", weightage: 8, isLeadershipRole: true, preferredJawatan: ["SU_KURIKULUM", "GURU_BIASA"], preferredExpertise: ["Pengurusan Kurikulum", "Pentadbiran"] },
      { slotKey: "sue-hem", slotOrder: 2, role: "SUE HEM", weightage: 8, isLeadershipRole: true, preferredExpertise: ["HEM", "Pentadbiran"] },
      { slotKey: "sue-koko", slotOrder: 3, role: "SUE Kokurikulum", weightage: 8, isLeadershipRole: true, preferredExpertise: ["Kokurikulum", "Pentadbiran"] },
      { slotKey: "sue-petang", slotOrder: 4, role: "SUE Pengurusan Petang", weightage: 8, isLeadershipRole: true, requiredSession: "Petang" },
      { slotKey: "sue-t6", slotOrder: 5, role: "SUE Pengurusan T6", weightage: 8, isLeadershipRole: true, preferredForms: ["T6"] },
      { slotKey: "sue-ppki", slotOrder: 6, role: "SUE Pengurusan PPKI", weightage: 8, isLeadershipRole: true, preferredDepartments: ["PPKI", "Pendidikan Khas"] }
    ]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Persatuan Ibu Bapa – Guru (PIBG)",
    description: "Mengawal, menasihati, dan merancang aktiviti serta dana PIBG untuk pembangunan akademik, sahsiah, dan kemudahan sekolah.",
    senarai_tugas: "1. Mewakili pihak jabatan dan kementerian bagi mengawal dan menasihati PIBG.\n2. Menjalankan tugas berdasarkan perlembagaan PIBG dan mempengerusikan Mesyuarat Agung.\n3. Membantu Yang Dipertua dalam segala aspek perancangan pelaksanaan dan pengurusan PIBG.\n4. Bertanggungjawab sepenuhnya dalam semua urusan pentadbiran PIBG serta hal surat-menyurat, sistem fail, dan dokumen.\n5. Menguruskan kewangan persatuan seperti yang diputuskan oleh Mesyuarat Agung Tahunan atau Mesyuarat Jawatankuasa.",
    sasaran_kerja: "1. Mengadakan Mesyuarat Exco sekurang-kurangnya 3 kali setahun.\n2. Merancang dan melaksanakan sekurang-kurangnya 1 aktiviti yang melibatkan ibu bapa, komuniti atau pihak swasta.\n3. Memastikan 60% Ibubapa hadir dalam Mesyuarat Agung PIBG.\n4. Mengadakan sekurang-kurangnya 1 Program mengumpul dana setiap tahun.\n5. Memastikan 100% sumbangan Wajib Setiap Keluarga diagih untuk Peningkatan Akademik, Sahsiah, dan Kokurikulum.",
    default_positions: [
      "Penasihat (Ex-Officio)",
      "YDP PIBG",
      "Naib YDP PIBG 1",
      "Naib YDP PIBG 2",
      "Timbalan 1",
      "Timbalan 2",
      "Timbalan 3",
      "Timbalan 4",
      "Timbalan 5",
      "Setiausaha",
      "Penolong Setiausaha",
      "Penolong Setiausaha 1",
      "Bendahari",
      "Penolong Bendahari",
      "AJK Guru",
      "Juruaudit Dalaman",
      "AJK Ibu Bapa",
      "AJK Guru Lantikan Sekolah (Dalaman)"
    ],
    position_slots: [
      { slotKey: "pibg-penasihat", slotOrder: 1, role: "Penasihat (Ex-Officio)", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "pibg-tim1", slotOrder: 2, role: "Timbalan 1", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "pibg-tim2", slotOrder: 3, role: "Timbalan 2", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_HEM"] },
      { slotKey: "pibg-tim3", slotOrder: 4, role: "Timbalan 3", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_KOKURIKULUM"] },
      { slotKey: "pibg-su", slotOrder: 5, role: "Setiausaha", weightage: 8, isLeadershipRole: true, teachingStaffOnly: true },
      { slotKey: "pibg-psu", slotOrder: 6, role: "Penolong Setiausaha", weightage: 5, teachingStaffOnly: true },
      { slotKey: "pibg-bendahari", slotOrder: 7, role: "Bendahari", weightage: 6, isLeadershipRole: true, preferredSubjects: ["Prinsip Perakaunan", "Ekonomi", "Matematik"] },
      { slotKey: "pibg-ajk-guru", slotOrder: 8, role: "AJK Guru", weightage: 2, teachingStaffOnly: true },
      { slotKey: "pibg-audit", slotOrder: 9, role: "Juruaudit Dalaman", weightage: 3, preferredSubjects: ["Prinsip Perakaunan", "Matematik"] }
    ]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Pengurusan Maklumat Sekolah",
    description: "Menyelaras pengumpulan, pengesahan, pengemaskinian dan pelaporan data sekolah dalam sistem rasmi KPM.",
    senarai_tugas: "1. Menyelaras pengumpulan, pengesahan, pengemaskinian dan pelaporan data sekolah dalam sistem rasmi KPM.\n2. Memastikan maklumat murid, guru, anggota kumpulan pelaksana (AKP), kelas, enrolmen dan organisasi sekolah adalah tepat.\n3. Menyelaras pengurusan data dalam sistem berkaitan, termasuk APDM, e-Operasi dan sistem lain yang diarahkan KPM, mengikut akses serta fungsi yang diberikan.\n4. Menetapkan pegawai yang bertanggungjawab terhadap setiap jenis data dan memastikan kerahsiaan maklumat terpelihara.\n5. Menyediakan laporan data untuk mesyuarat pengurusan, perancangan sekolah dan permohonan sumber.",
    sasaran_kerja: "- 100% data wajib dikemas kini dalam tempoh yang ditetapkan oleh pihak berkuasa.\n- Sekurang-kurangnya 98% ketepatan data berdasarkan semakan silang dan pengesahan rekod.\n- Sekurang-kurangnya 4 semakan data menyeluruh dilaksanakan sepanjang tahun.\n- 100% kesilapan data yang dikenal pasti diperbetulkan dalam tempoh 5 hari bekerja atau mengikut arahan sistem.\n- Tiada pendedahan maklumat peribadi tanpa kebenaran yang sah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "jpms-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "jpms-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "jpms-penyelaras", slotOrder: 3, role: "Penyelaras", weightage: 8, isLeadershipRole: true, preferredSubjects: ["Sains Komputer", "ASK", "ICT"], preferredExpertise: ["Data", "APDM", "e-Operasi", "ICT"] },
      { slotKey: "jpms-su", slotOrder: 4, role: "Setiausaha", weightage: 8, isLeadershipRole: true, preferredExpertise: ["Data", "ICT"] },
      { slotKey: "jpms-ajk", slotOrder: 5, role: "AJK", weightage: 2, teachingStaffOnly: false }
    ]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Pengurusan Sumber Manusia",
    description: "Menyelaras rekod perjawatan, agihan tugas, keperluan guru dan AKP serta maklumat perkhidmatan.",
    senarai_tugas: "1. Menyelaras rekod perjawatan, agihan tugas, keperluan guru dan AKP serta maklumat perkhidmatan.\n2. Membantu pengurusan jadual bertugas, kehadiran, cuti, penggantian tugas dan penyusunan tenaga kerja mengikut peraturan semasa.\n3. Menyelaras urusan pembangunan profesional, latihan, SPLKPM dan program peningkatan kompetensi.\n4. Memantau urusan penilaian prestasi, keberhasilan, pengiktirafan dan pembangunan kerjaya mengikut ketetapan semasa.\n5. Mengurus dokumentasi perkhidmatan dan memastikan maklumat pegawai dikendalikan secara sulit.",
    sasaran_kerja: "- 100% rekod perjawatan dan maklumat tugas dikemas kini mengikut keperluan.\n- 100% pegawai yang berkenaan melengkapkan penilaian prestasi mengikut jadual rasmi.\n- Sekurang-kurangnya 90% guru dan AKP mencapai sasaran pembangunan profesional yang ditetapkan sekolah, tertakluk kepada keperluan tugas dan arahan semasa.\n- 100% urusan sumber manusia yang berada di bawah tanggungjawab sekolah diselesaikan dalam tempoh ditetapkan.\n- Sekurang-kurangnya 2 program kesejahteraan dan pembangunan profesional staf dilaksanakan setahun.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "AJK"]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Pengurusan Kewangan, Akaun dan Aset Sekolah",
    description: "Merancang dan memantau penggunaan peruntukan mengikut maksud belanja, peraturan kewangan serta arahan semasa KPM.",
    senarai_tugas: "1. Merancang dan memantau penggunaan peruntukan mengikut maksud belanja, peraturan kewangan serta arahan semasa KPM.\n2. Menyelaras penyediaan anggaran perbelanjaan, rekod transaksi, baucar, penyata dan dokumen sokongan.\n3. Memantau perbelanjaan panitia, program sekolah, pembelian, penerimaan bekalan dan pembayaran bil.\n4. Mengurus pendaftaran, pelabelan, penyimpanan, pemeriksaan, penyelenggaraan dan pelupusan aset mengikut tatacara yang berkuat kuasa.\n5. Menyelaras pemeriksaan dalaman, tindakan terhadap teguran audit dan pelaporan kewangan.\n6. Memastikan pengasingan tugas, kelulusan pembelian dan kawalan dokumen dilaksanakan mengikut peraturan.",
    sasaran_kerja: "- 100% transaksi kewangan mempunyai dokumen sokongan dan kelulusan yang sah.\n- 100% laporan serta penyata kewangan yang diwajibkan dikemukakan mengikut tarikh akhir.\n- 100% aset yang diterima direkodkan dan dilabel dalam tempoh yang ditetapkan.\n- Sekurang-kurangnya 2 pemeriksaan aset dilaksanakan setahun atau mengikut peraturan semasa.\n- 100% teguran audit yang berada dalam bidang kuasa sekolah mempunyai tindakan pembetulan dan rekod susulan.\n- 100% bil diproses untuk pembayaran dalam tempoh yang ditetapkan, tertakluk kepada kesempurnaan dokumen dan ketersediaan peruntukan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "Pegawai Aset", "AJK"]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Standard Kualiti Pendidikan Malaysia (SK@S)",
    description: "Menyelaras pelaksanaan penilaian kendiri sekolah berdasarkan instrumen dan arahan kualiti pendidikan yang berkuat kuasa.",
    senarai_tugas: "1. Menyelaras pelaksanaan penilaian kendiri sekolah berdasarkan instrumen dan arahan kualiti pendidikan yang berkuat kuasa.\n2. Mengumpulkan evidens bagi aspek kepimpinan, pengurusan organisasi, kurikulum, kokurikulum, HEM dan pembelajaran serta pemudahcaraan.\n3. Membantu ketua bidang dan ketua unit menganalisis skor, mengenal pasti jurang pencapaian dan menentukan keutamaan penambahbaikan.\n4. Menyediakan pelan tindakan berdasarkan dapatan penilaian kendiri dan memantau pelaksanaannya.\n5. Menyelaras penyediaan dokumen sokongan dan persediaan menghadapi pemantauan atau pemeriksaan pihak berkuasa.",
    sasaran_kerja: "- 100% aspek penilaian kendiri yang diwajibkan dilengkapkan dalam tempoh ditetapkan.\n- 100% skor yang dilaporkan disokong oleh evidens yang relevan.\n- Sekurang-kurangnya 2 sesi analisis kualiti dan penambahbaikan dilaksanakan setahun.\n- 100% aspek yang dikenal pasti belum mencapai sasaran mempunyai pelan tindakan.\n- Sekurang-kurangnya 80% tindakan penambahbaikan yang dirancang diselesaikan mengikut tempoh pelaksanaan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "Penolong Setiausaha", "AJK"]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Kajian Tindakan",
    description: "Mengenal pasti isu pengajaran, pembelajaran atau pengurusan yang memerlukan penyelesaian berasaskan data.",
    senarai_tugas: "1. Mengenal pasti isu pengajaran, pembelajaran atau pengurusan yang memerlukan penyelesaian berasaskan data.\n2. Membimbing guru merancang kajian tindakan, menetapkan objektif, memilih intervensi dan menentukan kaedah pengumpulan data.\n3. Menyelaras pelaksanaan intervensi serta analisis dapatan sebelum dan selepas tindakan.\n4. Menyediakan laporan kajian tindakan dan mendokumentasikan amalan terbaik.\n5. Menggalakkan perkongsian hasil kajian dalam mesyuarat profesional, seminar atau komuniti pembelajaran profesional (PLC).",
    sasaran_kerja: "- Sekurang-kurangnya 4 kajian tindakan lengkap dihasilkan pada peringkat sekolah.\n- Sekurang-kurangnya 80% kajian yang dirancang mempunyai data awal dan data selepas intervensi.\n- Sekurang-kurangnya 2 sesi perkongsian dapatan kajian atau amalan terbaik dilaksanakan.\n- 100% kajian yang disiapkan mempunyai laporan dan evidens pelaksanaan.\n- Sekurang-kurangnya 75% kajian menunjukkan peningkatan pada indikator yang diukur atau menghasilkan dapatan yang boleh digunakan untuk penambahbaikan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Bencana Sekolah",
    description: "Menyediakan pelan tindakan kecemasan dan pengurusan bencana berdasarkan risiko setempat.",
    senarai_tugas: "1. Menyediakan pelan tindakan kecemasan dan pengurusan bencana berdasarkan risiko setempat.\n2. Menyelaras prosedur pemindahan, tempat berkumpul, laluan kecemasan, komunikasi dan peranan petugas.\n3. Memastikan nombor kecemasan, senarai pegawai bertugas dan maklumat hubungan agensi bantuan sentiasa dikemas kini.\n4. Menyelaras latihan kecemasan, pemeriksaan peralatan keselamatan dan taklimat kesiapsiagaan.\n5. Mengurus komunikasi dengan PPD, JPN, agensi penyelamat, ibu bapa dan pihak berkaitan apabila diperlukan.\n6. Menyediakan laporan kejadian, rekod kerosakan dan tindakan pemulihan.",
    sasaran_kerja: "- 1 pelan pengurusan bencana sekolah disemak dan dikemas kini setiap tahun.\n- Sekurang-kurangnya 2 latihan kecemasan dilaksanakan setahun, mengikut keperluan risiko dan arahan semasa.\n- 100% laluan keluar dan tempat berkumpul diperiksa mengikut jadual.\n- 100% kejadian kecemasan yang berlaku direkod dan dilaporkan melalui saluran ditetapkan.\n- Sekurang-kurangnya 90% tindakan pembetulan hasil latihan diselesaikan dalam tempoh yang ditetapkan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "AJK"]
  },
  {
    category: "Pentadbiran",
    name: "Jawatankuasa Kelab Kebajikan Staf",
    description: "Merancang aktiviti kebajikan, sosial dan rekreasi bagi meningkatkan kesejahteraan warga sekolah.",
    senarai_tugas: "1. Merancang aktiviti kebajikan, sosial dan rekreasi bagi meningkatkan kesejahteraan warga sekolah.\n2. Menyelaras bantuan atau sumbangan kepada staf yang mengalami musibah, tertakluk kepada peraturan kelab dan persetujuan ahli.\n3. Mengurus aktiviti sambutan, ziarah, penghargaan dan program yang mengeratkan hubungan sesama staf.\n4. Mengurus kewangan, rekod keahlian dan laporan aktiviti secara telus.\n5. Menggalakkan budaya kerja positif, saling menghormati dan sokongan profesional.",
    sasaran_kerja: "- Sekurang-kurangnya 4 aktiviti kebajikan atau sosial dilaksanakan setahun.\n- 100% permohonan bantuan yang lengkap dipertimbangkan mengikut peraturan kelab.\n- 100% transaksi kewangan kelab direkod dan dilaporkan kepada ahli.\n- Sekurang-kurangnya 80% ahli memberikan maklum balas positif terhadap aktiviti yang dilaksanakan.",
    default_positions: ["Penasihat", "Pengerusi", "Timbalan Pengerusi", "Setiausaha", "Bendahari", "AJK"]
  },

  // ==========================================
  // 2. PENGURUSAN KURIKULUM
  // ==========================================
  {
    category: "Kurikulum",
    sub_category: "Pengurusan Induk & Pentadbiran Kurikulum",
    unit_code: "2.1",
    name: "Jawatankuasa Induk Kurikulum",
    description: "Merancang, mengurus, dan memantau keberkesanan pelaksanaan kurikulum dan prestasi akademik sekolah.",
    senarai_tugas: "1. Menyediakan rancangan tahunan dan mingguan pelaksanaan kurikulum.\n2. Melakukan pemantauan terhadap pelaksanaan PdP di kelas.\n3. Mengurus dan menganalisis keputusan peperiksaan serta menyediakan intervensi.\n4. Merancang dan melaksanakan latihan dalam perkhidmatan (LDP) berkaitan kurikulum.\n5. Memastikan semua dokumen kurikulum dikemaskini dan disimpan dengan baik.\n6. Mengadakan perbincangan berkala dengan ibu bapa mengenai kemajuan murid.\n7. Merancang program seperti minggu akademik, bengkel akademik, dan aktiviti galakan membaca.",
    sasaran_kerja: "1. Minimum 5% peningkatan keputusan peperiksaan sekolah setiap tahun.\n2. Peratusan murid mencapai gred minimum meningkat sebanyak 10%.\n3. Semua guru menyelesaikan rancangan pengajaran tahunan (RPT) dan harian mengikut jadual.\n4. 100% pematuhan kepada SKPMg2 bagi PdP.\n5. Semua murid yang dikenal pasti lemah mengikuti program pemulihan atau bimbingan tambahan.\n6. Sekurang-kurangnya 3 CPD berkaitan kurikulum diadakan setiap tahun.",
    default_positions: [
      "Pengerusi",
      "Naib Pengerusi",
      "Timbalan Pengerusi 1",
      "Timbalan Pengerusi 2",
      "Timbalan Pengerusi 3",
      "Timbalan Pengerusi 4",
      "Timbalan Pengerusi 5",
      "Setiausaha",
      "Pen. Setiausaha",
      "(Penyelaras PBS)",
      "AJK (SUE Petang)",
      "AJK"
    ],
    position_slots: [
      { slotKey: "kur-induk-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "kur-induk-naib", slotOrder: 2, role: "Naib Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "kur-induk-tim1", slotOrder: 3, role: "Timbalan Pengerusi 1", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_HEM"] },
      { slotKey: "kur-induk-tim2", slotOrder: 4, role: "Timbalan Pengerusi 2", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_KOKURIKULUM"] },
      { slotKey: "kur-induk-tim3", slotOrder: 5, role: "Timbalan Pengerusi 3", weightage: 3, isLeadershipRole: true, requiredJawatan: ["PK_PETANG"] },
      { slotKey: "kur-induk-su", slotOrder: 6, role: "Setiausaha", weightage: 8, isMandatory: true, isLeadershipRole: true, preferredJawatan: ["SU_KURIKULUM", "GURU_BIASA"], preferredExpertise: ["Pengurusan Kurikulum"] },
      { slotKey: "kur-induk-psu", slotOrder: 7, role: "Pen. Setiausaha", weightage: 5, preferredExpertise: ["Pengurusan Kurikulum"] },
      { slotKey: "kur-induk-pbs", slotOrder: 8, role: "(Penyelaras PBS)", weightage: 8, isLeadershipRole: true, allowParentBridge: true, preferredExpertise: ["PBS", "Pentaksiran"] },
      { slotKey: "kur-induk-petang", slotOrder: 9, role: "AJK (SUE Petang)", weightage: 2, requiredSession: "Petang" },
      { slotKey: "kur-induk-ajk", slotOrder: 10, role: "AJK", weightage: 2, preferredJawatan: ["GKMP", "GPM"] }
    ]
  },
  {
    category: "Kurikulum",
    sub_category: "Bidang & Panitia Mata Pelajaran",
    unit_code: "2.2",
    name: "Jawatankuasa Pengurusan Panitia Mata Pelajaran",
    parent_committee_name: "Jawatankuasa Induk Kurikulum",
    description: "Menyelaras perancangan tahunan, pelaksanaan kurikulum dan strategi PdP mengikut mata pelajaran.",
    senarai_tugas: "1. Menyelaras perancangan tahunan, pelaksanaan kurikulum dan strategi PdP mengikut mata pelajaran.\n2. Menyediakan pelan strategik, pelan taktikal dan pelan operasi panitia yang selaras dengan sasaran sekolah.\n3. Menganalisis prestasi murid dan mengenal pasti kumpulan yang memerlukan pemulihan, pengukuhan atau pengayaan.\n4. Menyelaras pembangunan bahan pengajaran, perkongsian amalan terbaik, PLC dan kajian tindakan.\n5. Memantau penggunaan peruntukan panitia, pengurusan bahan, buku rujukan dan dokumentasi.\n6. Membincangkan keberkesanan PdP serta pelaksanaan pentaksiran dan tindakan susulan.",
    sasaran_kerja: "- 100% panitia menyediakan perancangan tahunan dan anggaran perbelanjaan mengikut tempoh.\n- Sekurang-kurangnya 4 mesyuarat panitia dilaksanakan setahun.\n- Sekurang-kurangnya 2 aktiviti PLC bagi setiap panitia dilaksanakan setahun.\n- 100% panitia menganalisis pencapaian murid selepas pentaksiran utama.\n- Sekurang-kurangnya 80% program intervensi panitia mencapai indikator keberhasilan yang telah ditetapkan.",
    default_positions: ["Ketua Panitia", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "panitia-kp", slotOrder: 1, role: "Ketua Panitia", weightage: 10, isMandatory: true, isLeadershipRole: true, preferredJawatan: ["KETUA_PANITIA", "GKMP"] },
      { slotKey: "panitia-su", slotOrder: 2, role: "Setiausaha", weightage: 8, isLeadershipRole: true, teachingStaffOnly: true },
      { slotKey: "panitia-ajk", slotOrder: 3, role: "AJK", weightage: 2, teachingStaffOnly: true }
    ]
  },
  {
    category: "Kurikulum",
    sub_category: "Pengurusan Pentaksiran & Peperiksaan",
    unit_code: "2.3",
    name: "Jawatankuasa Pentaksiran dan Peperiksaan",
    parent_committee_name: "Jawatankuasa Induk Kurikulum",
    description: "Menyelaras takwim pentaksiran, peperiksaan dalaman dan urusan peperiksaan awam mengikut arahan pihak berkuasa.",
    senarai_tugas: "1. Menyelaras takwim pentaksiran, peperiksaan dalaman dan urusan peperiksaan awam mengikut arahan pihak berkuasa.\n2. Mengurus penyediaan, penyimpanan, keselamatan, pengedaran dan pemulangan bahan peperiksaan.\n3. Menyelaras pelaksanaan Pentaksiran Berasaskan Sekolah (PBS), termasuk komponen yang berkenaan dengan sekolah.\n4. Memastikan rekod pentaksiran, markah, analisis keputusan dan pelaporan murid disediakan dengan tepat.\n5. Menyelaras analisis item, moderasi yang berkaitan dan tindakan intervensi selepas pentaksiran.\n6. Memastikan kerahsiaan bahan peperiksaan serta pematuhan prosedur peperiksaan.",
    sasaran_kerja: "- 100% pentaksiran yang dirancang dilaksanakan mengikut takwim yang diluluskan.\n- 100% pelaporan keputusan disiapkan dalam tempoh yang ditetapkan.\n- 100% rekod pentaksiran disemak bagi memastikan ketepatan sebelum pelaporan.\n- 100% guru yang terlibat diberikan taklimat prosedur pentaksiran yang berkaitan.\n- Sekurang-kurangnya 90% tindakan susulan berdasarkan analisis keputusan dilaksanakan mengikut perancangan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha Peperiksaan", "Setiausaha PBS", "AJK"],
    position_slots: [
      { slotKey: "pep-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "pep-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "pep-su-pep", slotOrder: 3, role: "Setiausaha Peperiksaan", weightage: 8, isLeadershipRole: true, preferredJawatan: ["SU_PEPERIKSAAN", "GURU_BIASA"], preferredExpertise: ["Peperiksaan", "SPM", "Headcount"] },
      { slotKey: "pep-su-pbs", slotOrder: 4, role: "Setiausaha PBS", weightage: 8, isLeadershipRole: true, allowParentBridge: true, preferredExpertise: ["PBS", "PBD", "IDME"] },
      { slotKey: "pep-ajk", slotOrder: 5, role: "AJK", weightage: 2, teachingStaffOnly: true }
    ]
  },
  {
    category: "Kurikulum",
    sub_category: "Program Pembudayaan Khas",
    unit_code: "2.4",
    name: "Jawatankuasa Pelaksanaan Pendidikan Sivik",
    parent_committee_name: "Jawatankuasa Induk Kurikulum",
    description: "Menyelaras penerapan nilai sivik dalam PdP, aktiviti sekolah dan program pembentukan sahsiah.",
    senarai_tugas: "1. Menyelaras penerapan nilai sivik dalam PdP, aktiviti sekolah dan program pembentukan sahsiah.\n2. Membimbing panitia mengenal pasti tema, nilai, aktiviti dan hasil pembelajaran sivik yang bersesuaian.\n3. Merancang aktiviti yang menggalakkan tanggungjawab, hormat-menghormati, kasih sayang, kegembiraan, patriotisme dan semangat kemasyarakatan.\n4. Menyelaras program khidmat masyarakat, kesukarelawanan, kelestarian alam dan amalan kewarganegaraan.\n5. Menilai penglibatan murid dan mendokumentasikan keberkesanan program.",
    sasaran_kerja: "- 100% panitia berkaitan mengintegrasikan elemen sivik yang bersesuaian dalam perancangan PdP.\n- Sekurang-kurangnya 4 aktiviti sivik dilaksanakan setahun.\n- Sekurang-kurangnya 80% murid menyertai aktiviti sivik yang dirancang.\n- 100% aktiviti utama mempunyai rekod pelaksanaan dan refleksi.\n- Sekurang-kurangnya 80% murid yang dinilai menunjukkan pencapaian indikator sahsiah atau tanggungjawab sivik yang disasarkan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "sivik-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "sivik-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "sivik-penyelaras", slotOrder: 3, role: "Penyelaras", weightage: 8, isLeadershipRole: true, preferredSubjects: ["Sejarah", "Pendidikan Moral", "Pendidikan Islam", "Bahasa Melayu"], preferredDepartments: ["Sains Sosial"] },
      { slotKey: "sivik-su", slotOrder: 4, role: "Setiausaha", weightage: 8, isLeadershipRole: true, teachingStaffOnly: true },
      { slotKey: "sivik-ajk", slotOrder: 5, role: "AJK", weightage: 2, teachingStaffOnly: true }
    ]
  },
  {
    category: "Kurikulum",
    sub_category: "Kecemerlangan & Sokongan Akademik",
    unit_code: "2.5",
    name: "Jawatankuasa Pengurusan Pusat Sumber Sekolah (PSS)",
    parent_committee_name: "Jawatankuasa Induk Kurikulum",
    description: "Merancang dan melaksanakan program literasi maklumat, galakan membaca dan penggunaan sumber pembelajaran.",
    senarai_tugas: "1. Merancang dan melaksanakan program literasi maklumat, galakan membaca dan penggunaan sumber pembelajaran.\n2. Mengurus koleksi bahan bercetak dan digital, termasuk perolehan, pengkatalogan, pinjaman dan pelupusan mengikut prosedur.\n3. Memastikan kemudahan, peralatan dan ruang PSS selamat, teratur serta kondusif.\n4. Menyelaras aktiviti NILAM dan program literasi yang berkaitan dengan dasar semasa.\n5. Membimbing guru dan murid memanfaatkan sumber PSS dalam PdP dan pembelajaran kendiri.\n6. Menyediakan laporan penggunaan, inventori dan keberkesanan program.",
    sasaran_kerja: "- Sekurang-kurangnya 4 program galakan membaca atau literasi dilaksanakan setahun.\n- 100% koleksi dan aset PSS direkodkan serta disemak mengikut jadual.\n- Sekurang-kurangnya 80% kelas menyertai sekurang-kurangnya satu aktiviti literasi atau PSS yang dirancang.\n- Penggunaan PSS atau sumber digital meningkat sekurang-kurangnya 10% berbanding data asas, jika rekod perbandingan tersedia.\n- 100% laporan aktiviti utama disediakan dan disimpan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras PSS", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "pss-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "pss-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "pss-penyelaras", slotOrder: 3, role: "Penyelaras PSS", weightage: 8, isLeadershipRole: true, preferredJawatan: ["GPM", "GURU_BIASA"], preferredExpertise: ["Pusat Sumber", "NILAM", "Perpustakaan"], preferredDepartments: ["Bahasa"] },
      { slotKey: "pss-su", slotOrder: 4, role: "Setiausaha", weightage: 8, isLeadershipRole: true, preferredSubjects: ["Bahasa Melayu", "Bahasa Inggeris"] },
      { slotKey: "pss-ajk", slotOrder: 5, role: "AJK", weightage: 2, teachingStaffOnly: true }
    ]
  },
  {
    category: "Kurikulum",
    sub_category: "Program Pembudayaan Khas",
    unit_code: "2.6",
    name: "Jawatankuasa Pengurusan Dual Language Programme (DLP)",
    parent_committee_name: "Jawatankuasa Induk Kurikulum",
    description: "Menyelaras pelaksanaan DLP mengikut dasar, syarat kelayakan, kelulusan dan arahan KPM yang berkuat kuasa.",
    senarai_tugas: "1. Menyelaras pelaksanaan DLP mengikut dasar, syarat kelayakan, kelulusan dan arahan KPM yang berkuat kuasa.\n2. Menyediakan perancangan PdP mata pelajaran yang dilaksanakan dalam bahasa Inggeris serta bahan sokongan yang bersesuaian.\n3. Menyelaras keperluan guru, jadual waktu, bahan pembelajaran dan sokongan profesional.\n4. Memantau kefahaman murid, pencapaian mata pelajaran dan penguasaan bahasa yang diperlukan untuk pembelajaran.\n5. Mengadakan komunikasi dengan ibu bapa serta memantau pematuhan syarat pelaksanaan program.\n6. Menganalisis keberkesanan DLP dan mengemukakan cadangan penambahbaikan.",
    sasaran_kerja: "- 100% pelaksanaan DLP mematuhi kelulusan dan syarat semasa KPM.\n- 100% kelas DLP mempunyai perancangan PdP dan bahan sokongan yang bersesuaian.\n- Sekurang-kurangnya 2 sesi pemantauan PdP atau analisis pelaksanaan dilaksanakan setiap tahun.\n- 100% murid DLP mempunyai rekod pencapaian yang diperlukan untuk pemantauan.\n- Pencapaian mata pelajaran DLP mencapai sasaran yang ditetapkan berdasarkan data asas sekolah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras DLP", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "dlp-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "dlp-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_PENTADBIRAN"] },
      { slotKey: "dlp-penyelaras", slotOrder: 3, role: "Penyelaras DLP", weightage: 8, isLeadershipRole: true, requiresDomainMatch: true, preferredDepartments: ["Sains & Matematik"], preferredSubjects: ["Sains", "Matematik", "Fizik", "Kimia", "Biologi", "Bahasa Inggeris"], preferredExpertise: ["DLP"] },
      { slotKey: "dlp-su", slotOrder: 4, role: "Setiausaha", weightage: 8, isLeadershipRole: true, preferredDepartments: ["Sains & Matematik", "Bahasa"] },
      { slotKey: "dlp-ajk", slotOrder: 5, role: "AJK", weightage: 2, preferredSubjects: ["Sains", "Matematik", "Bahasa Inggeris"] }
    ]
  },

  // ==========================================
  // 3. PENGURUSAN HAL EHWAL MURID (HEM)
  // ==========================================
  {
    category: "Hal Ehwal Murid",
    name: "Jawatankuasa Induk Pengurusan Hal Ehwal Murid",
    description: "Merancang, menyelaras, dan menilai pengurusan dan pembangunan murid sekolah.",
    senarai_tugas: "1. Memantau pelaksanaan tugas jawatankuasa unit-unit HEM.\n2. Menyelaras pelaporan dan perancangan unit-unit HEM.\n3. Menguruskan surat menyurat dan memastikan fail dan rekod dikemaskini.\n4. Merancang, menyelaras dan menilai semua aktiviti yang berkaitan dengan pengurusan dan pembangunan murid.\n5. Membimbing, menerima pandangan dan cadangan daripada murid, guru dan ibu bapa mengenai hal-hal yang berkaitan dengan disiplin sekolah.\n6. Merancang dan menyusun semua aktiviti harian sekolah yang berkaitan dengan pengurusan murid.\n7. Merancang, menyelaras dan mengurus peruntukan kewangan bagi perbelanjaan pengurusan hal ehwal murid.\n8. Memberi bimbingan dan panduan dalam hal pelantikan pengawas sekolah.",
    sasaran_kerja: "1. Pelaksanaan tugas yang diselesaikan mengikut jadual yang telah ditetapkan.\n2. Peratusan aktiviti yang dirancang dan diselaraskan mengikut kalendar sekolah (95% aktiviti dilaksanakan mengikut perancangan).\n3. Maklum balas positif daripada murid, guru dan ibu bapa mengenai tindakan disiplin yang diambil ke atas murid.\n4. Bilangan pengawas yang dilantik dan menjalankan tugas dengan baik (95% pengawas sekolah melaksanakan tugas dengan baik).",
    default_positions: [
      "Pengerusi",
      "Timbalan Pengerusi 1",
      "Timbalan Pengerusi 2",
      "SUE",
      "Ketua Unit HEM T6",
      "Ketua Unit HEM PPKi",
      "Setiausaha Disiplin",
      "Penolong SU Disiplin",
      "AJK ( Pencatat Minit )",
      "AJK"
    ]
  },
  {
    category: "Hal Ehwal Murid",
    name: "Jawatankuasa Pengurusan Disiplin Murid",
    description: "Menyelaras pelaksanaan peraturan sekolah, pendidikan disiplin dan pembentukan sahsiah.",
    senarai_tugas: "1. Menyelaras pelaksanaan peraturan sekolah, pendidikan disiplin dan pembentukan sahsiah.\n2. Mengurus aduan serta kes salah laku mengikut prosedur, prinsip keadilan dan arahan KPM.\n3. Memastikan rekod kes, siasatan, tindakan dan komunikasi dengan ibu bapa diurus secara sulit.\n4. Menyelaras intervensi pemulihan tingkah laku bersama guru kelas, kaunselor dan pihak berkaitan.\n5. Melaksanakan pendidikan pencegahan buli, gangguan, vandalisme, ponteng dan salah laku digital.\n6. Menganalisis pola kes disiplin dan menilai keberkesanan intervensi.",
    sasaran_kerja: "- 100% kes yang diterima direkodkan dan diurus mengikut prosedur semasa.\n- 100% kes yang memerlukan tindakan lanjut mempunyai rekod pemantauan.\n- Sekurang-kurangnya 4 program pendidikan disiplin dan pencegahan salah laku dilaksanakan setahun.\n- Bilangan kes berulang bagi kategori salah laku yang dipilih berkurang sekurang-kurangnya 10% berbanding data asas, jika bersesuaian.\n- 100% aduan serius ditangani melalui saluran yang ditetapkan tanpa kelewatan yang tidak munasabah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Ketua Guru Disiplin", "Setiausaha", "AJK"]
  },
  {
    category: "Hal Ehwal Murid",
    name: "Jawatankuasa Pengurusan 3K (Kebersihan, Kesihatan dan Keselamatan)",
    description: "Menyelaras pemeriksaan kebersihan kelas, tandas, kantin, kawasan sekolah dan kemudahan murid.",
    senarai_tugas: "1. Menyelaras pemeriksaan kebersihan kelas, tandas, kantin, kawasan sekolah dan kemudahan murid.\n2. Memantau kebersihan makanan, amalan kesihatan, pencegahan penyakit dan pendidikan kesihatan.\n3. Menilai risiko keselamatan bangunan, peralatan, laluan, pagar, makmal dan kawasan aktiviti.\n4. Menyelaras tindakan pembaikan, laporan kerosakan dan rujukan kepada pihak berkuasa.\n5. Mengadakan program kesedaran kesihatan, keselamatan, kebersihan diri dan persekitaran.\n6. Memantau tindakan susulan bagi penemuan audit atau pemeriksaan.",
    sasaran_kerja: "- Sekurang-kurangnya 1 pemeriksaan kebersihan dan keselamatan dilaksanakan setiap bulan persekolahan.\n- Sekurang-kurangnya 4 kempen kesihatan, kebersihan atau keselamatan dilaksanakan setahun.\n- 100% risiko kritikal yang dikenal pasti dilaporkan segera dan dikawal melalui tindakan bersesuaian.\n- Sekurang-kurangnya 90% tindakan pembaikan yang berada dalam bidang kuasa sekolah diselesaikan dalam tempoh ditetapkan.\n- Skor kebersihan kawasan sekolah mencapai sekurang-kurangnya 90% berdasarkan instrumen pemantauan dalaman.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha 3K", "AJK Keselamatan", "AJK Kesihatan", "AJK Kebersihan"]
  },
  {
    category: "Hal Ehwal Murid",
    name: "Jawatankuasa Bimbingan dan Kaunseling",
    description: "Merancang perkhidmatan bimbingan dan kaunseling bagi aspek akademik, kerjaya, psikososial, kesejahteraan dan pembangunan diri.",
    senarai_tugas: "1. Merancang perkhidmatan bimbingan dan kaunseling bagi aspek akademik, kerjaya, psikososial, kesejahteraan dan pembangunan diri.\n2. Mengenal pasti murid yang memerlukan sokongan melalui rujukan guru, ibu bapa, pemerhatian atau saringan yang dibenarkan.\n3. Melaksanakan sesi kaunseling individu dan kelompok berdasarkan keperluan serta etika profesional.\n4. Menyelaras program orientasi, motivasi, pengurusan emosi, kemahiran belajar, kerjaya dan pencegahan risiko.\n5. Bekerjasama dengan ibu bapa serta agensi berkaitan bagi kes yang memerlukan sokongan tambahan.\n6. Menjaga kerahsiaan rekod dan membuat rujukan keselamatan atau perlindungan apabila diperlukan.",
    sasaran_kerja: "- 100% murid yang dikenal pasti memerlukan intervensi menerima penilaian awal atau rujukan mengikut keutamaan.\n- Sekurang-kurangnya 6 program bimbingan dan pembangunan murid dilaksanakan setahun.\n- 100% sesi kaunseling dan intervensi direkodkan mengikut prosedur profesional.\n- Sekurang-kurangnya 80% murid sasaran melengkapkan intervensi yang dirancang, tertakluk kepada kesediaan dan kehadiran.\n- 100% kes berisiko tinggi dirujuk atau ditangani mengikut prosedur perlindungan dan keselamatan yang berkuat kuasa.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Guru Bimbingan & Kaunseling", "Setiausaha", "AJK"],
    position_slots: [
      { slotKey: "ubk-pengerusi", slotOrder: 1, role: "Pengerusi", weightage: 2, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PENGETUA"] },
      { slotKey: "ubk-timbalan", slotOrder: 2, role: "Timbalan Pengerusi", weightage: 3, isMandatory: true, isLeadershipRole: true, requiredJawatan: ["PK_HEM"] },
      { slotKey: "ubk-gbk", slotOrder: 3, role: "Guru Bimbingan & Kaunseling", weightage: 8, isMandatory: true, isLeadershipRole: true, requiresDomainMatch: true, requiredJawatan: ["KAUNSELOR"] },
      { slotKey: "ubk-su", slotOrder: 4, role: "Setiausaha", weightage: 6, preferredJawatan: ["KAUNSELOR", "GURU_BIASA"] },
      { slotKey: "ubk-ajk", slotOrder: 5, role: "AJK", weightage: 2, teachingStaffOnly: true }
    ]
  },
  {
    category: "Hal Ehwal Murid",
    name: "Jawatankuasa Pengurusan Asrama",
    description: "Menyelaras pengurusan penempatan, pendaftaran, keluar masuk dan kebajikan penghuni asrama.",
    senarai_tugas: "1. Menyelaras pengurusan penempatan, pendaftaran, keluar masuk dan kebajikan penghuni asrama.\n2. Memantau keselamatan, kebersihan, makanan, kesihatan, disiplin dan rutin harian penghuni.\n3. Menyelaras jadual warden, pengawasan malam, aktiviti kerohanian, rekreasi dan pembelajaran.\n4. Memantau penyelenggaraan bilik, tandas, ruang makan, kemudahan riadah dan peralatan keselamatan.\n5. Mengurus aduan penghuni dan komunikasi dengan ibu bapa serta pihak berkaitan.\n6. Menyediakan rekod kehadiran, laporan insiden, inventori dan penilaian pengurusan asrama.",
    sasaran_kerja: "- 100% rekod penghuni dikemas kini dan disemak mengikut jadual.\n- Sekurang-kurangnya 1 pemeriksaan keselamatan, kebersihan dan kemudahan dilaksanakan setiap bulan.\n- Sekurang-kurangnya 4 program pembangunan sahsiah atau kesejahteraan penghuni dilaksanakan setahun.\n- 100% aduan atau insiden direkod dan ditindaklanjuti mengikut tahap risiko.\n- Sekurang-kurangnya 90% tindakan pembaikan yang berada dalam bidang kuasa sekolah diselesaikan mengikut tempoh ditetapkan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Ketua Warden", "Warden", "Setiausaha", "AJK"]
  },

  // ==========================================
  // 4. PENGURUSAN KOKURIKULUM
  // ==========================================
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Induk Kokurikulum",
    description: "Menentukan dasar, merancang, dan mengurus pengoperasian serta aktiviti kokurikulum di sekolah.",
    senarai_tugas: "1. Mengadakan mesyuarat sekurang-kurang dua (2) kali setahun.\n2. Menentukan dasar dan hala tuju pengurusan kokurikulum sekolah.\n3. Merancang dan mengurus pengoperasian kokurikulum di sekolah.\n4. Merancang dan mengawal pengurusan sumber berkaitan kokurikulum di sekolah.\n5. Mengenal pasti dan menyelesaikan isu dan permasalahan berkaitan kokurikulum di sekolah.\n6. Merancang, memantau, menilai dan menambahbaik pelaksanaan program dan aktiviti kokurikulum di sekolah.",
    sasaran_kerja: "1. Mengadakan mesyuarat pengurusan KK sekurang-kurangnya dua (2) kali setahun.\n2. Merancang dan membangunkan satu takwim KK sebelum sesi akademik bermula.\n3. Mengadakan sekurang-kurangnya dua CPD yang berkaitan pengurusan dan pelaksanaan kegiatan kokurikulum.\n4. Menguruskan pengoperasian pengelolaan pertandingan berdasarkan takwim yang telah dikeluarkan oleh PPD.\n5. Membuat laporan dan pendokumentasian tentang pelaksanaan kokurikulum dan pencapaian yang telah dicapai.",
    default_positions: [
      "Pengerusi",
      "Timbalan Pengerusi",
      "Setiausaha Eksekutif Kokurikulum",
      "Setiausaha Kokurikulum",
      "Penolong Setiausaha Kokurikulum",
      "Setiausaha Sukan",
      "Penolong Setiausaha Sukan 1",
      "Penolong Setiausaha Sukan 2",
      "Setiausaha Mesyuarat",
      "Penyelaras Sukan & Permainan",
      "Penolong Penyelaras Sukan & Permainan",
      "Penyelaras Pasukan Badan Beruniform",
      "Penolong Penyelaras Pasukan Badan Beruniform",
      "Penyelaras Kelab & Persatuan",
      "Penolong Penyelaras Kelab & Persatuan"
    ]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pemantauan Kokurikulum",
    description: "Menyediakan instrumen pemantauan bagi aktiviti badan beruniform, kelab dan persatuan serta sukan dan permainan.",
    senarai_tugas: "1. Menyediakan instrumen pemantauan bagi aktiviti badan beruniform, kelab dan persatuan serta sukan dan permainan.\n2. Memantau kehadiran, pelaksanaan aktiviti, pengurusan keselamatan, penggunaan peralatan dan dokumentasi unit.\n3. Memberikan maklum balas kepada guru penasihat dan menyelaras tindakan pembetulan.\n4. Menyemak keberkesanan aktiviti dan keselarasan pelaksanaan dengan perancangan tahunan.\n5. Mengemukakan laporan pemantauan kepada jawatankuasa pengurusan kokurikulum.",
    sasaran_kerja: "- Sekurang-kurangnya 2 pemantauan bagi setiap unit kokurikulum dilaksanakan setahun.\n- 100% unit menerima maklum balas hasil pemantauan.\n- Sekurang-kurangnya 90% teguran atau tindakan pembetulan diselesaikan dalam tempoh ditetapkan.\n- 100% aktiviti berisiko mempunyai perancangan keselamatan yang bersesuaian.\n- Laporan pemantauan disediakan sekurang-kurangnya sekali setiap penggal atau mengikut takwim sekolah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan PAJSK",
    description: "Menyelaras pengumpulan data penyertaan, penglibatan dan pencapaian murid dalam komponen PAJSK yang berkenaan.",
    senarai_tugas: "1. Menyelaras pengumpulan data penyertaan, penglibatan dan pencapaian murid dalam komponen PAJSK yang berkenaan.\n2. Menyemak rekod SEGAK, BMI yang berkaitan, kokurikulum dan aktiviti ekstra kurikulum berdasarkan panduan semasa.\n3. Membimbing guru penasihat dan guru yang dipertanggungjawabkan untuk memasukkan data secara tepat.\n4. Melaksanakan semakan silang, pembetulan data dan pengesahan sebelum penghantaran.\n5. Memastikan maklumat murid dikendalikan secara berintegriti dan mengikut prosedur sistem.",
    sasaran_kerja: "- 100% data PAJSK yang diwajibkan dilengkapkan sebelum tarikh akhir.\n- 100% rekod murid disemak bagi ketepatan dan kesempurnaan.\n- Sekurang-kurangnya 2 sesi semakan atau taklimat pengurusan PAJSK dilaksanakan setahun.\n- 100% pembetulan yang dikenal pasti diselesaikan sebelum pengesahan akhir.\n- Tiada penghantaran lewat yang berpunca daripada kecuaian pengurusan sekolah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha PAJSK", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan Rancangan Integrasi Murid untuk Perpaduan (RIMUP)",
    description: "Merancang program interaksi dan kerjasama antara murid daripada pelbagai latar belakang.",
    senarai_tugas: "1. Merancang program interaksi dan kerjasama antara murid daripada pelbagai latar belakang.\n2. Menyelaras aktiviti kebudayaan, sukan, khidmat masyarakat dan sambutan yang menggalakkan perpaduan.\n3. Membina kerjasama dengan sekolah lain, komuniti dan agensi berkaitan.\n4. Memastikan aktiviti melibatkan penyertaan yang inklusif, menghormati kepelbagaian dan mengelakkan diskriminasi.\n5. Menilai penglibatan murid serta keberkesanan aktiviti dalam membina persefahaman.",
    sasaran_kerja: "- Sekurang-kurangnya 2 program RIMUP dilaksanakan setahun, tertakluk kepada arahan dan peluang kerjasama.\n- Sekurang-kurangnya 2 pihak atau institusi rakan dilibatkan dalam program utama.\n- Sekurang-kurangnya 80% murid sasaran menyertai program yang dirancang.\n- 100% program utama mempunyai laporan dan refleksi.\n- Sekurang-kurangnya 80% peserta menunjukkan maklum balas positif tentang kerjasama dan perpaduan.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan Kokurikulum Tambahan",
    description: "Menyelaras aktiviti kokurikulum tambahan yang diluluskan sekolah di luar aktiviti rutin unit.",
    senarai_tugas: "1. Menyelaras aktiviti kokurikulum tambahan yang diluluskan sekolah di luar aktiviti rutin unit.\n2. Mengurus penyertaan murid dalam kem, bengkel, pertandingan, kursus kepimpinan dan program khas.\n3. Memastikan kebenaran, keselamatan, pengangkutan, pengawasan dan pengurusan risiko diberi perhatian.\n4. Menyelaraskan peruntukan, bahan, jurulatih dan dokumentasi.\n5. Menilai hasil program berdasarkan penyertaan, pencapaian dan perkembangan murid.",
    sasaran_kerja: "- Sekurang-kurangnya 3 program kokurikulum tambahan dilaksanakan setahun.\n- 100% program mendapat kelulusan dan mempunyai perancangan keselamatan yang sesuai.\n- Sekurang-kurangnya 80% murid sasaran menyertai program yang ditetapkan.\n- 100% program mempunyai laporan dan rekod perbelanjaan yang berkaitan.\n- Sekurang-kurangnya 80% program mencapai hasil pembelajaran atau pembangunan murid yang dirancang.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan Redaksi Sekolah (KIV)",
    description: "Merancang penerbitan majalah, buletin atau bahan komunikasi sekolah jika jawatankuasa diaktifkan.",
    senarai_tugas: "1. Merancang penerbitan majalah, buletin atau bahan komunikasi sekolah jika jawatankuasa diaktifkan.\n2. Mengumpulkan berita, artikel, foto, pencapaian murid dan laporan program dengan kebenaran yang sewajarnya.\n3. Membimbing murid dalam penulisan, penyuntingan, fotografi, reka letak dan etika kewartawanan.\n4. Menyemak ketepatan fakta, bahasa, hak cipta, privasi dan kesesuaian kandungan sebelum penerbitan.\n5. Menyelaras percetakan atau penerbitan digital serta penyimpanan bahan arkib.",
    sasaran_kerja: "- Jika diaktifkan, sekurang-kurangnya 1 penerbitan utama sekolah dihasilkan setahun.\n- 100% bahan diterbitkan melalui proses semakan dan kelulusan.\n- Sekurang-kurangnya 10 murid diberi peluang terlibat dalam proses penerbitan, jika kapasiti mengizinkan.\n- 100% penggunaan foto dan maklumat peribadi mematuhi keperluan kebenaran dan perlindungan data.\n- Jika tidak diaktifkan, status KIV disemak oleh pengurusan sekolah dan direkodkan dalam minit mesyuarat.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Guru Penasihat", "Setiausaha", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan Pengiktirafan, Penyertaan dan Penganjuran",
    description: "Mengenal pasti pertandingan, program, anugerah dan peluang penyertaan yang bersesuaian dengan potensi murid.",
    senarai_tugas: "1. Mengenal pasti pertandingan, program, anugerah dan peluang penyertaan yang bersesuaian dengan potensi murid.\n2. Menyelaras pencalonan, pendaftaran, latihan, penghantaran bahan dan pengurusan penyertaan.\n3. Menyelaras penganjuran program atau pertandingan di peringkat sekolah, daerah, negeri atau kebangsaan.\n4. Memastikan kelulusan, peruntukan, keselamatan, pengangkutan dan dokumentasi dipenuhi.\n5. Mengumpulkan rekod pencapaian serta mengiktiraf sumbangan murid dan guru.",
    sasaran_kerja: "- 100% penyertaan rasmi direkodkan dalam pangkalan data atau rekod sekolah.\n- Sekurang-kurangnya 5 penyertaan dalam pertandingan atau program luar sekolah, tertakluk kepada peluang dan kesesuaian.\n- Sekurang-kurangnya 2 program atau pertandingan dianjurkan oleh sekolah jika mendapat kelulusan.\n- 100% pencapaian dan pengiktirafan disahkan melalui evidens.\n- Laporan pencapaian kokurikulum dikemukakan sekurang-kurangnya sekali setiap penggal.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pembangunan Sukan Sekolah",
    description: "Merancang pembangunan sukan dan permainan berdasarkan bakat, minat dan potensi murid.",
    senarai_tugas: "1. Merancang pembangunan sukan dan permainan berdasarkan bakat, minat dan potensi murid.\n2. Menyelaras pemilihan atlet, latihan asas, latihan berfasa dan penyertaan dalam kejohanan.\n3. Mengurus penggunaan padang, gelanggang, peralatan, jurulatih dan kemudahan latihan.\n4. Menekankan keselamatan, kecergasan, disiplin, pemakanan dan pemulihan atlet.\n5. Menganalisis prestasi atlet serta merancang pembangunan bakat jangka pendek dan panjang.",
    sasaran_kerja: "- 100% pasukan sukan yang aktif mempunyai perancangan latihan tahunan.\n- Sekurang-kurangnya 80% atlet terpilih mengikuti latihan yang dirancang.\n- Sekurang-kurangnya 2 program pembangunan bakat atau klinik sukan dilaksanakan setahun.\n- Semua penyertaan kejohanan mempunyai rekod latihan, kehadiran dan keputusan.\n- Peningkatan penyertaan atau pencapaian sukan berbanding data asas berdasarkan sasaran sekolah.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha Sukan", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Kejohanan Sukan Sekolah",
    description: "Menyediakan kertas kerja, struktur organisasi, jadual pertandingan dan anggaran keperluan kejohanan.",
    senarai_tugas: "1. Menyediakan kertas kerja, struktur organisasi, jadual pertandingan dan anggaran keperluan kejohanan.\n2. Menyelaras acara sukan, rumah sukan, pengadil, teknikal, peralatan dan pengurusan peserta.\n3. Mengurus keselamatan, rawatan kecemasan, kawalan penonton, cuaca dan pelan alternatif.\n4. Menyelaras pengurusan hadiah, keputusan, rekod kejohanan dan penghargaan.\n5. Menyediakan laporan pascaprogram serta cadangan penambahbaikan.",
    sasaran_kerja: "- 1 kejohanan olahraga tahunan dilaksanakan mengikut takwim dan kelulusan sekolah.\n- 100% acara mempunyai peraturan, pegawai bertugas dan langkah keselamatan yang bersesuaian.\n- Sekurang-kurangnya 90% murid sasaran mengambil bahagian dalam acara atau peranan kejohanan yang bersesuaian.\n- 100% keputusan dan rekod pemenang disahkan.\n- Laporan kejohanan disiapkan dalam tempoh 14 hari bekerja selepas program.",
    default_positions: ["Pengerusi", "Timbalan Pengerusi", "Setiausaha Sukan", "Penolong Setiausaha Sukan", "AJK"]
  },
  {
    category: "Kokurikulum",
    name: "Jawatankuasa Pengurusan Koperasi Sekolah",
    description: "Menyelaras pengurusan operasi koperasi mengikut undang-undang, peraturan dan ketetapan Suruhanjaya Koperasi Malaysia serta pihak berkaitan.",
    senarai_tugas: "1. Menyelaras pengurusan operasi koperasi mengikut undang-undang, peraturan dan ketetapan Suruhanjaya Koperasi Malaysia serta pihak berkaitan.\n2. Memantau pengurusan keanggotaan, mesyuarat, akaun, inventori, jualan dan dokumentasi koperasi.\n3. Menyelia pengurusan stok, harga, kualiti barangan, keselamatan premis dan layanan kepada pelanggan.\n4. Memberi pendedahan kepada murid tentang keusahawanan, simpan kira, tanggungjawab dan tadbir urus koperasi.\n5. Memantau pelaporan kewangan dan memastikan urusan audit dilaksanakan mengikut keperluan.",
    sasaran_kerja: "- 100% rekod kewangan, jualan dan inventori diselenggara mengikut prosedur.\n- 100% mesyuarat dan pelaporan wajib dilaksanakan mengikut ketetapan.\n- Sekurang-kurangnya 2 aktiviti pendidikan koperasi atau keusahawanan murid dilaksanakan setahun.\n- 100% teguran audit yang berkaitan mempunyai tindakan susulan.\n- Prestasi kewangan dan operasi dinilai sekurang-kurangnya sekali setiap penggal berdasarkan rekod yang sah.",
    default_positions: ["Penasihat", "Pengerusi", "Setiausaha", "Bendahari", "Juruaudit", "AJK"]
  },

  // ==========================================
  // 5. PENGURUSAN TINGKATAN 6
  // ==========================================
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Induk Pengurusan Tingkatan 6",
    description: "Merancang perancangan strategik, takwim, jadual waktu, serta kewangan bagi Pusat Tingkatan Enam.",
    senarai_tugas: "1. Merancang dan melaksanakan perancangan strategik Pusat Tingkatan Enam.\n2. Merancang dan mengurus pembukaan kelas.\n3. Merancang dan mengurus pembukaan pakej mata pelajaran.\n4. Mengurus perancangan takwim.\n5. Mengurus jadual waktu P&P dan agihan tugasan guru.\n6. Mengurus kursus dan latihan untuk guru.\n7. Menyelia kutipan data dan maklumat guru serta murid.\n8. Mengurus anggaran belanjawan tahunan.\n9. Menyelia semua jenis kutipan/ bayaran.\n10. Menyelia dan menyemak stok/ inventori peralatan.\n11. Membuat penilaian prestasi guru.",
    sasaran_kerja: "Memastikan semua perancangan strategik, takwim, pengurusan kelas, belanjawan dan penilaian prestasi guru Tingkatan 6 dilaksanakan dengan sistematik sepanjang tahun.",
    default_positions: [
      "Pengetua",
      "Penolong Kanan T6",
      "Setiausaha Eksekutif",
      "Ketua Unit Sains",
      "Ketua Unit Sains Sosial",
      "Ketua Unit Penilaian & Pentaksiran",
      "Ketua Unit HEM T6",
      "Ketua Unit Kokurikulum",
      "Kaunselor T6",
      "Penyelaras Pusat Sumber Tingkatan 6",
      "Setiausaha 1",
      "Setiausaha 2",
      "Bendahari"
    ]
  },
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Pengurusan Kurikulum Tingkatan 6",
    description: "Menyelaras perancangan kurikulum, jadual waktu, agihan tugas guru dan pelaksanaan PdP mengikut struktur semester.",
    senarai_tugas: "1. Menyelaras perancangan kurikulum, jadual waktu, agihan tugas guru dan pelaksanaan PdP mengikut struktur semester.\n2. Memantau kemajuan pengajaran, penyelesaian sukatan dan pelaksanaan kerja kursus atau tugasan yang berkaitan.\n3. Menganalisis prestasi murid mengikut mata pelajaran dan semester.\n4. Merancang intervensi akademik, bimbingan individu, pengayaan dan persediaan peperiksaan.\n5. Menyelaras PLC, perkongsian amalan terbaik dan pemantauan kualiti PdP.\n6. Memastikan penggunaan data pencapaian dalam perancangan penambahbaikan kurikulum.",
    sasaran_kerja: "- 100% mata pelajaran mempunyai perancangan pengajaran mengikut keperluan kurikulum.\n- 100% mata pelajaran menyediakan analisis prestasi selepas pentaksiran utama.\n- Sekurang-kurangnya 2 aktiviti PLC bagi setiap mata pelajaran dilaksanakan setahun.\n- Sekurang-kurangnya 90% program intervensi yang dirancang dilaksanakan.\n- Pencapaian STPM meningkat berbanding data asas mengikut sasaran mata pelajaran dan kohort yang ditetapkan oleh sekolah.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Pengurusan Hal Ehwal Murid Tingkatan 6",
    description: "Menyelaras kebajikan, disiplin, kehadiran dan pembangunan sahsiah murid Tingkatan Enam.",
    senarai_tugas: "1. Menyelaras kebajikan, disiplin, kehadiran dan pembangunan sahsiah murid Tingkatan Enam.\n2. Memantau rekod murid dan mengenal pasti murid yang berisiko dari segi kehadiran, pencapaian atau kesejahteraan.\n3. Melaksanakan intervensi bersama guru kelas, kaunselor, ibu bapa dan pihak berkaitan.\n4. Menggalakkan kepimpinan, kematangan, tanggungjawab dan budaya pembelajaran kendiri.\n5. Menyelaras bantuan dan sokongan murid mengikut kelayakan serta prosedur semasa.",
    sasaran_kerja: "- 100% rekod murid dikemas kini mengikut keperluan.\n- Purata kehadiran murid mencapai sasaran sekolah dan meningkat berbanding data asas.\n- 100% murid berisiko yang dikenal pasti menerima tindakan susulan atau rujukan yang bersesuaian.\n- Sekurang-kurangnya 3 program pembangunan sahsiah, kesejahteraan atau kepimpinan dilaksanakan setahun.\n- Sekurang-kurangnya 90% tindakan susulan HEM yang dirancang diselesaikan dalam tempoh ditetapkan.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Pengurusan Unit Penilaian dan Pentaksiran Tingkatan 6",
    description: "Menyelaras urusan peperiksaan STPM dan pentaksiran lain yang ditetapkan oleh MPM.",
    senarai_tugas: "1. Menyelaras urusan peperiksaan STPM dan pentaksiran lain yang ditetapkan oleh MPM.\n2. Memastikan guru dan murid memahami takwim, peraturan, prosedur pendaftaran serta keperluan pentaksiran.\n3. Menyelaras urusan pendaftaran calon, penyediaan dokumen dan penghantaran maklumat mengikut arahan semasa.\n4. Memantau pelaksanaan kerja kursus, pentaksiran berasaskan sekolah atau komponen lain yang berkaitan.\n5. Menyemak ketepatan data, rekod markah dan dokumen sokongan.\n6. Menganalisis keputusan serta menyelaras intervensi bagi meningkatkan pencapaian calon.",
    sasaran_kerja: "- 100% urusan pendaftaran dan penghantaran maklumat calon diselesaikan mengikut tarikh akhir.\n- 100% guru dan murid yang terlibat diberikan maklumat pentaksiran yang diperlukan.\n- 100% rekod pentaksiran disemak sebelum pengesahan atau penghantaran.\n- 100% kerja kursus dan tugasan pentaksiran dipantau berdasarkan jadual serta peraturan semasa.\n- Analisis keputusan disediakan selepas keputusan rasmi diumumkan, diikuti pelan penambahbaikan yang bersesuaian.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Pengurusan Kokurikulum Tingkatan 6",
    description: "Merancang dan menyelaras aktiviti kokurikulum yang sesuai dengan keperluan murid Tingkatan Enam.",
    senarai_tugas: "1. Merancang dan menyelaras aktiviti kokurikulum yang sesuai dengan keperluan murid Tingkatan Enam.\n2. Menggalakkan penglibatan murid dalam kepimpinan, kesukarelawanan, sukan dan aktiviti kemasyarakatan.\n3. Menyelaras guru penasihat, jadual aktiviti, penggunaan kemudahan dan pengurusan keselamatan.\n4. Memastikan rekod penyertaan dan pencapaian murid dikemas kini mengikut keperluan.\n5. Menilai keberkesanan program dan menggalakkan penglibatan murid secara seimbang.",
    sasaran_kerja: "- 100% aktiviti kokurikulum yang diwajibkan dilaksanakan mengikut ketetapan semasa.\n- Sekurang-kurangnya 2 program kepimpinan, kesukarelawanan atau kemasyarakatan dilaksanakan setahun.\n- 100% rekod penyertaan murid dikemas kini.\n- Sekurang-kurangnya 80% murid sasaran menyertai aktiviti yang dirancang.\n- Sekurang-kurangnya 90% program yang dirancang dilaksanakan dengan laporan lengkap.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "Tingkatan 6",
    name: "Jawatankuasa Pengurusan Pusat Sumber Tingkatan 6",
    description: "Menyediakan bahan rujukan akademik, sumber digital dan kemudahan pembelajaran untuk murid Tingkatan Enam.",
    senarai_tugas: "1. Menyediakan bahan rujukan akademik, sumber digital dan kemudahan pembelajaran untuk murid Tingkatan Enam.\n2. Menyelaras penggunaan bahan rujukan STPM, jurnal, bahan ilmiah dan sumber penyelidikan.\n3. Membimbing murid tentang literasi maklumat, pencarian sumber, penilaian kesahihan maklumat dan etika akademik.\n4. Menggalakkan pembelajaran kendiri, pembacaan ilmiah dan penggunaan sumber digital secara berkesan.\n5. Memantau penggunaan bahan dan mengemukakan keperluan penambahbaikan sumber pembelajaran.",
    sasaran_kerja: "- 100% koleksi bahan Tingkatan Enam direkod dan disemak mengikut jadual.\n- Sekurang-kurangnya 2 program literasi maklumat atau kemahiran penyelidikan dilaksanakan setahun.\n- Sekurang-kurangnya 80% murid Tingkatan Enam menyertai satu aktiviti literasi maklumat atau penggunaan sumber pembelajaran.\n- Sekurang-kurangnya 1 penilaian keperluan bahan rujukan dilaksanakan setiap semester.\n- Penggunaan sumber pembelajaran meningkat berbanding data asas, jika rekod penggunaan tersedia.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },

  // ==========================================
  // 6. PENGURUSAN PROGRAM PENDIDIKAN KHAS INTEGRASI (PPKI)
  // ==========================================
  {
    category: "PPKI",
    name: "Jawatankuasa Pengurusan Pendidikan Khas Sekolah (JPKS)",
    description: "Menyelaras pentadbiran, kurikulum, IEP (Pelan Pendidikan Individu), dan infrastruktur bagi murid berkeperluan khas.",
    senarai_tugas: "1. Merancang dan melaksanakan perancangan strategic PPKI.\n2. Merancang dan mengurus pembukaan kelas.\n3. Merancang dan mengurus pembukaan pakej mata pelajaran.\n4. Mengurus perancangan takwim.\n5. Mengurus jadual waktu P&P dan agihan tugasan guru.\n6. Mengurus kursus dan latihan untuk guru.\n7. Menyelia kutipan data dan maklumat guru serta murid.\n8. Mengurus anggaran belanjawan tahunan.\n9. Menyelia semua jenis kutipan/ bayaran.\n10. Menyelia dan menyemak stok/ inventori peralatan.\n11. Membuat penilaian prestasi guru.\n12. Merancang jaringan kolaboratif dengan agensi luar.",
    sasaran_kerja: "1. Penyediaan Pelan Strategik & Takwim Pendidikan Khas 100% disediakan sebelum minggu ke-2 sesi persekolahan.\n2. 100% Penyediaan & pelaksanaan IEP (Pelan Pendidikan Individu) untuk semua MBK setiap semester.\n3. Sekurang-kurangnya 2 kolaborasi luar untuk program PPKI (latihan, lawatan, khidmat sokongan) setahun.\n4. 100% laporan tahunan program PPKI disiapkan untuk pentadbiran dan PPD/JPN sebelum sesi persekolahan berakhir.",
    default_positions: [
      "Pengerusi",
      "Naib Pengerusi 1",
      "Naib Pengerusi 2",
      "Naib Pengerusi 3",
      "Naib Pengerusi 4",
      "Naib Pengerusi 5",
      "Setiausaha",
      "AJK",
      "AJK/ Guru UBK",
      "AJK/ Guru Perdana",
      "AJK Ibu bapa"
    ]
  },
  {
    category: "PPKI",
    name: "Jawatankuasa Pengurusan Kurikulum PPKI",
    description: "Merancang dan menyelaras pelaksanaan kurikulum yang bersesuaian dengan keupayaan, potensi dan keperluan murid berkeperluan pendidikan khas (MBPK).",
    senarai_tugas: "1. Merancang dan menyelaras pelaksanaan kurikulum yang bersesuaian dengan keupayaan, potensi dan keperluan murid berkeperluan pendidikan khas (MBPK).\n2. Memastikan Rancangan Pendidikan Individu disediakan, dilaksanakan, dipantau dan dikaji semula bagi setiap murid yang berkenaan.\n3. Menyelaras pentaksiran, rekod perkembangan dan penilaian keberkesanan intervensi pembelajaran.\n4. Merancang program pengukuhan kemahiran asas, komunikasi, pengurusan diri, sosial dan kemahiran berfungsi mengikut keperluan murid.\n5. Menggalakkan pelaksanaan Program Pendidikan Inklusif (PPI) bagi murid yang sesuai berdasarkan penilaian dan ketetapan semasa.\n6. Menyelaras perkongsian amalan terbaik, bahan pengajaran yang diubah suai dan kerjasama profesional.",
    sasaran_kerja: "- 100% MBPK yang berkenaan mempunyai RPI yang disediakan dan dikemas kini mengikut panduan semasa KPM.\n- 100% murid mempunyai rekod perkembangan pembelajaran dan pentaksiran yang relevan.\n- Sekurang-kurangnya 2 sesi semakan perkembangan dan keberkesanan intervensi dilaksanakan bagi setiap murid dalam setahun, atau mengikut keperluan RPI.\n- 100% murid menerima intervensi atau pengubahsuaian pembelajaran yang dirancang berdasarkan keperluan masing-masing.\n- Sekurang-kurangnya 80% murid menunjukkan kemajuan dalam sekurang-kurangnya satu indikator pembelajaran atau kemahiran individu yang ditetapkan.\n- Peluang inklusif dikenal pasti dan dinilai bagi setiap murid yang berpotensi, mengikut kesesuaian serta ketetapan semasa.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "PPKI",
    name: "Jawatankuasa Pengurusan Hal Ehwal Murid PPKI",
    description: "Menyelaras pengurusan kehadiran, kebajikan, disiplin, kesihatan dan keselamatan MBPK.",
    senarai_tugas: "1. Menyelaras pengurusan kehadiran, kebajikan, disiplin, kesihatan dan keselamatan MBPK.\n2. Memastikan keperluan sokongan, pengawasan dan bantuan pengurusan diri dikenal pasti serta diurus dengan sewajarnya.\n3. Bekerjasama dengan ibu bapa atau penjaga untuk menyokong perkembangan, tingkah laku, kesihatan dan kehadiran murid.\n4. Menyelaras program kemahiran sosial, komunikasi, pengurusan diri, keselamatan diri dan tingkah laku positif.\n5. Mengurus rujukan kepada pihak berkaitan apabila murid memerlukan sokongan tambahan.\n6. Memastikan rekod kebajikan, intervensi dan insiden diurus secara sulit serta mengikut prosedur.",
    sasaran_kerja: "- 100% rekod kehadiran dan kebajikan MBPK dikemas kini mengikut keperluan.\n- 100% murid yang dikenal pasti memerlukan sokongan mempunyai tindakan susulan yang bersesuaian.\n- Sekurang-kurangnya 4 program kemahiran sosial, keselamatan diri, pengurusan diri atau kesejahteraan dilaksanakan setahun.\n- Sekurang-kurangnya 2 sesi komunikasi atau perbincangan perkembangan dilaksanakan dengan ibu bapa atau penjaga setiap tahun, atau mengikut keperluan murid.\n- Sekurang-kurangnya 80% murid sasaran menunjukkan perkembangan positif dalam indikator kemahiran kendiri atau sosial yang ditetapkan.\n- 100% insiden keselamatan atau kebajikan yang berlaku direkod dan ditindaklanjuti mengikut prosedur.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  },
  {
    category: "PPKI",
    name: "Jawatankuasa Pengurusan Kokurikulum PPKI",
    description: "Merancang aktiviti kokurikulum yang sesuai dengan keupayaan, minat, kebolehan dan keperluan MBPK.",
    senarai_tugas: "1. Merancang aktiviti kokurikulum yang sesuai dengan keupayaan, minat, kebolehan dan keperluan MBPK.\n2. Menyediakan peluang penyertaan dalam aktiviti badan beruniform, kelab dan persatuan serta sukan dan permainan mengikut kesesuaian.\n3. Menyesuaikan aktiviti, peralatan, arahan dan kaedah penyertaan untuk memastikan keselamatan serta akses yang munasabah.\n4. Menggalakkan pembangunan bakat, komunikasi, interaksi sosial, keyakinan diri dan kemahiran bekerjasama.\n5. Menyelaras penyertaan MBPK dalam aktiviti bersama murid arus perdana apabila sesuai.\n6. Merekod penyertaan, perkembangan, pencapaian dan keperluan sokongan murid.",
    sasaran_kerja: "- 100% MBPK diberi peluang menyertai aktiviti kokurikulum yang bersesuaian dengan keupayaan dan keperluan masing-masing.\n- Sekurang-kurangnya 90% aktiviti kokurikulum yang dirancang dilaksanakan.\n- Sekurang-kurangnya 2 program pembangunan bakat, sukan adaptif atau interaksi sosial dilaksanakan setahun.\n- 100% aktiviti yang memerlukan pengubahsuaian mempunyai perancangan sokongan dan keselamatan yang sesuai.\n- Sekurang-kurangnya 80% murid sasaran menunjukkan peningkatan dalam indikator penyertaan, keyakinan diri, kemahiran sosial atau kemahiran motor yang ditetapkan.\n- Sekurang-kurangnya 1 aktiviti bersama murid arus perdana dirancang jika sesuai dan mendapat kelulusan sekolah.",
    default_positions: ["Pengerusi", "Penyelaras", "Setiausaha", "AJK"]
  }
];