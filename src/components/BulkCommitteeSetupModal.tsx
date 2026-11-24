import { useState, useEffect } from 'react';
import { X, Layers, CheckSquare, Square, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { committeeTemplates } from '../lib/committeeTemplates';

interface BulkCommitteeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  existingCommittees: any[];
  onSuccess: () => void;
}

export default function BulkCommitteeSetupModal({ isOpen, onClose, schoolId, existingCommittees, onSuccess }: BulkCommitteeSetupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // Group templates
  const coreCategories = ['Pentadbiran', 'Kurikulum', 'Hal Ehwal Murid', 'Kokurikulum'];
  const optionalCategories = ['Tingkatan 6', 'PPKI'];

  // Filter out templates that already exist in the database (by name)
  const existingNames = new Set(existingCommittees.map(c => c.name.toLowerCase()));
  const availableTemplates = committeeTemplates.filter(t => !existingNames.has(t.name.toLowerCase()));

  const coreTemplates = availableTemplates.filter(t => coreCategories.includes(t.category));
  const optionalTemplates = availableTemplates.filter(t => optionalCategories.includes(t.category));

  useEffect(() => {
    if (isOpen) {
      // By default, pre-select all available CORE templates, leave optional unselected
      const initialSelection = new Set(coreTemplates.map(t => t.name));
      setSelectedTemplates(initialSelection);
    }
  }, [isOpen]);

  const toggleSelection = (templateName: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateName)) {
      newSelection.delete(templateName);
    } else {
      newSelection.add(templateName);
    }
    setSelectedTemplates(newSelection);
  };

  const toggleGroup = (groupTemplates: any[], selectAll: boolean) => {
    const newSelection = new Set(selectedTemplates);
    groupTemplates.forEach(t => {
      if (selectAll) newSelection.add(t.name);
      else newSelection.delete(t.name);
    });
    setSelectedTemplates(newSelection);
  };

  const handleSubmit = async () => {
    if (selectedTemplates.size === 0 || !schoolId) return;
    setIsSubmitting(true);

    const templatesToInsert = committeeTemplates
      .filter(t => selectedTemplates.has(t.name))
      .map(t => ({
        school_id: schoolId,
        category: t.category,
        name: t.name,
        description: t.description,
        senarai_tugas: t.senarai_tugas,
        sasaran_kerja: t.sasaran_kerja,
        default_positions: t.default_positions || [] // <-- BARIS DITAMBAH
      }));

    const { error } = await supabase.from('committees').insert(templatesToInsert);

    setIsSubmitting(false);

    if (error) {
      alert('Gagal menjana jawatankuasa: ' + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink/10 text-ink flex items-center justify-center border border-ink/20">
              <Layers size={16} />
            </div>
            <h3 className="text-sm font-semibold text-ink">Penetapan Pukal Jawatankuasa</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-3 bg-sky/5 border-b border-sky/10 flex items-start gap-2.5 shrink-0">
          <Info size={16} className="text-sky shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Sistem secara automatik menapis jawatankuasa yang telah wujud. Anda boleh memilih untuk memasukkan jawatankuasa wajib (Teras) dan mengabaikan program khusus (seperti PPKI & Tingkatan 6) jika tidak berkaitan dengan sekolah anda.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {availableTemplates.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Semua templat standard telah digunakan. Tiada templat baharu untuk ditambah.
            </div>
          ) : (
            <>
              {/* CORE COMMITTEES */}
              {coreTemplates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modul Teras (Wajib)</h4>
                    <button 
                      onClick={() => toggleGroup(coreTemplates, !coreTemplates.every(t => selectedTemplates.has(t.name)))}
                      className="text-[10px] font-bold text-ink hover:underline uppercase"
                    >
                      {coreTemplates.every(t => selectedTemplates.has(t.name)) ? 'Nyahpilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {coreTemplates.map(t => (
                      <div 
                        key={t.name}
                        onClick={() => toggleSelection(t.name)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplates.has(t.name) ? 'bg-slate-50 border-ink/40 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="mt-0.5 shrink-0 text-ink">
                          {selectedTemplates.has(t.name) ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink leading-tight">{t.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OPTIONAL COMMITTEES */}
              {optionalTemplates.length > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modul Pilihan (Khusus)</h4>
                    <button 
                      onClick={() => toggleGroup(optionalTemplates, !optionalTemplates.every(t => selectedTemplates.has(t.name)))}
                      className="text-[10px] font-bold text-ink hover:underline uppercase"
                    >
                      {optionalTemplates.every(t => selectedTemplates.has(t.name)) ? 'Nyahpilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {optionalTemplates.map(t => (
                      <div 
                        key={t.name}
                        onClick={() => toggleSelection(t.name)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplates.has(t.name) ? 'bg-slate-50 border-ink/40 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="mt-0.5 shrink-0 text-ink">
                          {selectedTemplates.has(t.name) ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink leading-tight">{t.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs font-medium text-slate-500">
            {selectedTemplates.size} jawatankuasa dipilih
          </p>
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
              Batal
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTemplates.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
              Jana {selectedTemplates.size > 0 ? selectedTemplates.size : ''} Jawatankuasa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}