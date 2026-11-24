import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Loader2, Tag, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StaffProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null; // Null means Add New Staff
  schoolId: string | null;
  onSuccess: () => void;
}

export default function StaffProfileDrawer({ isOpen, onClose, staffId, schoolId, onSuccess }: StaffProfileDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Guru');
  const [jawatan, setJawatan] = useState('');
  const [gred, setGred] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Aktif');

  useEffect(() => {
    if (isOpen) {
      if (staffId) {
        fetchStaffDetails();
      } else {
        // Reset form for New Staff
        setName('');
        setType('Guru');
        setJawatan('');
        setGred('');
        setDepartment('');
        setEmail('');
        setStatus('Aktif');
        setIsLoading(false);
      }
    }
  }, [isOpen, staffId]);

  async function fetchStaffDetails() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (!error && data) {
      setName(data.name || '');
      setType(data.type || 'Guru');
      setJawatan(data.jawatan || '');
      setGred(data.gred || '');
      setDepartment(data.department || '');
      setEmail(data.email || '');
      setStatus(data.status || 'Aktif');
    } else {
      alert("Gagal memuat profil warga.");
      onClose();
    }
    setIsLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !schoolId) return;

    setIsSaving(true);

    const payload = {
      school_id: schoolId,
      name,
      type,
      jawatan,
      gred,
      department,
      email: email ? email.toLowerCase() : null,
      status
    };

    let error;

    if (staffId) {
      // Update
      const res = await supabase.from('staff').update(payload).eq('id', staffId);
      error = res.error;
    } else {
      // Insert
      const res = await supabase.from('staff').insert([payload]);
      error = res.error;
    }

    setIsSaving(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!staffId) return;
    const confirmDelete = window.confirm(
      `Adakah anda pasti mahu membuang rekod ${name}?\n\nTindakan ini akan memadam rekod staf ini secara kekal dan mengeluarkan beliau daripada sebarang jawatankuasa.`
    );
    
    if (!confirmDelete) return;
    setIsDeleting(true);

    try {
      // 1. Delete associated assignments first to prevent foreign key constraint errors
      const { error: commError } = await supabase
        .from('staff_committees')
        .delete()
        .eq('staff_id', staffId);
      
      if (commError) throw commError;

      // 2. Delete the staff record
      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);
      
      if (staffError) throw staffError;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Gagal memadam rekod: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-ink">{staffId ? 'Profil Warga' : 'Tambah Warga Baharu'}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{staffId ? 'Kemas kini maklumat dan tugasan.' : 'Daftar staf secara manual.'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-ink hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <form id="staff-form" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Penuh</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Nama mengikut kad pengenalan..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Staf</label>
                <select 
                  required 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink appearance-none cursor-pointer"
                >
                  <option value="Guru">Guru</option>
                  <option value="Sokongan">Sokongan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select 
                  required 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink appearance-none cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                  <option value="Berpindah">Berpindah</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jawatan</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={jawatan} 
                    onChange={(e) => setJawatan(e.target.value)} 
                    placeholder="Cth: Guru Akademik"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gred</label>
                <input 
                  type="text" 
                  required 
                  value={gred} 
                  onChange={(e) => setGred(e.target.value)} 
                  placeholder="Cth: DG44"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opsyen Dominan / Jabatan / Unit</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  placeholder="Cth: Bahasa Melayu / Guru Kaunseling"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk menjana cadangan agihan tugas automatik.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emel (Pilihan)</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="guru@sekolah.edu.my"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 transition-all text-ink" 
                />
              </div>
            </div>

          </form>
        )}

        {/* Footer Actions */}
        {!isLoading && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            {staffId ? (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose bg-white border border-rose/20 hover:bg-rose/5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Buang Warga
              </button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}
            
            <div className="flex items-center gap-2.5">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="staff-form"
                disabled={isSaving || !name || !jawatan || !gred}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-ink rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Simpan Profil
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}