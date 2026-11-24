import React, { useState, useEffect } from 'react';
import { X, Search, Briefcase, Percent, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  committeeId: string;
  schoolId: string;
  initialRole?: string;
  editData?: any; // Added to support updating existing members
  onSuccess: () => void;
}

export default function AssignStaffModal({ isOpen, onClose, committeeId, schoolId, initialRole, editData, onSuccess }: AssignStaffModalProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [role, setRole] = useState('Ahli Jawatankuasa');
  const [weightage, setWeightage] = useState<number>(5);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (editData) {
        setSelectedStaffId(editData.staff?.id || null);
        setRole(editData.role || 'Ahli Jawatankuasa');
        setWeightage(editData.workload_weightage || 5);
      } else {
        setSelectedStaffId(null);
        setRole(initialRole || 'Ahli Jawatankuasa');
        setWeightage(initialRole?.toLowerCase() === 'pengerusi' ? 15 : initialRole?.toLowerCase() === 'setiausaha' ? 10 : 5);
      }
      fetchActiveStaff();
    }
  }, [isOpen, initialRole, editData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStaff(staffList);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredStaff(staffList.filter(s => s.name.toLowerCase().includes(lowerQuery) || (s.jawatan && s.jawatan.toLowerCase().includes(lowerQuery))));
    }
  }, [searchQuery, staffList]);

  async function fetchActiveStaff() {
    setIsLoadingStaff(true);
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, jawatan, gred, avatar_url')
      .eq('school_id', schoolId)
      .neq('status', 'Tidak Aktif')
      .order('name');

    if (!error && data) {
      setStaffList(data);
      setFilteredStaff(data);
    }
    setIsLoadingStaff(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !committeeId) return;

    setIsSubmitting(true);

    try {
      if (editData) {
        // UPDATE EXISTING RECORD
        const { error } = await supabase
          .from('staff_committees')
          .update({
            role: role,
            workload_weightage: weightage
          })
          .eq('id', editData.id);

        if (error) throw error;
      } else {
        // CHECK FOR DUPLICATE BEFORE INSERT
        const { data: existing } = await supabase
          .from('staff_committees')
          .select('id')
          .eq('committee_id', committeeId)
          .eq('staff_id', selectedStaffId)
          .single();

        if (existing) {
          throw new Error('Warga sekolah ini sudah berada di dalam jawatankuasa ini.');
        }

        // INSERT NEW RECORD
        const { data: profile } = await supabase.from('school_profile').select('current_session').eq('school_id', schoolId).single();
        const session = profile?.current_session || '2026/2027';

        const { error } = await supabase.from('staff_committees').insert({
          staff_id: selectedStaffId,
          committee_id: committeeId,
          school_id: schoolId,
          role: role,
          workload_weightage: weightage,
          academic_session: session
        });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Ralat: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-sm font-semibold text-ink">{editData ? 'Kemas Kini Ahli' : 'Tugaskan Ahli Jawatankuasa'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="assign-staff-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Staff Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Warga Sekolah</label>
            
            {!selectedStaffId ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-64 bg-white">
                <div className="relative border-b border-slate-100 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau jawatan..." 
                    className="w-full pl-9 pr-3 py-2.5 text-xs text-ink outline-none bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {isLoadingStaff ? (
                    <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
                  ) : filteredStaff.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-8">Tiada padanan ditemui.</p>
                  ) : (
                    filteredStaff.map(staff => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setSelectedStaffId(staff.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 overflow-hidden shrink-0">
                          {staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover" /> : staff.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{staff.name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{staff.jawatan} {staff.gred ? `(${staff.gred})` : ''}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center text-[11px] font-bold text-slate-600 border border-slate-200 overflow-hidden shrink-0">
                    {selectedStaff?.avatar_url ? <img src={selectedStaff.avatar_url} className="w-full h-full object-cover" /> : selectedStaff?.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{selectedStaff?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{selectedStaff?.jawatan}</p>
                  </div>
                </div>
                {!editData && (
                  <button type="button" onClick={() => setSelectedStaffId(null)} className="text-[10px] font-bold text-slate-500 hover:text-ink px-2 py-1 bg-white border border-slate-200 rounded-md shrink-0">
                    Tukar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hierarki / Peranan</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  placeholder="Cth: Penyelaras"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
            </div>

            {/* Weightage Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemberatan Tugas</label>
              <div className="relative">
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  required 
                  value={weightage} 
                  onChange={(e) => setWeightage(Number(e.target.value))} 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
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
            form="assign-staff-form"
            disabled={!selectedStaffId || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Simpan Tugasan
          </button>
        </div>
      </div>
    </div>
  );
}