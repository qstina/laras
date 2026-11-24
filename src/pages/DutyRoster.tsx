import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Printer, 
  MapPin, Coffee, Shield, Megaphone, Plus, MoreHorizontal, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper function to dynamically map icon strings from DB to Lucide components
const getIcon = (type: string) => {
  switch (type) {
    case 'shield': return Shield;
    case 'coffee': return Coffee;
    case 'megaphone': return Megaphone;
    case 'mappin': return MapPin;
    default: return MapPin;
  }
};

export default function DutyRoster() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const temp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    return Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  });
  const [roster, setRoster] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchRoster() {
      setIsLoading(true);
      
      // Fetch the roster for the selected week AND all assigned staff tasks
      const { data, error } = await supabase
        .from('duty_rosters')
        .select(`
          *,
          duty_tasks (
            is_leader,
            location,
            time_desc,
            icon_type,
            theme_color,
            staff (
              name,
              avatar_url
            )
          )
        `)
        .eq('week_number', currentWeek)
        .eq('academic_session', '2026/2027')
        .maybeSingle(); // maybeSingle allows null if no roster exists for that week

      if (!error && data) {
        setRoster(data);
      } else {
        setRoster(null); // No data for this week
      }
      
      setIsLoading(false);
    }

    fetchRoster();
  }, [currentWeek]);

  // Separate leader from members for UI rendering
  const leader = roster?.duty_tasks?.find((t: any) => t.is_leader);
  const members = roster?.duty_tasks?.filter((t: any) => !t.is_leader) || [];
  const locations = roster?.duty_tasks?.filter((t: any) => t.location) || []; // Tasks that have a specific location assigned

  const weekStart = (() => {
    const year = new Date().getFullYear();
    const jan4 = new Date(year, 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (currentWeek - 1) * 7);
    return monday;
  })();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const todayKey = new Date().toDateString();

  return (
    <div className="max-w-384 mx-auto space-y-4 lg:space-y-6 relative print-container">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1 hide-on-print">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Jadual tugas mingguan</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">Urus kumpulan guru bertugas dan lokasi kawalan dengan lebih jelas.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => window.print()}
            className="bg-white border border-slate-200 text-ink hover:bg-slate-50 rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer size={14} />
            Cetak jadual
          </button>
          <button 
            onClick={() => alert("Modul penetapan tugas baharu akan datang dalam kemas kini seterusnya.")}
            className="bg-ink hover:opacity-90 text-white rounded-lg font-medium h-9 px-4 text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            Tugas baru
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 hide-on-print">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-ink hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            aria-label="Minggu sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-forest/10 text-forest flex items-center justify-center border border-forest/20 shrink-0">
              <Calendar size={16} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-ink leading-tight">Minggu {currentWeek}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {roster?.date_range || weekDays[0].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' }) + ' – ' + weekDays[6].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentWeek(prev => Math.min(52, prev + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-ink hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            aria-label="Minggu seterusnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === todayKey;
            const isWeekend = index >= 5;
            const labels = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
            return (
              <div
                key={date.toISOString()}
                className={`rounded-lg px-1 py-2.5 text-center transition-colors ${
                  isToday ? 'bg-ink text-white' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-white/70' : 'text-slate-400'}`}>
                  {labels[index].slice(0, 3)}
                </p>
                <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-white' : isWeekend ? 'text-rose' : 'text-ink'}`}>
                  {date.getDate()}
                </p>
                <span className={`mt-1.5 mx-auto block w-1 h-1 rounded-sm ${isToday ? 'bg-white' : isWeekend ? 'bg-rose/50' : 'bg-slate-300'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white border border-slate-200 rounded-xl">
          <Loader2 size={24} className="animate-spin text-ink" />
          <p className="text-xs font-medium text-slate-500">Memuatkan Jadual...</p>
        </div>
      ) : !roster ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white border border-dashed border-slate-300 rounded-xl hide-on-print">
          <Calendar size={32} className="text-slate-300" />
          <div className="text-center">
            <h2 className="text-sm font-semibold text-ink">Tiada Jadual Tugasan</h2>
            <p className="text-[11px] text-slate-500 mt-1">Belum ada kumpulan ditugaskan untuk Minggu {currentWeek}.</p>
          </div>
          <button 
            onClick={() => alert("Fungsi auto-jana jadual bertugas dalam pembangunan.")}
            className="px-4 py-2 bg-slate-100 border border-slate-200 text-ink rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Jana Jadual Minggu {currentWeek}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 print-friendly">
          
          {/* Left Column: Group Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-ink">{roster.group_name}</h3>
                <span className="px-2 py-1 bg-forest/10 border border-forest/20 text-forest text-[10px] font-bold uppercase tracking-wide rounded-md">Minggu {currentWeek}</span>
              </div>

              {/* Leader */}
              {leader && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ketua Kumpulan</p>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0">
                      {leader.staff?.avatar_url ? <img src={leader.staff.avatar_url} alt="" className="w-full h-full object-cover" /> : leader.staff?.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{leader.staff?.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">Penyedia Laporan</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ahli Kumpulan</p>
                <div className="space-y-2.5">
                  {members.map((member: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0">
                        {member.staff?.avatar_url ? <img src={member.staff.avatar_url} alt="" className="w-full h-full object-cover" /> : member.staff?.name.substring(0,2).toUpperCase()}
                      </div>
                      <p className="text-xs font-medium text-ink truncate">{member.staff?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Locations Grid */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3 px-1 hide-on-print">
              <h3 className="text-sm font-semibold text-ink">Agihan Lokasi & Tugasan</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {locations.length > 0 ? locations.map((loc: any, idx: number) => {
                const Icon = getIcon(loc.icon_type);
                // Map legacy DB color names to LARAS semantic palette
                const colorConfig = {
                  blue: 'text-sky bg-sky/10 border-sky/20',
                  orange: 'text-amber bg-amber/10 border-amber/20',
                  pink: 'text-rose bg-rose/10 border-rose/20',
                  emerald: 'text-forest bg-forest/10 border-forest/20',
                }[loc.theme_color as string] || 'text-slate-500 bg-slate-100 border-slate-200';

                return (
                  <div key={idx} className="p-4 lg:p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${colorConfig}`}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <button className="text-slate-400 hover:text-ink p-1.5 rounded-md hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 hide-on-print">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <h4 className="text-sm font-semibold text-ink mb-1 truncate">{loc.location}</h4>
                    <p className="text-[11px] text-slate-500 mb-4">{loc.time_desc}</p>
                    
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 mt-auto">
                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
                        {loc.staff?.avatar_url ? <img src={loc.staff.avatar_url} alt="" className="w-full h-full object-cover" /> : loc.staff?.name.substring(0,2).toUpperCase()}
                      </div>
                      <p className="text-xs font-medium text-ink truncate">{loc.staff?.name}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-1 sm:col-span-2 p-8 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-xl">
                  Tiada lokasi spesifik ditetapkan untuk minggu ini.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Global CSS for Print specific to this component */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .hide-on-print { display: none !important; }
        }
      `}} />
    </div>
  );
}