import React, { useState } from 'react';
import { X, Briefcase, Tag, FileText, Loader2, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { committeeTemplates } from '../lib/committeeTemplates';

interface CreateCommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  defaultCategory: string;
  onSuccess: () => void;
}

export default function CreateCommitteeModal({ isOpen, onClose, schoolId, defaultCategory, onSuccess }: CreateCommitteeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationMode, setCreationMode] = useState<'template' | 'manual'>('template');
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [senaraiTugas, setSenaraiTugas] = useState('');
  const [sasaranKerja, setSasaranKerja] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | ''>('');

  React.useEffect(() => {
    if (isOpen) {
      setCreationMode('template');
      setCategory(defaultCategory);
      setName('');
      setDescription('');
      setSenaraiTugas('');
      setSasaranKerja('');
      setSelectedTemplateIndex('');
    }
  }, [isOpen, defaultCategory]);

  const handleTemplateSelect = (index: number | '') => {
    setSelectedTemplateIndex(index);
    if (index !== '') {
      const template = committeeTemplates[index as number];
      setName(template.name);
      setCategory(template.category);
      setDescription(template.description);
      setSenaraiTugas(template.senarai_tugas);
      setSasaranKerja(template.sasaran_kerja);
    } else {
      setName('');
      setDescription('');
      setSenaraiTugas('');
      setSasaranKerja('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !schoolId) return;

    setIsSubmitting(true);
    
    // Cari default_positions jika ia dari templat
    let defaults: string[] = [];
    if (creationMode === 'template' && selectedTemplateIndex !== '') {
      defaults = committeeTemplates[selectedTemplateIndex as number].default_positions || [];
    }

    const { error } = await supabase.from('committees').insert({
      school_id: schoolId,
      name: name,
      category: category,
      description: description,
      senarai_tugas: senaraiTugas,
      sasaran_kerja: sasaranKerja,
      default_positions: defaults // <-- BARIS DITAMBAH
    });

    setIsSubmitting(false);

    if (error) {
      alert('Gagal mencipta jawatankuasa: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  const availableTemplates = committeeTemplates.filter(t => t.category === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-sm font-semibold text-ink">Tambah Jawatankuasa Baru</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-5 pt-5 pb-2 shrink-0">
           <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setCreationMode('template')}
               className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${creationMode === 'template' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
             >
               Guna Templat Sedia Ada
             </button>
             <button 
               onClick={() => setCreationMode('manual')}
               className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${creationMode === 'manual' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
             >
               Bina Secara Manual
             </button>
           </div>
        </div>

        {/* Body */}
        <form id="create-committee-form" onSubmit={handleSubmit} className="px-5 pb-5 pt-2 overflow-y-auto flex-1 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Pengurusan</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                required 
                value={category} 
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSelectedTemplateIndex('');
                }} 
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink appearance-none cursor-pointer"
              >
                <option value="Pentadbiran">Pentadbiran</option>
                <option value="Kurikulum">Kurikulum</option>
                <option value="Hal Ehwal Murid">Hal Ehwal Murid</option>
                <option value="Kokurikulum">Kokurikulum</option>
                <option value="Tingkatan 6">Tingkatan 6</option>
                <option value="PPKI">PPKI</option>
              </select>
            </div>
          </div>

          {creationMode === 'template' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Templat Jawatankuasa</label>
              <div className="relative">
                <Copy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  required={creationMode === 'template'}
                  value={selectedTemplateIndex} 
                  onChange={(e) => handleTemplateSelect(e.target.value !== '' ? Number(e.target.value) : '')} 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink appearance-none cursor-pointer"
                >
                  <option value="" disabled>-- Pilih dari senarai --</option>
                  {availableTemplates.map((t) => {
                    const idx = committeeTemplates.indexOf(t);
                    return <option key={idx} value={idx}>{t.name}</option>;
                  })}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Jawatankuasa</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Cth: Panitia Bahasa Melayu"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Tugas (Ringkas)</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3}
                placeholder="Terangkan fungsi utama jawatankuasa ini..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink resize-none" 
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
            Batal
          </button>
          <button 
            type="submit" 
            form="create-committee-form"
            disabled={isSubmitting || !name}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Cipta Jawatankuasa
          </button>
        </div>
      </div>
    </div>
  );
}